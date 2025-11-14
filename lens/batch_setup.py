#!/usr/bin/env python3
"""
Batch Setup Script for MarketHawk YouTube Video Processing

Creates batch directory structure and YAML configuration files
for processing multiple YouTube videos.

Usage:
    python lens/batch_setup.py video_ids.txt nov-13-2025-audio-only --batch-size 100
"""

import argparse
import uuid
import yaml
from pathlib import Path
from typing import List
from datetime import datetime


def generate_job_id(youtube_id: str) -> str:
    """
    Generate job ID from YouTube video ID

    Format: {youtube_id}_{4-char-uuid}
    Example: dQw4w9WgXcQ_a3b9

    Args:
        youtube_id: YouTube video ID

    Returns:
        Job ID string
    """
    short_uuid = str(uuid.uuid4())[:4]
    return f"{youtube_id}_{short_uuid}"


def create_batch_structure(
    video_ids: List[str],
    batch_name: str,
    batch_size: int,
    base_path: Path,
    pipeline_type: str = "audio-only"
) -> Path:
    """
    Create batch directory structure and configuration files

    Args:
        video_ids: List of YouTube video IDs
        batch_name: Unique batch identifier (e.g., "nov-13-2025-test")
        batch_size: Number of videos per batch
        base_path: Base path for batch runs (/var/markethawk/batch_runs)
        pipeline_type: Type of processing pipeline (e.g., "audio-only", "video-full", "thumbnails", "shorts")

    Returns:
        Path to pipeline directory
    """
    # Create pipeline directory using batch_name
    pipeline_dir = base_path / batch_name
    pipeline_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

    print(f"\n📁 Creating batch structure: {pipeline_dir}")
    print(f"   Batch name: {batch_name}")
    print(f"   Pipeline type: {pipeline_type}")
    print(f"   Total videos: {len(video_ids)}")
    print(f"   Batch size: {batch_size}")

    # Split video IDs into batches
    batches = []
    for i in range(0, len(video_ids), batch_size):
        batch_videos = video_ids[i:i + batch_size]
        batch_num = len(batches) + 1
        batches.append({
            'batch_num': batch_num,
            'videos': batch_videos
        })

    print(f"   Total batches: {len(batches)}\n")

    # Create batch directories and configs
    batch_configs = []
    jobs_dir = Path('/var/markethawk/jobs')
    jobs_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

    for batch in batches:
        batch_num = batch['batch_num']
        batch_dir = pipeline_dir / f"batch_{batch_num:03d}"
        batch_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

        # Create lightweight job references for batch.yaml
        jobs = []
        for youtube_id in batch['videos']:
            job_id = generate_job_id(youtube_id)

            # Create job directory
            job_dir = jobs_dir / job_id
            job_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

            # Create initial job.yaml
            job_yaml = {
                'job_id': job_id,
                'youtube_id': youtube_id,
                'batch_id': batch_num,
                'batch_name': batch_name,
                'pipeline_type': pipeline_type,
                'created_at': datetime.now().isoformat(),
                'status': 'pending',

                # Processing steps
                'processing': {
                    'download': 'pending',
                    'transcribe': 'pending',
                    'insights': 'pending',
                    'validate': 'pending',
                    'fuzzy_match': 'pending',
                    'extract_audio': 'pending',
                    'upload_r2': 'pending',
                    'update_db': 'pending'
                }
            }

            job_yaml_path = job_dir / 'job.yaml'
            with open(job_yaml_path, 'w') as f:
                yaml.dump(job_yaml, f, default_flow_style=False, sort_keys=False)

            # Lightweight reference in batch.yaml
            jobs.append({
                'job_id': job_id,
                'youtube_id': youtube_id,
                'status': 'pending',
                'job_yaml': str(job_yaml_path),
                'steps': {  # Keep steps for backward compatibility
                    'download': 'pending',
                    'transcribe': 'pending',
                    'insights': 'pending',
                    'validate': 'pending',
                    'fuzzy_match': 'pending',
                    'extract_audio': 'pending',
                    'upload_r2': 'pending',
                    'update_db': 'pending'
                }
            })

        # Create lightweight batch.yaml
        batch_config = {
            'batch_num': batch_num,
            'batch_name': batch_name,
            'pipeline_type': pipeline_type,
            'created_at': datetime.now().isoformat(),
            'status': 'pending',
            'jobs': jobs,  # Just references
            'stats': {
                'total': len(jobs),
                'pending': len(jobs),
                'processing': 0,
                'completed': 0,
                'failed': 0,
                'skipped': 0
            }
        }

        batch_yaml_path = batch_dir / 'batch.yaml'
        with open(batch_yaml_path, 'w') as f:
            yaml.dump(batch_config, f, default_flow_style=False, sort_keys=False)

        # Create batch.log file
        batch_log_path = batch_dir / 'batch.log'
        batch_log_path.touch(mode=0o644)

        batch_configs.append({
            'batch_num': batch_num,
            'path': str(batch_dir),
            'status': 'pending'
        })

        print(f"   ✓ Created batch_{batch_num:03d} with {len(jobs)} videos")

    # Create pipeline.yaml (overall config) - flatter structure
    pipeline_config = {
        'batch_name': batch_name,
        'pipeline_type': pipeline_type,
        'created_at': datetime.now().isoformat(),
        'batch_size': batch_size,
        'total_batches': len(batches),
        'total_videos': len(video_ids),

        # R2 configuration
        'r2_bucket': 'markeyhawkeye',
        'r2_base_path': batch_name,  # Use batch_name for R2 path

        # Database configuration
        'db_host': '192.168.86.250',
        'db_port': 54322,
        'db_name': 'postgres',
        'db_schema': 'markethawkeye',

        # Batch references
        'batches': batch_configs,

        # Overall stats
        'stats': {
            'pending': len(batches),
            'processing': 0,
            'completed': 0,
            'failed': 0
        }
    }

    pipeline_yaml_path = pipeline_dir / 'pipeline.yaml'
    with open(pipeline_yaml_path, 'w') as f:
        yaml.dump(pipeline_config, f, default_flow_style=False, sort_keys=False)

    print(f"\n✅ Batch structure created successfully!")
    print(f"   Pipeline config: {pipeline_yaml_path}")
    print(f"\n📋 Next steps:")
    print(f"   1. Review: {pipeline_yaml_path}")
    print(f"   2. Process first batch:")
    print(f"      python lens/batch_processor.py {pipeline_dir}/batch_001/batch.yaml")
    print(f"   3. Monitor progress:")
    print(f"      tail -f {pipeline_dir}/batch_001/batch.log\n")

    return pipeline_dir


