#!/usr/bin/env python3
"""
Update YouTube video description without re-uploading video
"""

import yaml
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Import from upload_youtube.py
sys.path.insert(0, str(Path(__file__).parent))
from upload_youtube import get_youtube_client, build_description

def update_video_description(video_id: str, metadata_file: Path):
    """
    Update YouTube video description

    Args:
        video_id: YouTube video ID
        metadata_file: Path to job.yaml with metadata
    """
    # Load job metadata
    with open(metadata_file, 'r') as f:
        job_data = yaml.safe_load(f)

    # Build new description
    description = build_description(job_data)

    print(f"📝 New description preview:")
    print("=" * 60)
    print(description)
    print("=" * 60)
    print()

    # Confirm update
    confirm = input("Update YouTube description? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        return

    # Get YouTube client
    youtube = get_youtube_client()

    # Get current video details (to preserve title, tags, etc.)
    video_response = youtube.videos().list(
        part='snippet',
        id=video_id
    ).execute()

    if not video_response['items']:
        print(f"❌ Video not found: {video_id}")
        return

    snippet = video_response['items'][0]['snippet']

    # Update description while preserving other fields
    snippet['description'] = description

    # Update video
    update_response = youtube.videos().update(
        part='snippet',
        body={
            'id': video_id,
            'snippet': snippet
        }
    ).execute()

    print(f"✅ Description updated for video: {video_id}")
    print(f"   URL: https://youtube.com/watch?v={video_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update YouTube video description")
    parser.add_argument("--video-id", required=True, help="YouTube video ID")
    parser.add_argument("--metadata", required=True, help="Path to job.yaml")

    args = parser.parse_args()

    update_video_description(args.video_id, Path(args.metadata))
