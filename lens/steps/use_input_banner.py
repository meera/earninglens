"""
Use Input Banner - Copy existing banner.jpg from input directory to renders
"""

from pathlib import Path
from typing import Dict, Any
import shutil


def use_input_banner(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Copy existing banner.jpg from input directory to renders directory

    Expects banner.jpg to be in {job_dir}/input/banner.jpg
    Copies to {job_dir}/renders/banner.png (FFmpeg expects .png)

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with banner path
    """
    # Look for banner image in input directory
    input_dir = job_dir / "input"

    # Try common image extensions
    banner_candidates = [
        input_dir / "banner.jpg",
        input_dir / "banner.jpeg",
        input_dir / "banner.png",
    ]

    banner_source = None
    for candidate in banner_candidates:
        if candidate.exists():
            banner_source = candidate
            break

    if not banner_source:
        raise FileNotFoundError(
            f"No banner image found in {input_dir}/\n"
            f"Expected one of: banner.jpg, banner.jpeg, banner.png"
        )

    # Create renders directory
    renders_dir = job_dir / "renders"
    renders_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

    # Copy to renders/banner.png (FFmpeg expects .png)
    banner_dest = renders_dir / "banner.png"
    shutil.copy2(banner_source, banner_dest)

    # Get image dimensions
    try:
        from PIL import Image
        with Image.open(banner_dest) as img:
            width, height = img.size
    except ImportError:
        # PIL not available, use default dimensions
        width, height = 1920, 1080

    print(f"📸 Using existing banner: {banner_source.name}")
    print(f"   Copied to: {banner_dest.name}")
    print(f"   Size: {width}x{height}")

    return {
        'banner_path': str(banner_dest),
        'source_path': str(banner_source),
        'width': width,
        'height': height,
        'format': 'png'
    }