def read_video_ids(input_file: Path) -> List[str]:
    """
    Read YouTube video IDs from text file

    Args:
        input_file: Path to text file with one video ID per line

    Returns:
        List of video IDs (stripped of whitespace, empty lines removed)
    """
    with open(input_file, 'r') as f:
        video_ids = [line.strip() for line in f if line.strip()]

    # Remove duplicates while preserving order
    seen = set()
    unique_ids = []
    for vid in video_ids:
        if vid not in seen:
            seen.add(vid)
            unique_ids.append(vid)

    if len(video_ids) != len(unique_ids):
        duplicates = len(video_ids) - len(unique_ids)
        print(f"⚠️  Removed {duplicates} duplicate video IDs")

    return unique_ids


def main():
    parser = argparse.ArgumentParser(
        description='Setup batch processing structure for YouTube videos',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create batches of 100 videos with default pipeline type (audio-only)
  python lens/batch_setup.py video_ids.txt nov-13-2025-batch1 --batch-size 100

  # Create batch with specific pipeline type
  python lens/batch_setup.py video_ids.txt nov-13-2025-batch2 --pipeline-type video-full --batch-size 100

  # Create single video batch for testing
  python lens/batch_setup.py test_video.txt nov-13-2025-test --batch-size 1

  # Custom base path with pipeline type
  python lens/batch_setup.py video_ids.txt dec-2025-production \\
    --pipeline-type shorts \\
    --base-path /custom/path \\
    --batch-size 50
        """
    )

    parser.add_argument(
        'input_file',
        type=Path,
        help='Text file with YouTube video IDs (one per line)'
    )
    parser.add_argument(
        'batch_name',
        help='Unique batch identifier (e.g., nov-13-2025-test)'
    )
    parser.add_argument(
        '--pipeline-type',
        default='audio-only',
        help='Pipeline type (default: audio-only, examples: video-full, thumbnails, shorts)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Number of videos per batch (default: 100)'
    )
    parser.add_argument(
        '--base-path',
        type=Path,
        default=Path('/var/markethawk/batch_runs'),
        help='Base path for batch runs (default: /var/markethawk/batch_runs)'
    )

    args = parser.parse_args()

    # Validate input file exists
    if not args.input_file.exists():
        print(f"❌ Error: Input file not found: {args.input_file}")
        return 1

    # Read video IDs
    print(f"\n📖 Reading video IDs from: {args.input_file}")
    video_ids = read_video_ids(args.input_file)

    if not video_ids:
        print("❌ Error: No video IDs found in input file")
        return 1

    print(f"✓ Found {len(video_ids)} unique video IDs")

    # Validate batch size
    if args.batch_size < 1:
        print("❌ Error: Batch size must be at least 1")
        return 1

    # Create batch structure
    create_batch_structure(
        video_ids=video_ids,
        batch_name=args.batch_name,
        batch_size=args.batch_size,
        base_path=args.base_path,
        pipeline_type=args.pipeline_type
    )

    return 0


if __name__ == '__main__':
    exit(main())
