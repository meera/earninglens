#!/usr/bin/env python3
"""
Upload earnings call video to YouTube with comprehensive metadata.
Supports job.yaml format and thumbnail uploads.
"""

import yaml
import os
import sys
import argparse
from pathlib import Path
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment
load_dotenv()

try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
except ImportError:
    print("❌ Error: Google API client not installed")
    print("Install: pip install google-api-python-client google-auth-oauthlib")
    sys.exit(1)


SCOPES = ['https://www.googleapis.com/auth/youtube.upload']


def get_youtube_client():
    """Get authenticated YouTube API client."""

    creds = None
    token_file = Path.home() / '.youtube_token.json'

    # Load existing credentials
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)

    # Refresh or get new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Need to run OAuth flow with client secret file
            client_secret_file = os.getenv('YOUTUBE_CLIENT_SECRET_FILE')

            if not client_secret_file:
                raise ValueError("YOUTUBE_CLIENT_SECRET_FILE required in .env")

            if not Path(client_secret_file).exists():
                raise ValueError(f"Client secret file not found: {client_secret_file}")

            # Use the official client secrets file
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file,
                SCOPES
            )
            creds = flow.run_local_server(port=8090)  # Use 8090 to avoid conflict with media server on 8080

        # Save credentials for future use
        with open(token_file, 'w') as f:
            f.write(creds.to_json())

    return build('youtube', 'v3', credentials=creds)


