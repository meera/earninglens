#!/usr/bin/env python3
"""
Batch Processor for MarketHawk YouTube Video Processing

Processes a batch of YouTube videos through the 8-step pipeline:
1. Download (YouTube via Rapid API)
2. Transcribe (WhisperX with diarization)
3. Insights (GPT-4 with auto-detection)
4. Validate (Check is_earnings_call flag)
5. Fuzzy Match (Match company against database)
6. Extract Audio (ffmpeg MP3 extraction)
7. Upload R2 (rclone upload to Cloudflare)
8. Update DB (psql update to PostgreSQL)

Usage:
    python lens/batch_processor.py /var/markethawk/batch_runs/nov-13-2025-audio-only/batch_001/batch.yaml
"""

import argparse
import subprocess
import yaml
import json
import os
import sys
import shutil
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Add lens directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from lib.fuzzy_match import load_matcher
from extract_insights_structured import extract_earnings_insights_auto
from scripts.download_source import download_video


class BatchProcessor:
    """Process batch of YouTube videos through pipeline"""

    def __init__(self, batch_yaml: Path):
        """
        Initialize batch processor

        Args:
            batch_yaml: Path to batch.yaml file
        """
        self.batch_yaml = batch_yaml
        self.batch_dir = batch_yaml.parent
        self.log_file = self.batch_dir / 'batch.log'

        # Load environment variables
        load_dotenv()

        # Load batch config
        with open(batch_yaml, 'r') as f:
            self.batch_config = yaml.safe_load(f)

        # Get batch_name and pipeline type
        self.batch_name = self.batch_config.get('batch_name', 'unknown')
        self.pipeline_type = self.batch_config.get('pipeline_type', 'audio-only')

        # Job storage directory (unified with single-job pipeline)
        self.jobs_dir = Path('/var/markethawk/jobs')
        self.jobs_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        # Load company matcher
        self.company_matcher = load_matcher()

        self.log(f"Batch Processor initialized")
        self.log(f"Batch: {self.batch_dir.name}")
        self.log(f"Batch name: {self.batch_name}")
        self.log(f"Pipeline type: {self.pipeline_type}")
        self.log(f"Jobs: {len(self.batch_config['jobs'])}")

    def log(self, message: str, level: str = 'INFO'):
        """
        Write log message to batch.log and stdout

        Args:
            message: Log message
            level: Log level (INFO, ERROR, WARNING)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_line = f"[{timestamp}] [{level}] {message}"

        print(log_line)

        with open(self.log_file, 'a') as f:
            f.write(log_line + '\n')

    def save_batch_config(self):
        """Save updated batch config to YAML"""
        with open(self.batch_yaml, 'w') as f:
            yaml.dump(self.batch_config, f, default_flow_style=False, sort_keys=False)

    def create_job_yaml(self, job: Dict, job_dir: Path):
        """
        Create job.yaml for individual job (single source of truth)

        Args:
            job: Job dictionary from batch config
            job_dir: Job directory path
        """
        job_yaml = {
            'job_id': job['job_id'],
            'youtube_id': job['youtube_id'],
            'batch_id': self.batch_config.get('batch_num'),
            'batch_name': self.batch_name,
            'pipeline_type': self.pipeline_type,
            'created_at': datetime.now().isoformat(),

            # Company info (populated after fuzzy match)
            'company': job.get('company_match', {}),

            # Insights (populated after extraction)
            'insights': job.get('insights', {}),

            # Processing steps
            'processing': {
                'download': job['steps'].get('download', 'pending'),
                'transcribe': job['steps'].get('transcribe', 'pending'),
                'insights': job['steps'].get('insights', 'pending'),
                'validate': job['steps'].get('validate', 'pending'),
                'fuzzy_match': job['steps'].get('fuzzy_match', 'pending'),
                'extract_audio': job['steps'].get('extract_audio', 'pending'),
                'upload_r2': job['steps'].get('upload_r2', 'pending'),
                'update_db': job['steps'].get('update_db', 'pending'),
            },

            # R2 output
            'r2': job.get('r2_upload', {}),

            # Audio file info
            'audio_file': job.get('audio_file', {}),

            # YouTube metadata
            'youtube_metadata': job.get('youtube_metadata', {}),
        }

        job_yaml_path = job_dir / 'job.yaml'
        with open(job_yaml_path, 'w') as f:
            yaml.dump(job_yaml, f, default_flow_style=False, sort_keys=False)

    def update_job_yaml(self, job: Dict, job_dir: Path):
        """Update job.yaml with latest state"""
        self.create_job_yaml(job, job_dir)  # Recreate with updated data

    def update_job_status(self, job: Dict, step: str, status: str, error: Optional[str] = None):
        """
        Update job step status

        Args:
            job: Job dictionary
            step: Step name
            status: Status (pending, processing, completed, failed, skipped)
            error: Optional error message
        """
        job['steps'][step] = status
        if error:
            if 'errors' not in job:
                job['errors'] = {}
            job['errors'][step] = error

        # Update overall job status
        if status == 'failed':
            job['status'] = 'failed'
        elif all(s in ['completed', 'skipped'] for s in job['steps'].values()):
            job['status'] = 'completed'
        elif any(s == 'processing' for s in job['steps'].values()):
            job['status'] = 'processing'

        self.save_batch_config()

    def update_batch_stats(self):
        """Recalculate batch statistics"""
        stats = {
            'total': len(self.batch_config['jobs']),
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'failed': 0,
            'skipped': 0
        }

        for job in self.batch_config['jobs']:
            status = job.get('status', 'pending')
            if status in stats:
                stats[status] += 1

        self.batch_config['stats'] = stats
        self.save_batch_config()

    def run_command(self, cmd: List[str], cwd: Optional[Path] = None) -> tuple[int, str, str]:
        """
        Run shell command and capture output

        Args:
            cmd: Command as list of strings
            cwd: Working directory

        Returns:
            (return_code, stdout, stderr)
        """
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        return result.returncode, result.stdout, result.stderr

    def step_download(self, job: Dict, job_dir: Path) -> bool:
        """
        Step 1: Download YouTube video

        Args:
            job: Job dictionary
            job_dir: Job directory path

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 1: Download")
        self.update_job_status(job, 'download', 'processing')

        youtube_id = job['youtube_id']
        job_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        # Create source directory
        source_dir = job_dir / 'source'
        source_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        dest_video_path = source_dir / 'source.mp4'
        dest_metadata_path = source_dir / 'metadata.json'

        # Cache directory for downloaded videos (to avoid re-downloading from Rapid API)
        cache_dir = Path('/var/markethawk/_downloads') / youtube_id
        cache_video_path = cache_dir / 'source.mp4'
        cache_metadata_path = cache_dir / 'metadata.json'

        youtube_url = f'https://www.youtube.com/watch?v={youtube_id}'

        try:
            # Check if video is already cached
            if cache_video_path.exists() and cache_metadata_path.exists():
                self.log(f"[{job['job_id']}] ✓ Found cached video: {cache_video_path}")

                # Copy from cache to job directory (keep cache intact)
                shutil.copy2(str(cache_video_path), str(dest_video_path))
                shutil.copy2(str(cache_metadata_path), str(dest_metadata_path))

                # Load metadata from cache
                with open(cache_metadata_path, 'r') as f:
                    metadata = json.load(f)
                    job['youtube_metadata'] = {
                        'title': metadata.get('title', ''),
                        'description': metadata.get('description', ''),
                        'channel': metadata.get('channel', {}),
                        'duration': metadata.get('lengthSeconds', 0)
                    }

                self.update_job_status(job, 'download', 'completed')
                self.log(f"[{job['job_id']}] ✓ Copied from cache: {dest_video_path}")
                return True

            # Not cached - download from YouTube
            self.log(f"[{job['job_id']}] Video not cached, downloading from YouTube...")
            temp_downloads_dir = '/var/markethawk/_downloads'
            result = download_video(youtube_url, temp_downloads_dir)

            # Copy from temp location to job directory (keep cache for future use)
            temp_video_path = Path(result['file_path'])
            temp_metadata_path = Path(result['metadata_path'])

            shutil.copy2(str(temp_video_path), str(dest_video_path))
            shutil.copy2(str(temp_metadata_path), str(dest_metadata_path))

            # Store YouTube metadata in job
            job['youtube_metadata'] = {
                'title': result.get('title', ''),
                'description': result.get('description', ''),
                'channel': result.get('channel', {}),
                'duration': result.get('duration', 0)
            }

            self.update_job_status(job, 'download', 'completed')
            self.log(f"[{job['job_id']}] ✓ Downloaded and cached: {dest_video_path}")
            return True

        except Exception as e:
            error = str(e)
            self.update_job_status(job, 'download', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Download failed: {error}", 'ERROR')
            return False

    def step_transcribe(self, job: Dict, job_dir: Path) -> bool:
        """
        Step 2: Transcribe with WhisperX

        Args:
            job: Job dictionary
            job_dir: Job directory path

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 2: Transcribe")
        self.update_job_status(job, 'transcribe', 'processing')

        # Use source/ and transcripts/ subdirectories
        input_file = job_dir / 'source' / 'source.mp4'
        transcripts_dir = job_dir / 'transcripts'
        transcripts_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        script_path = Path(__file__).parent / 'transcribe_whisperx.py'

        cmd = [
            'python', str(script_path),
            str(input_file),
            '--output-dir', str(transcripts_dir)
        ]

        returncode, stdout, stderr = self.run_command(cmd)

        # Check if transcript.json was created
        transcript_file = transcripts_dir / 'transcript.json'
        if returncode == 0 and transcript_file.exists() and transcript_file.is_file():
            self.update_job_status(job, 'transcribe', 'completed')
            self.log(f"[{job['job_id']}] ✓ Transcribed: {transcript_file}")
            return True
        else:
            error = stderr or 'Transcription failed'
            self.update_job_status(job, 'transcribe', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Transcription failed: {error}", 'ERROR')
            return False

    def step_insights(self, job: Dict, job_dir: Path) -> bool:
        """
        Step 3: Extract insights with GPT-4 auto-detection

        Args:
            job: Job dictionary
            job_dir: Job directory path

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 3: Extract Insights")
        self.update_job_status(job, 'insights', 'processing')

        # Use transcripts/ subdirectory
        transcript_file = job_dir / 'transcripts' / 'transcript.json'
        raw_output_file = job_dir / 'insights.raw.json'

        try:
            # Extract insights with auto-detection
            insights = extract_earnings_insights_auto(
                transcript_file=transcript_file,
                youtube_metadata=job.get('youtube_metadata'),
                output_file=raw_output_file
            )

            # Store insights in job config
            job['insights'] = {
                'is_earnings_call': insights.is_earnings_call,
                'company_name': insights.company_name,
                'company_ticker': insights.company_ticker,
                'quarter': insights.quarter,
                'year': insights.year,
                'speakers': len(insights.speakers),
                'metrics': len(insights.financial_metrics),
                'highlights': len(insights.highlights)
            }

            self.update_job_status(job, 'insights', 'completed')
            self.log(f"[{job['job_id']}] ✓ Insights extracted: {insights.company_name} {insights.quarter} {insights.year}")
            self.log(f"[{job['job_id']}]   is_earnings_call: {insights.is_earnings_call}")

            return True

        except Exception as e:
            error = str(e)
            self.update_job_status(job, 'insights', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Insights extraction failed: {error}", 'ERROR')
            return False

    def step_validate(self, job: Dict) -> bool:
        """
        Step 4: Validate if earnings call

        Args:
            job: Job dictionary

        Returns:
            True if valid earnings call, False to skip
        """
        self.log(f"[{job['job_id']}] Step 4: Validate")
        self.update_job_status(job, 'validate', 'processing')

        is_earnings_call = job['insights']['is_earnings_call']

        if not is_earnings_call:
            self.update_job_status(job, 'validate', 'skipped', 'Not an earnings call')
            self.log(f"[{job['job_id']}] ⊘ Skipped: Not an earnings call")

            # Mark remaining steps as skipped
            for step in ['fuzzy_match', 'extract_audio', 'upload_r2', 'update_db']:
                self.update_job_status(job, step, 'skipped')

            job['status'] = 'skipped'
            self.save_batch_config()
            return False
        else:
            self.update_job_status(job, 'validate', 'completed')
            self.log(f"[{job['job_id']}] ✓ Validated: Is earnings call")
            return True

    def step_fuzzy_match(self, job: Dict) -> bool:
        """
        Step 5: Fuzzy match company against database

        Args:
            job: Job dictionary

        Returns:
            True if matched, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 5: Fuzzy Match Company")
        self.update_job_status(job, 'fuzzy_match', 'processing')

        company_name = job['insights']['company_name']
        company_ticker = job['insights'].get('company_ticker')

        try:
            match = self.company_matcher.match(company_name, company_ticker)

            if match:
                job['company_match'] = {
                    'cik_str': match.cik_str,
                    'symbol': match.symbol,
                    'name': match.name,
                    'slug': match.slug,
                    'score': match.score,
                    'match_type': match.match_type
                }

                self.update_job_status(job, 'fuzzy_match', 'completed')
                self.log(f"[{job['job_id']}] ✓ Matched: {match.name} ({match.symbol}) [score: {match.score:.1f}%, type: {match.match_type}]")
                return True
            else:
                error = f"No match found for: {company_name}"
                self.update_job_status(job, 'fuzzy_match', 'failed', error)
                self.log(f"[{job['job_id']}] ✗ No match found for: {company_name}", 'ERROR')
                return False

        except Exception as e:
            error = str(e)
            self.update_job_status(job, 'fuzzy_match', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Fuzzy match failed: {error}", 'ERROR')
            return False

    def step_extract_audio(self, job: Dict, job_dir: Path) -> bool:
        """
        Step 6: Extract audio as MP3 using ffmpeg

        Args:
            job: Job dictionary
            job_dir: Job directory path

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 6: Extract Audio")
        self.update_job_status(job, 'extract_audio', 'processing')

        # Use source/ subdirectory
        input_file = job_dir / 'source' / 'source.mp4'
        output_file = job_dir / 'audio.mp3'

        # ffmpeg command: extract audio to MP3
        cmd = [
            'ffmpeg',
            '-i', str(input_file),
            '-vn',  # No video
            '-acodec', 'libmp3lame',
            '-ab', '128k',  # 128 kbps
            '-ar', '44100',  # 44.1 kHz
            '-y',  # Overwrite
            str(output_file)
        ]

        returncode, stdout, stderr = self.run_command(cmd)

        if returncode == 0 and output_file.exists():
            # Get file size
            file_size_mb = output_file.stat().st_size / (1024 * 1024)
            job['audio_file'] = {
                'path': str(output_file),
                'size_mb': round(file_size_mb, 2)
            }

            self.update_job_status(job, 'extract_audio', 'completed')
            self.log(f"[{job['job_id']}] ✓ Audio extracted: {output_file} ({file_size_mb:.2f} MB)")
            return True
        else:
            error = stderr or 'Audio extraction failed'
            self.update_job_status(job, 'extract_audio', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Audio extraction failed: {error}", 'ERROR')
            return False

    def step_upload_r2(self, job: Dict, job_dir: Path) -> bool:
        """
        Step 7: Upload to Cloudflare R2 using rclone

        Args:
            job: Job dictionary
            job_dir: Job directory path

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 7: Upload to R2")
        self.update_job_status(job, 'upload_r2', 'processing')

        audio_file = Path(job['audio_file']['path'])
        company_slug = job['company_match']['slug']
        quarter = job['insights']['quarter']
        year = job['insights']['year']
        job_id = job['job_id']

        # R2 path: {company_slug}/{quarter}-{year}/{batch_name}-{job_id}/audio.mp3
        # Example: nvidia/Q3-2025/nov-13-2025-test-xw6oCFYNz8c_a328/audio.mp3
        r2_path = f"{company_slug}/{quarter}-{year}/{self.batch_name}-{job_id}/audio.mp3"

        # rclone upload command
        cmd = [
            'rclone',
            'copyto',
            str(audio_file),
            f"r2-markethawkeye:markeyhawkeye/{r2_path}",
            '--s3-no-check-bucket',  # Required for R2 nested paths
            '--progress'
        ]

        returncode, stdout, stderr = self.run_command(cmd)

        if returncode == 0:
            # Construct public URL
            public_url = f"https://a8e524fbf66f8c16fe95c513c6ef5dac.r2.cloudflarestorage.com/markeyhawkeye/{r2_path}"

            job['r2_upload'] = {
                'path': r2_path,
                'public_url': public_url,
                'uploaded_at': datetime.now().isoformat()
            }

            self.update_job_status(job, 'upload_r2', 'completed')
            self.log(f"[{job['job_id']}] ✓ Uploaded to R2: {r2_path}")
            return True
        else:
            error = stderr or 'R2 upload failed'
            self.update_job_status(job, 'upload_r2', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ R2 upload failed: {error}", 'ERROR')
            return False

    def step_update_db(self, job: Dict) -> bool:
        """
        Step 8: Update PostgreSQL database using psql

        Args:
            job: Job dictionary

        Returns:
            True if successful, False otherwise
        """
        self.log(f"[{job['job_id']}] Step 8: Update Database")
        self.update_job_status(job, 'update_db', 'processing')

        # Build SQL INSERT statement
        cik_str = job['company_match']['cik_str']
        symbol = job['company_match']['symbol']
        quarter = job['insights']['quarter']
        year = job['insights']['year']
        r2_url = job['r2_upload']['public_url']
        youtube_id = job['youtube_id']

        # Metadata JSON
        metadata = {
            'youtube_id': youtube_id,
            'job_id': job['job_id'],
            'version': self.version,
            'r2_path': job['r2_upload']['path'],
            'processed_at': datetime.now().isoformat()
        }

        sql = f"""
INSERT INTO markethawkeye.earnings_calls
  (cik_str, symbol, quarter, year, audio_url, youtube_id, metadata)
VALUES
  ('{cik_str}', '{symbol}', '{quarter}', {year}, '{r2_url}', '{youtube_id}', '{json.dumps(metadata)}'::jsonb)
ON CONFLICT (cik_str, quarter, year) DO UPDATE
SET
  audio_url = EXCLUDED.audio_url,
  youtube_id = EXCLUDED.youtube_id,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
"""

        # Write SQL to temp file
        sql_file = Path(f"/tmp/batch_update_{job['job_id']}.sql")
        with open(sql_file, 'w') as f:
            f.write(sql)

        # Execute with psql
        cmd = [
            'psql',
            '-h', '192.168.86.250',
            '-p', '54322',
            '-U', 'postgres',
            '-d', 'postgres',
            '-f', str(sql_file)
        ]

        # Set PGPASSWORD env var for authentication
        env = os.environ.copy()
        env['PGPASSWORD'] = os.getenv('PGPASSWORD', 'postgres')

        # Pass env to subprocess
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )
        returncode, stdout, stderr = result.returncode, result.stdout, result.stderr

        # Clean up temp file
        sql_file.unlink()

        if returncode == 0:
            self.update_job_status(job, 'update_db', 'completed')
            self.log(f"[{job['job_id']}] ✓ Database updated")
            return True
        else:
            error = stderr or 'Database update failed'
            self.update_job_status(job, 'update_db', 'failed', error)
            self.log(f"[{job['job_id']}] ✗ Database update failed: {error}", 'ERROR')
            return False

    def process_job(self, job: Dict) -> bool:
        """
        Process single job through all pipeline steps

        Args:
            job: Job dictionary

        Returns:
            True if all steps completed successfully
        """
        job_id = job['job_id']
        self.log(f"\n{'='*60}")
        self.log(f"Processing Job: {job_id}")
        self.log(f"YouTube ID: {job['youtube_id']}")
        self.log(f"{'='*60}\n")

        job['status'] = 'processing'
        self.save_batch_config()

        # Create job directory
        job_dir = self.jobs_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        # Create initial job.yaml
        self.create_job_yaml(job, job_dir)

        # Step 1: Download
        if job['steps']['download'] != 'completed':
            if not self.step_download(job, job_dir):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 2: Transcribe
        if job['steps']['transcribe'] != 'completed':
            if not self.step_transcribe(job, job_dir):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 3: Insights
        if job['steps']['insights'] != 'completed':
            if not self.step_insights(job, job_dir):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 4: Validate
        if job['steps']['validate'] != 'completed':
            if not self.step_validate(job):
                self.update_job_yaml(job, job_dir)
                return True  # Skipped jobs are considered successful
            self.update_job_yaml(job, job_dir)

        # Step 5: Fuzzy Match
        if job['steps']['fuzzy_match'] != 'completed':
            if not self.step_fuzzy_match(job):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 6: Extract Audio
        if job['steps']['extract_audio'] != 'completed':
            if not self.step_extract_audio(job, job_dir):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 7: Upload R2
        if job['steps']['upload_r2'] != 'completed':
            if not self.step_upload_r2(job, job_dir):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # Step 8: Update DB
        if job['steps']['update_db'] != 'completed':
            if not self.step_update_db(job):
                self.update_job_yaml(job, job_dir)
                return False
            self.update_job_yaml(job, job_dir)

        # All steps completed
        job['status'] = 'completed'
        job['completed_at'] = datetime.now().isoformat()
        self.update_job_yaml(job, job_dir)
        self.save_batch_config()

        self.log(f"\n{'='*60}")
        self.log(f"✅ Job Completed: {job_id}")
        self.log(f"{'='*60}\n")

        return True

    def process_batch(self):
        """Process all jobs in batch"""
        self.log(f"\n{'#'*60}")
        self.log(f"# Starting Batch Processing")
        self.log(f"# Batch: {self.batch_dir.name}")
        self.log(f"# Total Jobs: {len(self.batch_config['jobs'])}")
        self.log(f"{'#'*60}\n")

        self.batch_config['status'] = 'processing'
        self.batch_config['started_at'] = datetime.now().isoformat()
        self.save_batch_config()

        # Process each job
        for job in self.batch_config['jobs']:
            # Skip already completed or failed jobs
            if job.get('status') in ['completed', 'skipped']:
                self.log(f"Skipping {job['job_id']} (already {job['status']})")
                continue

            try:
                self.process_job(job)
            except KeyboardInterrupt:
                self.log("Interrupted by user", 'WARNING')
                job['status'] = 'pending'
                self.save_batch_config()
                raise
            except Exception as e:
                self.log(f"Unexpected error processing {job['job_id']}: {e}", 'ERROR')
                job['status'] = 'failed'
                self.save_batch_config()

            # Update batch stats after each job
            self.update_batch_stats()

        # Batch complete
        self.batch_config['status'] = 'completed'
        self.batch_config['completed_at'] = datetime.now().isoformat()
        self.save_batch_config()
        self.update_batch_stats()

        self.log(f"\n{'#'*60}")
        self.log(f"# Batch Processing Complete")
        self.log(f"# Stats: {self.batch_config['stats']}")
        self.log(f"{'#'*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Process batch of YouTube videos through pipeline'
    )
    parser.add_argument(
        'batch_yaml',
        type=Path,
        help='Path to batch.yaml file'
    )

    args = parser.parse_args()

    if not args.batch_yaml.exists():
        print(f"Error: Batch file not found: {args.batch_yaml}")
        return 1

    processor = BatchProcessor(args.batch_yaml)
    processor.process_batch()

    return 0


if __name__ == '__main__':
    exit(main())
