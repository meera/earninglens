"""
Download Source Cached Step - Download video from YouTube with caching
"""

import shutil
from pathlib import Path
from typing import Dict, Any
from datetime import datetime


def download_source_cached(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Download video from YouTube URL (checks cache first)

    Cache location: /var/markethawk/_downloads/<video_id>/

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with downloaded file info
    """
    # Get input URL
    input_data = job_data.get('input', {})
    input_type = input_data.get('type')
    youtube_url = input_data.get('value')

    if input_type != 'youtube_url' or not youtube_url:
        raise ValueError(f"Invalid input: expected youtube_url, got {input_type}")

    # Extract video ID
    video_id = None
    if "youtu.be/" in youtube_url:
        video_id = youtube_url.split("youtu.be/")[1].split("?")[0]
    elif "youtube.com/watch?v=" in youtube_url:
        video_id = youtube_url.split("v=")[1].split("&")[0]

    if not video_id:
        raise ValueError(f"Could not extract video ID from URL: {youtube_url}")

    print(f"📥 Downloading YouTube video: {video_id}")
    print(f"   URL: {youtube_url}")

    # Check cache first
    cache_dir = Path("/var/markethawk/_downloads") / video_id
    cached_video = cache_dir / "source.mp4"
    cached_metadata = cache_dir / "metadata.json"

    if cached_video.exists():
        print(f"✅ Found in cache: {cache_dir}")
        print(f"   Copying to job directory...")

        # Copy from cache to job input directory
        input_dir = job_dir / "input"
        input_dir.mkdir(parents=True, exist_ok=True)

        dest_video = input_dir / "source.mp4"
        shutil.copy2(cached_video, dest_video)

        if cached_metadata.exists():
            dest_metadata = input_dir / "metadata.json"
            shutil.copy2(cached_metadata, dest_metadata)

        file_size = dest_video.stat().st_size

        return {
            'source': 'youtube_cached',
            'video_id': video_id,
            'file_path': str(dest_video),
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'cached': True,
            'downloaded_at': datetime.now().isoformat()
        }

    # Not in cache - download using download_source script
    print(f"⏬ Not in cache, downloading...")

    from scripts.download_source import download_video

    # Download to cache
    result = download_video(youtube_url, downloads_dir="/var/markethawk/_downloads")

    # Copy from cache to job input directory
    input_dir = job_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=True)

    source_video = Path(result['file_path'])
    dest_video = input_dir / "source.mp4"
    shutil.copy2(source_video, dest_video)

    if result.get('metadata_path'):
        source_metadata = Path(result['metadata_path'])
        if source_metadata.exists():
            dest_metadata = input_dir / "metadata.json"
            shutil.copy2(source_metadata, dest_metadata)

    file_size = dest_video.stat().st_size

    print(f"✅ Downloaded and cached: {cache_dir}")
    print(f"   Copied to: {dest_video}")
    print(f"   Size: {file_size / (1024 * 1024):.1f} MB")

    return {
        'source': 'youtube',
        'video_id': video_id,
        'file_path': str(dest_video),
        'file_size_bytes': file_size,
        'file_size_mb': round(file_size / (1024 * 1024), 2),
        'title': result.get('title', ''),
        'description': result.get('description', ''),
        'duration_seconds': result.get('duration', 0),
        'cached': False,
        'downloaded_at': datetime.now().isoformat()
    }
