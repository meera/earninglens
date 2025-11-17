#!/usr/bin/env python3
"""
Sync Job to Production Database

After testing locally, use this script to sync the earnings_calls record to production.
"""

import sys
import os
import yaml
from pathlib import Path

# Add lens to path
LENS_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(LENS_DIR))

from steps.update_database import update_database


def sync_job_to_production(job_yaml_path: str, production_db_url: str):
    """
    Sync a job's data to production database

    Args:
        job_yaml_path: Path to job.yaml
        production_db_url: Production DATABASE_URL
    """
    job_file = Path(job_yaml_path)
    if not job_file.exists():
        print(f"❌ Job file not found: {job_yaml_path}")
        sys.exit(1)

    job_dir = job_file.parent

    # Load job data
    with open(job_file, 'r') as f:
        job_data = yaml.safe_load(f)

    job_id = job_data.get('job_id', 'unknown')

    print(f"🔄 Syncing job to production: {job_id}")
    print(f"   Job file: {job_yaml_path}")
    print(f"   Production DB: {production_db_url[:50]}...")
    print()

    # Confirm with user
    response = input("Continue? (y/n): ").strip().lower()
    if response != 'y':
        print("❌ Cancelled")
        sys.exit(0)

    # Set production DATABASE_URL
    original_db_url = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = production_db_url

    try:
        # Run update_database step
        print("💾 Updating production database...")
        result = update_database(job_dir, job_data)

        print()
        print("✅ Successfully synced to production!")
        print(f"   Record ID: {result.get('record_id')}")
        print(f"   Operation: {result.get('operation')}")
        print(f"   Updated at: {result.get('updated_at')}")

    except Exception as e:
        print(f"❌ Failed to sync: {e}")
        sys.exit(1)
    finally:
        # Restore original DATABASE_URL
        if original_db_url:
            os.environ['DATABASE_URL'] = original_db_url


def main():
    if len(sys.argv) < 2:
        print("Usage: python sync_to_production.py <job.yaml> [production_db_url]")
        print()
        print("Examples:")
        print("  # Use DATABASE_URL from environment")
        print("  python lens/scripts/sync_to_production.py /var/markethawk/jobs/job_youtube-ffmpeg_wvcx/job.yaml")
        print()
        print("  # Or specify production URL directly")
        print("  python lens/scripts/sync_to_production.py /var/markethawk/jobs/job_youtube-ffmpeg_wvcx/job.yaml 'postgresql://...'")
        sys.exit(1)

    job_yaml_path = sys.argv[1]

    # Get production DATABASE_URL
    if len(sys.argv) >= 3:
        production_db_url = sys.argv[2]
    else:
        production_db_url = os.getenv('PRODUCTION_DATABASE_URL') or os.getenv('DATABASE_URL')

    if not production_db_url:
        print("❌ No production DATABASE_URL found!")
        print("   Set PRODUCTION_DATABASE_URL environment variable or pass as argument")
        sys.exit(1)

    sync_job_to_production(job_yaml_path, production_db_url)


if __name__ == '__main__':
    main()
