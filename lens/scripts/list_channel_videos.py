#!/usr/bin/env python3
"""
List all video IDs from a YouTube channel

Usage:
    python lens/scripts/list_channel_videos.py <channel_id> [--output videos.txt] [--max-results 500]

Examples:
    # Get all videos from a channel
    python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ --output nvidia_videos.txt

    # Get latest 50 videos
    python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ --max-results 50

    # Use channel URL instead of ID
    python lens/scripts/list_channel_videos.py @nvidia --output nvidia_videos.txt

Environment:
    YOUTUBE_API_KEY - Required, get from Google Cloud Console
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def get_channel_id_from_username(youtube, username: str) -> Optional[str]:
    """
    Convert channel username (@nvidia) to channel ID

    Args:
        youtube: YouTube API client
        username: Channel username (with or without @)

    Returns:
        Channel ID or None
    """
    # Remove @ if present
    username = username.lstrip('@')

    try:
        request = youtube.channels().list(
            part='id',
            forUsername=username
        )
        response = request.execute()

        if response.get('items'):
            return response['items'][0]['id']
        else:
            print(f"❌ Channel not found for username: {username}")
            print(f"   Try using the channel ID instead of @username")
            print(f"   Find channel ID at: https://www.youtube.com/@{username}/about")
            return None
    except HttpError as e:
        print(f"❌ Error fetching channel: {e}")
        return None


def get_channel_uploads_playlist_id(youtube, channel_id: str) -> Optional[str]:
    """
    Get the uploads playlist ID for a channel

    Args:
        youtube: YouTube API client
        channel_id: YouTube channel ID

    Returns:
        Uploads playlist ID or None
    """
    try:
        request = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        )
        response = request.execute()

        if not response['items']:
            print(f"❌ Channel not found: {channel_id}")
            return None

        uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        return uploads_playlist_id
    except HttpError as e:
        print(f"❌ Error fetching channel details: {e}")
        return None


def get_playlist_videos(youtube, playlist_id: str, max_results: Optional[int] = None) -> List[str]:
    """
    Get all video IDs from a playlist

    Args:
        youtube: YouTube API client
        playlist_id: YouTube playlist ID
        max_results: Maximum number of videos to fetch (None = all)

    Returns:
        List of video IDs
    """
    video_ids = []
    next_page_token = None
    total_fetched = 0

    try:
        while True:
            # Determine page size
            page_size = 50
            if max_results:
                remaining = max_results - total_fetched
                if remaining <= 0:
                    break
                page_size = min(50, remaining)

            request = youtube.playlistItems().list(
                part='contentDetails',
                playlistId=playlist_id,
                maxResults=page_size,
                pageToken=next_page_token
            )
            response = request.execute()

            # Extract video IDs
            for item in response['items']:
                video_id = item['contentDetails']['videoId']
                video_ids.append(video_id)
                total_fetched += 1

            print(f"   Fetched {total_fetched} videos...", end='\r')

            # Check for next page
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

        print(f"   Fetched {total_fetched} videos... Done!")
        return video_ids

    except HttpError as e:
        print(f"\n❌ Error fetching playlist items: {e}")
        return video_ids


def filter_earnings_videos(youtube, video_ids: List[str]) -> List[str]:
    """
    Filter videos to only include earnings-related ones

    Args:
        youtube: YouTube API client
        video_ids: List of video IDs to filter

    Returns:
        List of earnings video IDs
    """
    earnings_keywords = [
        'earnings', 'quarterly results', 'financial results',
        'q1', 'q2', 'q3', 'q4', 'fiscal'
    ]

    earnings_videos = []

    # Process in batches of 50 (YouTube API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]

        try:
            request = youtube.videos().list(
                part='snippet',
                id=','.join(batch)
            )
            response = request.execute()

            for item in response['items']:
                title = item['snippet']['title'].lower()
                description = item['snippet']['description'].lower()

                # Check if earnings-related
                if any(keyword in title or keyword in description for keyword in earnings_keywords):
                    earnings_videos.append(item['id'])
                    print(f"   ✓ {item['snippet']['title']}")

        except HttpError as e:
            print(f"❌ Error fetching video details: {e}")
            continue

    return earnings_videos


def main():
    parser = argparse.ArgumentParser(
        description='List all video IDs from a YouTube channel',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Get all videos from NVIDIA channel
  python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ

  # Save to file
  python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ --output nvidia_videos.txt

  # Get latest 100 videos only
  python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ --max-results 100

  # Filter earnings videos only
  python lens/scripts/list_channel_videos.py UCBJycsmduvYEL83R_U4JriQ --filter-earnings

  # Use channel handle instead of ID
  python lens/scripts/list_channel_videos.py @nvidia --output nvidia_videos.txt
        """
    )

    parser.add_argument('channel_id', help='YouTube channel ID or @username')
    parser.add_argument('--output', '-o', help='Output file (default: stdout)')
    parser.add_argument('--max-results', '-n', type=int, help='Maximum number of videos to fetch')
    parser.add_argument('--filter-earnings', action='store_true', help='Only include earnings-related videos')

    args = parser.parse_args()

    # Check for API key
    api_key = os.getenv('YOUTUBE_API_KEY')
    if not api_key:
        print("❌ Error: YOUTUBE_API_KEY environment variable not set")
        print("   Get an API key from: https://console.cloud.google.com/apis/credentials")
        return 1

    # Build YouTube API client
    youtube = build('youtube', 'v3', developerKey=api_key)

    # Handle channel ID or username
    channel_id = args.channel_id
    if channel_id.startswith('@'):
        print(f"🔍 Looking up channel ID for {channel_id}...")
        channel_id = get_channel_id_from_username(youtube, channel_id)
        if not channel_id:
            return 1
        print(f"   Channel ID: {channel_id}")

    # Get uploads playlist ID
    print(f"\n📺 Fetching channel details...")
    uploads_playlist_id = get_channel_uploads_playlist_id(youtube, channel_id)
    if not uploads_playlist_id:
        return 1

    print(f"   Uploads playlist: {uploads_playlist_id}")

    # Get all video IDs
    print(f"\n📋 Fetching video list...")
    video_ids = get_playlist_videos(youtube, uploads_playlist_id, args.max_results)

    if not video_ids:
        print("❌ No videos found")
        return 1

    print(f"\n✅ Found {len(video_ids)} videos")

    # Filter earnings videos if requested
    if args.filter_earnings:
        print(f"\n🔍 Filtering earnings-related videos...")
        video_ids = filter_earnings_videos(youtube, video_ids)
        print(f"✅ Found {len(video_ids)} earnings videos")

    # Output results
    if args.output:
        output_path = Path(args.output)
        with open(output_path, 'w') as f:
            for video_id in video_ids:
                f.write(f"{video_id}\n")
        print(f"\n✅ Saved to: {output_path}")
    else:
        # Print to stdout
        for video_id in video_ids:
            print(video_id)

    return 0


if __name__ == '__main__':
    sys.exit(main())
