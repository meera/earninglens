"""
Upload Media to R2 - Upload audio/video file to R2 storage
"""

import os
import subprocess
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Load environment variables (auto-loads .env or .env.production based on DEV_MODE)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from env_loader import get_r2_bucket_name


def upload_media_r2(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload media file (audio or video) to R2 storage

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with r2:// URL for media file
    """
    # Get R2 bucket from environment (called at runtime, not import time)
    R2_BUCKET = get_r2_bucket_name()

    # Get job info
    job_id = job_data.get('job_id')
    if not job_id:
        raise ValueError("job_data must contain 'job_id'")

    # Find media file to upload
    # Priority: rendered video > extracted audio > source file
    media_file = None
    media_type = None

    # Check for rendered video (take1.mp4 or latest render)
    renders_dir = job_dir / 'renders'
    if renders_dir.exists():
        renders = list(renders_dir.glob('*.mp4'))
        if renders:
            # Use take1.mp4 if exists, else latest render
            take1 = renders_dir / 'take1.mp4'
            media_file = take1 if take1.exists() else sorted(renders)[-1]
            media_type = 'video'

    # Check for extracted audio
    if not media_file:
        audio_file = job_dir / 'audio' / 'audio.mp3'
        if audio_file.exists():
            media_file = audio_file
            media_type = 'audio'

    # Check for source file in input/
    if not media_file:
        input_dir = job_dir / 'input'
        if input_dir.exists():
            # Look for source.* files
            sources = list(input_dir.glob('source.*'))
            if sources:
                media_file = sources[0]
                # Determine type from extension
                ext = media_file.suffix.lower()
                media_type = 'video' if ext in ['.mp4', '.mov', '.avi', '.mkv'] else 'audio'

    if not media_file:
        raise FileNotFoundError(
            f"No media file found in job directory.\n"
            f"Checked: {job_dir}/renders/*.mp4, {job_dir}/audio/audio.mp3, {job_dir}/input/source.*"
        )

    # Get company info for path structure
    company = job_data.get('company', {})
    confirmed = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    # Use confirmed metadata if available (manual-audio workflow)
    company_name = confirmed.get('company') or company.get('name')
    ticker = confirmed.get('ticker') or company.get('ticker')
    quarter = confirmed.get('quarter') or company.get('quarter')
    year = confirmed.get('year') or company.get('year')

    # Generate slug from company name
    if company_name:
        slug = company_name.lower().replace(' ', '-').replace('.', '').replace(',', '')
    elif ticker:
        slug = ticker.lower()
    else:
        slug = 'unknown'

    # R2 path: <company-slug>/<year>/<quarter>/<job-id>/rendered.mp4
    r2_path = f"{slug}/{year}/{quarter}/{job_id}/{media_file.name}"

    print(f"📤 Uploading {media_type} to R2: {r2_path}")
    print(f"   Source: {media_file}")
    print(f"   Size: {media_file.stat().st_size / (1024*1024):.1f} MB")

    # Upload with rclone
    cmd = [
        'rclone',
        'copyto',
        str(media_file),
        f"r2-markethawkeye:{R2_BUCKET}/{r2_path}",
        '--s3-no-check-bucket',
        '--progress'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"Media upload failed: {result.stderr}")

    # Use r2:// URL format (signed URL generated on-demand)
    media_r2_url = f"r2://{R2_BUCKET}/{r2_path}"

    # Get file metadata
    file_size = media_file.stat().st_size

    print(f"✅ Media uploaded: {media_r2_url}")

    return {
        'media_url': media_r2_url,
        'r2_path': r2_path,
        'file_size_bytes': file_size,
        'file_size_mb': round(file_size / (1024 * 1024), 2),
        'media_type': media_type,
        'filename': media_file.name,
        'uploaded_at': datetime.now().isoformat()
    }
