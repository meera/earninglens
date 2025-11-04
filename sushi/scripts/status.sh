#!/bin/bash
#
# Check status of all videos in processing
# Usage: ./scripts/status.sh
#

SUSHI_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load storage configuration
STORAGE_CONF="$SUSHI_DIR/config/storage.conf"
if [ -f "$STORAGE_CONF" ]; then
    source "$STORAGE_CONF"
else
    VIDEOS_BASE_DIR="$SUSHI_DIR/videos"
fi

VIDEOS_DIR="$VIDEOS_BASE_DIR"

echo "========================================"
echo "  Sushi Video Processing Status"
echo "========================================"
echo ""

if [ ! -d "$VIDEOS_DIR" ] || [ -z "$(ls -A $VIDEOS_DIR 2>/dev/null)" ]; then
    echo "No videos found in $VIDEOS_DIR"
    exit 0
fi

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to get status emoji
get_status() {
    local status=$1
    if [ "$status" = "completed" ]; then
        echo "✓"
    elif [ "$status" = "in_progress" ]; then
        echo "⏳"
    elif [ "$status" = "failed" ]; then
        echo "✗"
    else
        echo "○"
    fi
}

# Function to get status color
get_color() {
    local status=$1
    if [ "$status" = "completed" ]; then
        echo "$GREEN"
    elif [ "$status" = "in_progress" ]; then
        echo "$YELLOW"
    elif [ "$status" = "failed" ]; then
        echo "$RED"
    else
        echo "$NC"
    fi
}

# Iterate through video directories
for video_dir in "$VIDEOS_DIR"/*; do
    if [ ! -d "$video_dir" ]; then
        continue
    fi

    video_id=$(basename "$video_dir")
    metadata_file="$video_dir/metadata.json"

    if [ ! -f "$metadata_file" ]; then
        echo "⚠ $video_id - No metadata"
        continue
    fi

    # Parse metadata using Python (more reliable than bash JSON parsing)
    python3 - <<EOF "$metadata_file" "$video_id"
import json
import sys

metadata_file = sys.argv[1]
video_id = sys.argv[2]

with open(metadata_file, 'r') as f:
    metadata = json.load(f)

status = metadata.get('status', {})
youtube = metadata.get('youtube', {})

print(f"📹 {video_id}")
print(f"   Download:   $(get_status ${status.get('download', 'pending')})")
print(f"   Transcribe: $(get_status ${status.get('transcribe', 'pending')})")
print(f"   Insights:   $(get_status ${status.get('insights', 'pending')})")
print(f"   Render:     $(get_status ${status.get('render', 'pending')})")
print(f"   Upload:     $(get_status ${status.get('upload', 'pending')})")
print(f"   Database:   $(get_status ${status.get('database', 'pending')})")

if youtube.get('url'):
    print(f"   YouTube:    {youtube['url']}")

print()
EOF

done

echo "========================================"
echo ""
echo "Legend:"
echo "  ✓ Completed"
echo "  ⏳ In Progress"
echo "  ✗ Failed"
echo "  ○ Pending"
echo ""
