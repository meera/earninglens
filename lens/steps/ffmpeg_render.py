"""
FFmpeg Render - Create video from audio + static banner image using FFmpeg
"""

import subprocess
from pathlib import Path
from typing import Dict, Any


def ffmpeg_render(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Render video using FFmpeg (audio + static banner image)

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with render info
    """

    # Find input video file (source video with original audio)
    input_video = job_dir / "input" / "source.mp4"
    if not input_video.exists():
        # Try other video extensions
        video_files = list((job_dir / "input").glob("source.*"))
        video_files = [f for f in video_files if f.suffix.lower() in ['.mp4', '.mov', '.avi', '.mkv', '.webm']]
        if not video_files:
            raise FileNotFoundError(f"No video file found in {job_dir / 'input'}")
        input_video = video_files[0]

    # Find banner image (created by create_banner step)
    banner_path = job_dir / "renders" / "banner.png"
    if not banner_path.exists():
        raise FileNotFoundError(
            f"Banner image not found: {banner_path}\n"
            "Run 'create_banner' step first"
        )

    # Renders directory
    renders_dir = job_dir / "renders"

    # Output video path
    output_video = renders_dir / "ffmpeg_render.mp4"

    print(f"🎬 Rendering video with FFmpeg...")
    print(f"   Input video: {input_video.name}")
    print(f"   Banner: {banner_path.name}")
    print(f"   Output: {output_video.name}")
    print(f"   Strategy: Extract audio from input video + overlay banner image")

    # FFmpeg command: use banner as video track + extract audio from input video
    cmd = [
        'ffmpeg',
        '-loop', '1',                    # Loop the banner image
        '-i', str(banner_path),          # Input: banner image (video track)
        '-i', str(input_video),          # Input: source video (for audio track)
        '-c:v', 'libx264',               # Video codec
        '-tune', 'stillimage',           # Optimize for static image
        '-c:a', 'aac',                   # Audio codec
        '-b:a', '192k',                  # Audio bitrate
        '-pix_fmt', 'yuv420p',           # Pixel format for compatibility
        '-map', '0:v:0',                 # Map video from first input (banner)
        '-map', '1:a:0',                 # Map audio from second input (source video)
        '-shortest',                     # End when shortest stream ends
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
        'renderer': 'ffmpeg'
    }
