#!/bin/bash
#
# Update YouTube thumbnail after custom design
# Usage: ./scripts/update-thumbnail.sh <video-id>
#

set -e

VIDEO_ID=$1

if [ -z "$VIDEO_ID" ]; then
    echo "Usage: $0 <video-id>"
    echo ""
    echo "Example:"
    echo "  $0 pltr-q3-2024"
    exit 1
fi

# Directories
SUSHI_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$SUSHI_DIR/videos/$VIDEO_ID"
THUMBNAIL_PATH="$VIDEO_DIR/thumbnail/custom.jpg"
METADATA_PATH="$VIDEO_DIR/metadata.json"

# Check if thumbnail exists
if [ ! -f "$THUMBNAIL_PATH" ]; then
    echo "❌ Thumbnail not found: $THUMBNAIL_PATH"
    echo ""
    echo "Design your thumbnail and save it to:"
    echo "  $THUMBNAIL_PATH"
    exit 1
fi

# Load YouTube video ID from metadata
if [ ! -f "$METADATA_PATH" ]; then
    echo "❌ Metadata not found: $METADATA_PATH"
    exit 1
fi

YOUTUBE_ID=$(cat "$METADATA_PATH" | grep -o '"video_id": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$YOUTUBE_ID" ]; then
    echo "❌ No YouTube video ID found in metadata"
    exit 1
fi

echo "🖼 Updating YouTube thumbnail..."
echo "  Video ID: $VIDEO_ID"
echo "  YouTube ID: $YOUTUBE_ID"
echo "  Thumbnail: $THUMBNAIL_PATH"
echo ""

# Call Node.js script to update thumbnail
node - <<EOF
const fs = require('fs');
const {google} = require('googleapis');
require('dotenv').config({path: '$PROJECT_ROOT/.env'});

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
});

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

async function updateThumbnail() {
  try {
    await youtube.thumbnails.set({
      videoId: '$YOUTUBE_ID',
      media: {
        body: fs.createReadStream('$THUMBNAIL_PATH')
      }
    });

    console.log('✓ Thumbnail updated successfully!');
    console.log('  View at: https://youtube.com/watch?v=$YOUTUBE_ID');
  } catch (error) {
    console.error('❌ Failed to update thumbnail:', error.message);
    process.exit(1);
  }
}

updateThumbnail();
EOF

echo ""
echo "✓ Done!"