def format_time(seconds: float) -> str:
    """Format seconds to MM:SS for chapter markers."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def build_description(job_data: Dict) -> str:
    """Build YouTube description with chapter markers and company info from job.yaml."""

    # Load insights from file (not stored in job.yaml, only metadata)
    insights_file = job_data.get('processing', {}).get('extract_insights', {}).get('insights_file')
    insights = {}
    if insights_file and Path(insights_file).exists():
        import json
        with open(insights_file, 'r') as f:
            insights_data = json.load(f)
            insights = insights_data.get('insights', {})

    company = job_data.get('company', {})

    # Prefer confirmed metadata (from manual-audio workflow) over top-level company
    confirmed = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    # Get company metadata from match_company step (has slug, exchange, sector, etc.)
    match_result = job_data.get('processing', {}).get('match_company', {})
    company_match = match_result.get('company_match', {})
    company_metadata = company_match.get('metadata', {})

    # Extract company info (confirmed metadata takes priority, then company_match, then company)
    name = confirmed.get('company') or company_match.get('name') or company.get('name', 'Company')
    ticker = confirmed.get('ticker') or company_match.get('symbol') or company.get('ticker', 'N/A')
    slug = company_match.get('slug') or company.get('slug', ticker.lower())
    quarter = confirmed.get('quarter') or company.get('quarter', 'Q3-2025')
    year = confirmed.get('year') or company.get('year', 2025)

    exchange = company_metadata.get('exchange') or company.get('exchange')
    sector = company_metadata.get('sector') or company.get('sector')

    # Combine quarter and year if separate
    if isinstance(quarter, str) and '-' not in quarter and year:
        quarter = f"{quarter}-{year}"

    # Summary
    summary = insights.get('summary', '')

    # Chapters
    chapters = insights.get('chapters', [])

    # Build description
    lines = []

    # Company intro with enriched data
    lines.append(f"{name} ({ticker}) - {quarter} Earnings Call Analysis")
    lines.append("")

    if summary:
        lines.append(summary)
        lines.append("")

    # Company info section (only include if we have any enriched data)
    company_info_items = []
    if exchange:
        company_info_items.append(f"• Exchange: {exchange}")
    if sector:
        company_info_items.append(f"• Sector: {sector}")
    if ticker and ticker != 'N/A':
        company_info_items.append(f"• Ticker: {ticker}")

    if company_info_items:
        lines.append("Company Info:")
        lines.extend(company_info_items)
        lines.append("")

    # Link to full analysis (using earnings-based URL format)
    # Format: /earnings/{company-slug}/{quarter-year} (e.g., /earnings/home-depot/q3-2025)
    quarter_slug = quarter.lower() if quarter else 'q3-2025'
    lines.append(f"📊 Full interactive analysis: https://markethawkeye.com/earnings/{slug}/{quarter_slug}")
    lines.append("")

    # Chapters
    if chapters:
        lines.append("📖 Chapters:")
        for chapter in chapters:
            timestamp = format_time(chapter['timestamp'])
            title = chapter['title']
            lines.append(f"{timestamp} - {title}")
        lines.append("")

    lines.append("This video provides analysis of {}'s earnings call with key financial metrics, management highlights, and visual insights.".format(name))
    lines.append("")
    lines.append("Visit MarketHawk Eye for more earnings analysis and interactive financial data.")
    lines.append("")
    lines.append("Subscribe for more earnings call visualizations!")

    # Hashtags
    youtube_info = job_data.get('youtube', {})
    hashtags = youtube_info.get('hashtags', [])
    if hashtags:
        lines.append("")
        lines.append(" ".join(f"#{tag}" for tag in hashtags))

    return "\n".join(lines)


def upload_video(video_path: str, job_yaml_path: str, thumbnail_path: Optional[str] = None) -> Dict:
    """
    Upload video to YouTube with metadata from job.yaml.

    Args:
        video_path: Path to video file
        job_yaml_path: Path to job.yaml
        thumbnail_path: Path to thumbnail image (optional)

    Returns:
        Dictionary with upload results including video ID and URL
    """

    # Load job.yaml
    with open(job_yaml_path, 'r') as f:
        job_data = yaml.safe_load(f)

    company = job_data.get('company', {})
    youtube_info = job_data.get('youtube', {})

    # Load insights from file (not stored in job.yaml, only metadata)
    insights_file = job_data.get('processing', {}).get('extract_insights', {}).get('insights_file')
    insights = {}
    if insights_file and Path(insights_file).exists():
        import json
        with open(insights_file, 'r') as f:
            insights_data = json.load(f)
            insights = insights_data.get('insights', {})

    # Prefer confirmed metadata (from manual-audio workflow)
    confirmed = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    name = confirmed.get('company') or company.get('name', 'Company')
    ticker = confirmed.get('ticker') or company.get('ticker', 'N/A')
    quarter = confirmed.get('quarter') or company.get('quarter', 'Q3')
    year = confirmed.get('year') or company.get('year', 2025)

    # Build title
    title = youtube_info.get('title') or insights.get('title') or \
            f"{name} {quarter} {year} Earnings Call"

    # Build description with chapter markers
    description = build_description(job_data)

    # Tags
    tags = youtube_info.get('hashtags', [])
    if not tags:
        # Default tags
        tags = [
            ticker,
            name,
            quarter,
            str(year),
            'earnings call',
            'investing',
            'stocks',
            'finance'
        ]
        tags = [t for t in tags if t]  # Remove empty

    # Category: 25 = News & Politics (for financial news)
    category_id = "25"

    # Request body
    request_body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags,
            'categoryId': category_id
        },
        'status': {
            'privacyStatus': 'public',
            'selfDeclaredMadeForKids': False
        }
    }

    # Upload video
    print(f"📤 Uploading video to YouTube...")
    print(f"   Title: {title}")
    print(f"   Tags: {len(tags)} tags")
    chapters = insights.get('chapters', [])
    print(f"   Chapters: {len(chapters)} chapters")

    youtube = get_youtube_client()

    media = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype='video/*')

    request = youtube.videos().insert(
        part='snippet,status',
        body=request_body,
        media_body=media
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            progress = int(status.progress() * 100)
            print(f"   Uploading: {progress}%")

    video_id = response['id']
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    print(f"✓ Video uploaded successfully!")
    print(f"   Video ID: {video_id}")
    print(f"   URL: {video_url}")

    # Upload thumbnail if provided
    if thumbnail_path and Path(thumbnail_path).exists():
        print(f"\n📸 Uploading thumbnail...")
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path, mimetype='image/jpeg')
            ).execute()
            print(f"✓ Thumbnail uploaded successfully!")
        except Exception as e:
            print(f"⚠️  Warning: Thumbnail upload failed: {e}")

    return {
        'video_id': video_id,
        'url': video_url,
        'title': title,
        'uploaded_at': response.get('snippet', {}).get('publishedAt')
    }


def main():
    parser = argparse.ArgumentParser(
        description="Upload earnings call video to YouTube with metadata from job.yaml"
    )
    parser.add_argument("--video", required=True, help="Path to video file")
    parser.add_argument("--metadata", required=True, help="Path to job.yaml")
    parser.add_argument("--thumbnail", help="Path to thumbnail image (optional)")

    args = parser.parse_args()

    # Validate inputs
    if not Path(args.video).exists():
        print(f"❌ Error: Video file not found: {args.video}")
        sys.exit(1)

    if not Path(args.metadata).exists():
        print(f"❌ Error: Metadata file not found: {args.metadata}")
        sys.exit(1)

    if args.thumbnail and not Path(args.thumbnail).exists():
        print(f"⚠️  Warning: Thumbnail file not found: {args.thumbnail}")
        args.thumbnail = None

    try:
        result = upload_video(args.video, args.metadata, args.thumbnail)

        print("\n" + "="*60)
        print("✓ Upload complete!")
        print("="*60)
        print(f"Video ID: {result['video_id']}")
        print(f"URL: {result['url']}")
        print(f"Title: {result['title']}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
