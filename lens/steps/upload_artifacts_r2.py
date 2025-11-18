"""
Upload Artifacts to R2 - Upload transcript and insights JSON to R2 storage
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Get R2 bucket based on environment (dev vs prod)
DEV_MODE = os.getenv('DEV_MODE', 'false').lower() == 'true'
R2_BUCKET = 'dev-markethawkeye' if DEV_MODE else 'markeyhawkeye'


def upload_artifacts_r2(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload transcript.json and insights.json to R2 storage

    Args:
        job_dir: Job directory path
        job_data: Job data dict (must contain company info for R2 path)

    Returns:
        Result dict with r2:// URLs for artifacts
    """
    # Get company info for R2 path
    company = job_data.get('company', {})
    confirmed_meta = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    # Use confirmed metadata if available, else fall back to company data
    company_name = confirmed_meta.get('company') or company.get('name')
    ticker = confirmed_meta.get('ticker') or company.get('ticker')
    quarter = confirmed_meta.get('quarter') or company.get('quarter')
    year = confirmed_meta.get('year') or company.get('year')
    job_id = job_data.get('job_id')

    if not all([ticker, quarter, year, job_id]):
        raise ValueError(
            f"Missing required fields for R2 path: ticker={ticker}, quarter={quarter}, year={year}, job_id={job_id}"
        )

    # Generate slug from company name
    if company_name:
        slug = company_name.lower().replace(' ', '-').replace('.', '').replace(',', '')
    elif ticker:
        slug = ticker.lower()
    else:
        slug = 'unknown'

    # R2 base path: <company-slug>/<year>/<quarter>/<job-id>/
    r2_base_path = f"{slug}/{year}/{quarter}/{job_id}"

    artifacts = {}

    # Upload transcript.json
    transcript_file = job_dir / 'transcripts' / 'transcript.json'
    if transcript_file.exists():
        r2_transcript_path = f"{r2_base_path}/transcripts/transcript.json"
        print(f"📤 Uploading transcript to R2: {r2_transcript_path}")

        cmd = [
            'rclone',
            'copyto',
            str(transcript_file),
            f"r2-markethawkeye:{R2_BUCKET}/{r2_transcript_path}",
            '--s3-no-check-bucket'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            # Use r2:// URL format (signed URL generated on-demand)
            transcript_r2_url = f"r2://{R2_BUCKET}/{r2_transcript_path}"

            # Get file metadata
            file_size = transcript_file.stat().st_size
            with open(transcript_file, 'r') as f:
                transcript_data = json.load(f)
                segment_count = len(transcript_data.get('segments', []))
                speakers = len(set(seg.get('speaker', 'unknown') for seg in transcript_data.get('segments', [])))

            artifacts['transcript'] = {
                'r2_url': transcript_r2_url,
                'r2_path': r2_transcript_path,
                'file_size_bytes': file_size,
                'segment_count': segment_count,
                'speakers': speakers,
                'format': 'whisperx_json',
                'uploaded_at': datetime.now().isoformat()
            }
            print(f"✅ Transcript uploaded: {transcript_r2_url}")
        else:
            print(f"❌ Failed to upload transcript: {result.stderr}")
            raise Exception(f"Transcript upload failed: {result.stderr}")
    else:
        print(f"⚠️  Transcript not found: {transcript_file}")

    # Upload insights.json (check both insights.raw.json and insights.json)
    insights_file = job_dir / 'insights.raw.json'
    if not insights_file.exists():
        insights_file = job_dir / 'insights.json'

    if insights_file.exists():
        r2_insights_path = f"{r2_base_path}/insights.json"
        print(f"📤 Uploading insights to R2: {r2_insights_path}")

        cmd = [
            'rclone',
            'copyto',
            str(insights_file),
            f"r2-markethawkeye:{R2_BUCKET}/{r2_insights_path}",
            '--s3-no-check-bucket'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            insights_r2_url = f"r2://{R2_BUCKET}/{r2_insights_path}"

            # Get file metadata
            file_size = insights_file.stat().st_size
            with open(insights_file, 'r') as f:
                insights_data = json.load(f)
                # Extract from nested 'insights' object if present
                insights_obj = insights_data.get('insights', insights_data)
                metrics_count = len(insights_obj.get('financial_metrics', []))
                highlights_count = len(insights_obj.get('highlights', []))

            artifacts['insights'] = {
                'r2_url': insights_r2_url,
                'r2_path': r2_insights_path,
                'file_size_bytes': file_size,
                'metrics_count': metrics_count,
                'highlights_count': highlights_count,
                'format': 'openai_structured_output',
                'uploaded_at': datetime.now().isoformat()
            }
            print(f"✅ Insights uploaded: {insights_r2_url}")
        else:
            print(f"❌ Failed to upload insights: {result.stderr}")
            raise Exception(f"Insights upload failed: {result.stderr}")
    else:
        print(f"⚠️  Insights not found: {insights_file}")

    # Upload job.json (with speakers list)
    job_yaml_file = job_dir / 'job.yaml'
    if job_yaml_file.exists():
        # Convert job.yaml to job.json
        import yaml
        job_json_file = job_dir / 'job.json'

        # Load YAML and save as JSON
        with open(job_yaml_file, 'r') as f:
            job_yaml_data = yaml.safe_load(f)

        # Write to temp JSON file
        with open(job_json_file, 'w') as f:
            json.dump(job_yaml_data, f, indent=2)

        r2_job_path = f"{r2_base_path}/job.json"
        print(f"📤 Uploading job.json to R2: {r2_job_path}")

        cmd = [
            'rclone',
            'copyto',
            str(job_json_file),
            f"r2-markethawkeye:{R2_BUCKET}/{r2_job_path}",
            '--s3-no-check-bucket'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            job_r2_url = f"r2://{R2_BUCKET}/{r2_job_path}"

            # Extract speakers from insights
            speakers = []
            if insights_file.exists():
                with open(insights_file, 'r') as f:
                    insights_data = json.load(f)
                    insights_obj = insights_data.get('insights', insights_data)
                    speakers = insights_obj.get('speakers', [])

            artifacts['job'] = {
                'r2_url': job_r2_url,
                'r2_path': r2_job_path,
                'file_size_bytes': job_json_file.stat().st_size,
                'speakers_count': len(speakers),
                'format': 'job_metadata_json',
                'uploaded_at': datetime.now().isoformat()
            }
            print(f"✅ Job metadata uploaded: {job_r2_url}")
        else:
            print(f"❌ Failed to upload job.json: {result.stderr}")
            # Don't raise exception, this is optional

    # Upload transcript.paragraphs.json (if exists)
    paragraphs_file = job_dir / 'transcripts' / 'transcript.paragraphs.json'
    if paragraphs_file.exists():
        r2_paragraphs_path = f"{r2_base_path}/transcripts/transcript.paragraphs.json"
        print(f"📤 Uploading paragraphs to R2: {r2_paragraphs_path}")

        cmd = [
            'rclone',
            'copyto',
            str(paragraphs_file),
            f"r2-markethawkeye:{R2_BUCKET}/{r2_paragraphs_path}",
            '--s3-no-check-bucket'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            paragraphs_r2_url = f"r2://{R2_BUCKET}/{r2_paragraphs_path}"

            artifacts['paragraphs'] = {
                'r2_url': paragraphs_r2_url,
                'r2_path': r2_paragraphs_path,
                'file_size_bytes': paragraphs_file.stat().st_size,
                'format': 'whisperx_paragraphs',
                'uploaded_at': datetime.now().isoformat()
            }
            print(f"✅ Paragraphs uploaded: {paragraphs_r2_url}")
        else:
            print(f"⚠️  Failed to upload paragraphs: {result.stderr}")

    if not artifacts:
        raise Exception("No artifacts uploaded")

    return {'artifacts': artifacts}
