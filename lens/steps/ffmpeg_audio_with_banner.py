"""
FFmpeg Audio with Banner - Render video from audio file + banner image (audio-only workflow)
"""

import subprocess
from pathlib import Path
from typing import Dict, Any


def ffmpeg_audio_with_banner(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Render video using FFmpeg (audio file + banner image)

    For audio-only workflows where source is MP3/M4A/WAV

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with render info
    """

    # Find input audio file
    input_audio = job_dir / "input" / "source.mp3"
    if not input_audio.exists():
        # Try other audio extensions
        audio_files = list((job_dir / "input").glob("source.*"))
        audio_files = [f for f in audio_files if f.suffix.lower() in ['.mp3', '.m4a', '.wav', '.aac', '.flac']]
        if not audio_files:
            raise FileNotFoundError(f"No audio file found in {job_dir / 'input'}")
        input_audio = audio_files[0]

    # Find banner image
    banner_path = job_dir / "renders" / "banner.png"
    if not banner_path.exists():
        raise FileNotFoundError(
            f"Banner image not found: {banner_path}\n"
            "Run 'use_input_banner' or 'create_banner' step first"
        )

    # Renders directory
    renders_dir = job_dir / "renders"

    # Output video path - ALWAYS use "rendered.mp4" regardless of render method
    output_video = renders_dir / "rendered.mp4"

    print(f"🎬 Rendering video with FFmpeg (audio-only mode)...")
    print(f"   Input audio: {input_audio.name}")
    print(f"   Banner: {banner_path.name}")
    print(f"   Output: {output_video.name}")
    print(f"   Strategy: Combine audio file with static banner image")

    # FFmpeg command: banner image as video + audio file
    # Use scale and crop filters to fit banner to 1920x1080 (16:9)
    cmd = [
        'ffmpeg',
        '-loop', '1',                    # Loop the banner image
        '-i', str(banner_path),          # Input: banner image (video track)
        '-i', str(input_audio),          # Input: audio file
        '-vf', 'scale=1920:1920,crop=1920:1080',  # Scale to 1920 width, crop to 16:9
        '-c:v', 'libx264',               # Video codec
        '-tune', 'stillimage',           # Optimize for static image
        '-c:a', 'aac',                   # Audio codec
        '-b:a', '192k',                  # Audio bitrate
        '-pix_fmt', 'yuv420p',           # Pixel format for compatibility
        '-shortest',                     # End when audio ends
        '-y',                            # Overwrite output file
        str(output_video)
    ]

    # Run FFmpeg
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"FFmpeg render failed: {result.stderr}")

    # Get output file info
    file_size = output_video.stat().st_size
    file_size_mb = file_size / (1024 * 1024)

    # Get duration using ffprobe
    duration_cmd = [
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        str(output_video)
    ]
    duration_result = subprocess.run(duration_cmd, capture_output=True, text=True)
    duration_seconds = float(duration_result.stdout.strip()) if duration_result.returncode == 0 else 0

    print(f"✅ Video rendered: {output_video.name}")
    print(f"   Duration: {duration_seconds:.1f}s")
    print(f"   Size: {file_size_mb:.1f} MB")

    return {
        'output_file': str(output_video),
        'banner_image': str(banner_path),
        'duration_seconds': int(duration_seconds),
        'file_size_mb': round(file_size_mb, 2),
        'file_size_bytes': file_size,
        'codec': 'h264',
        'resolution': '1920x1080',
        'renderer': 'ffmpeg',
        'mode': 'audio-only'
    }
