#!/usr/bin/env python3
"""
Smart Thumbnail Generator for EarningLens

Intelligently generates YouTube thumbnails based on video content:
1. If video has video stream → Extract 4 frames from strategic locations
2. If audio-only → Create eye-catching thumbnail with CEO image + stock chart

Usage:
    python smart_thumbnail_generator.py <video_file> <data_json_path> <output_dir>

Example:
    python smart_thumbnail_generator.py uploads/video.mp4 data/AAPL-Q4-2024.json output/
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import requests
from io import BytesIO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def has_video_stream(video_path: str) -> bool:
    """
    Check if video file has video stream (not just audio)

    Returns:
        bool: True if video stream exists, False if audio-only
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_type',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        has_video = result.stdout.strip() == 'video'

        logger.info(f"Video stream detected: {has_video}")
        return has_video

    except Exception as e:
        logger.error(f"Error checking video stream: {e}")
        return False


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        duration = float(result.stdout.strip())

        logger.info(f"Video duration: {duration:.1f}s")
        return duration

    except Exception as e:
        logger.error(f"Error getting video duration: {e}")
        return 0.0


def extract_frame_at_timestamp(video_path: str, timestamp: float, output_path: str) -> bool:
    """
    Extract a single frame from video at specific timestamp

    Args:
        video_path: Path to video file
        timestamp: Time in seconds
        output_path: Where to save frame

    Returns:
        bool: Success status
    """
    try:
        cmd = [
            'ffmpeg',
            '-ss', str(timestamp),
            '-i', video_path,
            '-frames:v', '1',
            '-q:v', '2',  # High quality
            '-y',  # Overwrite
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, stderr=subprocess.PIPE)

        if result.returncode == 0 and os.path.exists(output_path):
            logger.info(f"✓ Extracted frame at {timestamp:.1f}s → {output_path}")
            return True
        else:
            logger.error(f"✗ Failed to extract frame at {timestamp:.1f}s")
            return False

    except Exception as e:
        logger.error(f"Error extracting frame: {e}")
        return False


def extract_frames_from_video(video_path: str, output_dir: str, num_frames: int = 4) -> list:
    """
    Extract frames from strategic locations in video

    Extracts frames at: 15%, 35%, 55%, 75% of video duration
    (Avoiding very start/end which may have static screens)

    Args:
        video_path: Path to video file
        output_dir: Directory to save frames
        num_frames: Number of frames to extract (default: 4)

    Returns:
        list: Paths to extracted frame images
    """

    duration = get_video_duration(video_path)

    if duration <= 0:
        logger.error("Invalid video duration")
        return []

    os.makedirs(output_dir, exist_ok=True)

    # Extract at strategic positions (avoiding very start/end)
    positions = [0.15, 0.35, 0.55, 0.75][:num_frames]

    frame_paths = []

    for i, pos in enumerate(positions):
        timestamp = duration * pos
        frame_path = os.path.join(output_dir, f"frame_{i+1}_at_{int(timestamp)}s.jpg")

        if extract_frame_at_timestamp(video_path, timestamp, frame_path):
            frame_paths.append(frame_path)

    logger.info(f"✅ Extracted {len(frame_paths)} frames from video")
    return frame_paths


def search_ceo_image(company_name: str, ceo_name: str = None) -> str:
    """
    Search for CEO image online

    NOTE: This is a placeholder. In production, use:
    - Google Custom Search API
    - Bing Image Search API
    - Or scrape from company investor relations page

    Args:
        company_name: Company name (e.g., "Apple")
        ceo_name: CEO name if known (e.g., "Tim Cook")

    Returns:
        str: URL to CEO image (or None if not found)
    """

    # For MVP: Return placeholder or try to fetch from specific sources
    # In production, integrate with image search API

    logger.warning("CEO image search not implemented - using placeholder")

    # Placeholder: Could integrate with:
    # 1. Google Custom Search API: https://developers.google.com/custom-search
    # 2. Bing Image Search API: https://www.microsoft.com/en-us/bing/apis/bing-image-search-api
    # 3. Company IR pages (scraped)

    return None


def download_image(url: str, output_path: str) -> bool:
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content))
        img.save(output_path)

        logger.info(f"✓ Downloaded image: {output_path}")
        return True

    except Exception as e:
        logger.error(f"Error downloading image: {e}")
        return False


def create_stock_chart_simple(
    ticker: str,
    change_percent: float,
    width: int = 600,
    height: int = 400
) -> Image.Image:
    """
    Create a simple stock chart showing up/down movement

    Args:
        ticker: Stock ticker (e.g., "AAPL")
        change_percent: Percentage change (e.g., 5.2 for +5.2%)
        width: Chart width
        height: Chart height

    Returns:
        PIL.Image: Chart image
    """

    # Create chart image
    chart = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(chart)

    # Determine color based on change
    is_positive = change_percent >= 0
    color = (34, 197, 94) if is_positive else (239, 68, 68)  # Green or Red
    arrow = "↑" if is_positive else "↓"

    # Draw simple line chart (mock trending data)
    padding = 40
    chart_width = width - 2 * padding
    chart_height = height - 2 * padding

    # Generate mock price points (trending up/down)
    num_points = 20
    points = []

    for i in range(num_points):
        x = padding + (chart_width / (num_points - 1)) * i

        # Create trending line based on change
        if is_positive:
            # Upward trend
            y = height - padding - (chart_height * 0.3) - (chart_height * 0.4 * (i / num_points))
        else:
            # Downward trend
            y = padding + (chart_height * 0.3) + (chart_height * 0.4 * (i / num_points))

        # Add some variance for realism
        import random
        y += random.uniform(-10, 10)

        points.append((x, y))

    # Draw line
    draw.line(points, fill=color, width=6)

    # Draw dots at points
    for x, y in points:
        draw.ellipse([x-4, y-4, x+4, y+4], fill=color)

    # Draw large arrow and percentage
    try:
        font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 120)
        font_percent = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 80)
    except:
        font_large = ImageFont.load_default()
        font_percent = ImageFont.load_default()

    # Arrow
    arrow_text = arrow
    bbox = draw.textbbox((0, 0), arrow_text, font=font_large)
    arrow_width = bbox[2] - bbox[0]
    draw.text((width // 2 - arrow_width // 2, 20), arrow_text, font=font_large, fill=color)

    # Percentage
    percent_text = f"{abs(change_percent):.1f}%"
    bbox = draw.textbbox((0, 0), percent_text, font=font_percent)
    percent_width = bbox[2] - bbox[0]
    draw.text((width // 2 - percent_width // 2, 150), percent_text, font=font_percent, fill=color)

    return chart


def create_eye_catching_thumbnail(
    data: dict,
    output_path: str,
    ceo_image_path: str = None,
    width: int = 1280,
    height: int = 720
) -> bool:
    """
    Create eye-catching thumbnail for audio-only earnings calls

    Includes:
    - Large, dashing title (company name)
    - Stock chart showing movement
    - CEO image (if available)
    - Quarter/year info
    - Professional gradient background

    Args:
        data: Video metadata (company, ticker, quarter, etc.)
        output_path: Where to save thumbnail
        ceo_image_path: Optional path to CEO image
        width: Thumbnail width
        height: Thumbnail height

    Returns:
        bool: Success status
    """

    try:
        # Extract data
        company_name = data.get('company', 'Company')
        ticker = data.get('ticker', '')
        quarter = data.get('quarter', 'Q4')
        fiscal_year = data.get('fiscal_year', 2024)
        change_percent = data.get('stock_change_percent', 0.0)  # Default to 0

        # Create gradient background (dark, professional)
        img = Image.new('RGB', (width, height), (15, 23, 42))

        # Add gradient overlay
        gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        gradient_draw = ImageDraw.Draw(gradient)

        for i in range(height):
            alpha = int(100 * (i / height))
            gradient_draw.rectangle([(0, i), (width, i+1)], fill=(30, 41, 59, alpha))

        img = Image.alpha_composite(img.convert('RGBA'), gradient).convert('RGB')

        draw = ImageDraw.Draw(img, 'RGBA')

        # Load fonts
        try:
            font_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 110)
            font_ticker = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 70)
            font_quarter = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
        except:
            font_title = ImageFont.load_default()
            font_ticker = ImageFont.load_default()
            font_quarter = ImageFont.load_default()

        # Layout: Left side = Text, Right side = Chart
        left_width = int(width * 0.5)
        right_x = left_width + 50

        # LEFT SIDE: Company name (large and dashing!)
        company_y = 150

        # Company name with shadow for emphasis
        company_text = company_name.upper()

        # Shadow
        draw.text((55, company_y + 5), company_text, font=font_title, fill=(0, 0, 0, 180))
        # Main text (white)
        draw.text((50, company_y), company_text, font=font_title, fill=(255, 255, 255))

        # Ticker (with color accent)
        ticker_y = company_y + 130
        ticker_text = f"({ticker})"
        is_positive = change_percent >= 0
        ticker_color = (34, 197, 94) if is_positive else (239, 68, 68)

        draw.text((53, ticker_y + 3), ticker_text, font=font_ticker, fill=(0, 0, 0, 180))
        draw.text((50, ticker_y), ticker_text, font=font_ticker, fill=ticker_color)

        # Quarter/Year box (highlighted)
        quarter_y = ticker_y + 100
        quarter_text = f"{quarter} {fiscal_year}"

        bbox = draw.textbbox((0, 0), quarter_text, font=font_quarter)
        quarter_width = bbox[2] - bbox[0]

        # Yellow highlight box
        padding = 20
        draw.rectangle(
            [50 - padding, quarter_y - 10, 50 + quarter_width + padding, quarter_y + 70],
            fill=(250, 204, 21, 220),
            outline=(250, 204, 21),
            width=3
        )

        draw.text((50, quarter_y), quarter_text, font=font_quarter, fill=(15, 23, 42))

        # "EARNINGS CALL" text
        earnings_y = quarter_y + 90
        try:
            font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 45)
        except:
            font_small = ImageFont.load_default()

        draw.text((50, earnings_y), "EARNINGS CALL", font=font_small, fill=(226, 232, 240))

        # RIGHT SIDE: Stock chart
        chart_width = width - right_x - 50
        chart_height = 400

        chart = create_stock_chart_simple(ticker, change_percent, chart_width, chart_height)

        # Paste chart
        chart_y = (height - chart_height) // 2
        img.paste(chart, (right_x, chart_y), chart)

        # CEO image (if available)
        if ceo_image_path and os.path.exists(ceo_image_path):
            try:
                ceo_img = Image.open(ceo_image_path)

                # Resize and crop to circle
                ceo_size = 180
                ceo_img = ceo_img.resize((ceo_size, ceo_size), Image.Resampling.LANCZOS)

                # Create circular mask
                mask = Image.new('L', (ceo_size, ceo_size), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.ellipse([0, 0, ceo_size, ceo_size], fill=255)

                # Apply mask
                ceo_img.putalpha(mask)

                # Add border
                border_img = Image.new('RGBA', (ceo_size + 10, ceo_size + 10), (255, 255, 255, 255))
                border_draw = ImageDraw.Draw(border_img)
                border_draw.ellipse([0, 0, ceo_size + 10, ceo_size + 10], fill=(255, 255, 255))

                # Paste CEO image
                ceo_x = 50
                ceo_y = height - ceo_size - 50

                img.paste(border_img, (ceo_x - 5, ceo_y - 5), border_img)
                img.paste(ceo_img, (ceo_x, ceo_y), ceo_img)

            except Exception as e:
                logger.warning(f"Could not add CEO image: {e}")

        # Logo badge (bottom right)
        try:
            font_logo = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 35)
        except:
            font_logo = ImageFont.load_default()

        logo_x = width - 320
        logo_y = height - 90

        draw.rectangle(
            [logo_x - 20, logo_y - 15, logo_x + 290, logo_y + 60],
            fill=(30, 41, 59, 220),
            outline=(96, 165, 250),
            width=2
        )

        draw.text((logo_x, logo_y), "📊 EarningLens", font=font_logo, fill=(255, 255, 255))

        # Save image
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        img.save(output_path, 'JPEG', quality=95, optimize=True)

        logger.info(f"✅ Eye-catching thumbnail created: {output_path}")
        return True

    except Exception as e:
        logger.error(f"Error creating thumbnail: {e}")
        import traceback
        traceback.print_exc()
        return False


def generate_smart_thumbnail(
    video_path: str,
    data: dict,
    output_dir: str
) -> dict:
    """
    Smart thumbnail generation:
    - If video has video stream → Extract 4 frames
    - If audio-only → Create custom thumbnail with CEO + chart

    Args:
        video_path: Path to video file
        data: Video metadata (company, ticker, etc.)
        output_dir: Directory to save thumbnails

    Returns:
        dict: Result with thumbnail paths and metadata
    """

    os.makedirs(output_dir, exist_ok=True)

    result = {
        'has_video_stream': False,
        'extracted_frames': [],
        'custom_thumbnail': None,
        'success': False
    }

    # Check if video has video stream
    has_video = has_video_stream(video_path)
    result['has_video_stream'] = has_video

    if has_video:
        logger.info("📹 Video stream detected - Extracting frames...")

        # Extract 4 frames from different locations
        frames = extract_frames_from_video(video_path, output_dir, num_frames=4)
        result['extracted_frames'] = frames
        result['success'] = len(frames) > 0

        logger.info(f"✅ Extracted {len(frames)} frames for thumbnail selection")

    else:
        logger.info("🎙️ Audio-only detected - Creating custom thumbnail...")

        # Create eye-catching thumbnail
        thumbnail_path = os.path.join(output_dir, 'custom_thumbnail.jpg')

        # Optionally search for CEO image
        ceo_image_path = None
        # ceo_name = data.get('ceo_name')
        # if ceo_name:
        #     ceo_image_url = search_ceo_image(data.get('company'), ceo_name)
        #     if ceo_image_url:
        #         ceo_image_path = os.path.join(output_dir, 'ceo_image.jpg')
        #         download_image(ceo_image_url, ceo_image_path)

        success = create_eye_catching_thumbnail(
            data,
            thumbnail_path,
            ceo_image_path=ceo_image_path
        )

        result['custom_thumbnail'] = thumbnail_path if success else None
        result['success'] = success

        if success:
            logger.info(f"✅ Custom thumbnail created: {thumbnail_path}")

    return result


def main():
    """Main entry point"""
    if len(sys.argv) < 4:
        print("Usage: python smart_thumbnail_generator.py <video_file> <data_json> <output_dir>")
        print("\nExample:")
        print("  python smart_thumbnail_generator.py uploads/video.mp4 data/AAPL-Q4-2024.json output/thumbnails/")
        sys.exit(1)

    video_path = sys.argv[1]
    data_path = sys.argv[2]
    output_dir = sys.argv[3]

    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found: {video_path}")
        sys.exit(1)

    if not os.path.exists(data_path):
        print(f"❌ Error: Data file not found: {data_path}")
        sys.exit(1)

    # Load data
    with open(data_path, 'r') as f:
        data = json.load(f)

    # Generate smart thumbnail
    result = generate_smart_thumbnail(video_path, data, output_dir)

    # Print result
    print("\n" + "="*60)
    print("Smart Thumbnail Generation Result")
    print("="*60)
    print(f"Has video stream: {result['has_video_stream']}")

    if result['has_video_stream']:
        print(f"Extracted frames: {len(result['extracted_frames'])}")
        for i, frame in enumerate(result['extracted_frames'], 1):
            print(f"  {i}. {frame}")
    else:
        print(f"Custom thumbnail: {result['custom_thumbnail']}")

    print(f"Success: {result['success']}")
    print("="*60)

    sys.exit(0 if result['success'] else 1)


if __name__ == "__main__":
    main()
