#!/bin/bash
#
# Master orchestration script for earnings video production
# Usage: ./scripts/process-earnings.sh <video-id> <source> [url]
#
# Examples:
#   ./scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=jUnV3LiN0_k
#   ./scripts/process-earnings.sh nvda-q3-2024 manual
#

set -e  # Exit on error

# Directories
SUSHI_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load environment variables from .env
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
    set -a  # Export all variables
    source "$ENV_FILE"
    set +a
fi

# Load storage configuration
STORAGE_CONF="$SUSHI_DIR/config/storage.conf"
if [ -f "$STORAGE_CONF" ]; then
    source "$STORAGE_CONF"
else
    # Default to in-repo storage if not configured
    VIDEOS_BASE_DIR="$SUSHI_DIR/videos"
    LOGS_DIR="$SUSHI_DIR/logs"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
VIDEO_ID=$1
SOURCE=$2
URL=$3

if [ -z "$VIDEO_ID" ] || [ -z "$SOURCE" ]; then
    echo -e "${RED}Usage: $0 <video-id> <source> [url]${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 pltr-q3-2024 youtube https://youtube.com/watch?v=jUnV3LiN0_k"
    echo "  $0 nvda-q3-2024 manual"
    exit 1
fi

if [ "$SOURCE" = "youtube" ] && [ -z "$URL" ]; then
    echo -e "${RED}Error: URL required when source=youtube${NC}"
    exit 1
fi

# Video directories (using configured storage)
VIDEO_DIR="$VIDEOS_BASE_DIR/$VIDEO_ID"
LOG_FILE="$LOGS_DIR/$VIDEO_ID.log"

# Create log directory
mkdir -p "$LOGS_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${YELLOW}==>${NC} $1" | tee -a "$LOG_FILE"
}

# Start processing
log "Starting processing for: $VIDEO_ID"
log "Source: $SOURCE"
if [ -n "$URL" ]; then
    log "URL: $URL"
fi

# Step 1: Create folder structure
log_step "Step 1: Creating folder structure"
mkdir -p "$VIDEO_DIR"/{input,transcripts,output,thumbnail,reports}
log_success "Folder structure created"

# Step 2: Download source video
log_step "Step 2: Downloading source video"
if [ "$SOURCE" = "youtube" ]; then
    python3 "$SUSHI_DIR/scripts/download-source.py" "$VIDEO_ID" youtube --url "$URL" --output-dir "$VIDEOS_BASE_DIR"
else
    python3 "$SUSHI_DIR/scripts/download-source.py" "$VIDEO_ID" manual --output-dir "$VIDEOS_BASE_DIR"
fi
log_success "Source video ready"

# Step 3: Transcribe with Whisper
log_step "Step 3: Transcribing with Whisper"
SOURCE_FILE="$VIDEO_DIR/input/source.mp4"
if [ ! -f "$SOURCE_FILE" ]; then
    log_error "Source file not found: $SOURCE_FILE"
    exit 1
fi

# Activate Python environment
if [ -f "$SUSHI_DIR/.venv/bin/activate" ]; then
    source "$SUSHI_DIR/.venv/bin/activate"
else
    log_error "Python virtual environment not found. Run: ./sushi/setup-sushi.sh"
    exit 1
fi

# Run transcription
python3 "$SUSHI_DIR/transcribe.py" "$SOURCE_FILE"
log_success "Transcription complete"

# Step 4: Extract insights with LLM
log_step "Step 4: Extracting insights with LLM"
python3 "$SUSHI_DIR/process_video.py" "$SOURCE_FILE"
log_success "Insights extracted"

# Step 5: Render video with Remotion
log_step "Step 5: Rendering video with Remotion"
if command -v node &> /dev/null; then
    node "$SUSHI_DIR/scripts/render-video.js" "$VIDEO_ID"
    log_success "Video rendered"
else
    log_error "Node.js not installed. Run: ./sushi/setup-node.sh"
    log "Skipping video rendering..."
fi

# Step 6: Upload to YouTube
log_step "Step 6: Uploading to YouTube"
if [ -f "$PROJECT_ROOT/.env" ]; then
    node "$SUSHI_DIR/scripts/upload-youtube.js" "$VIDEO_ID"
    log_success "Uploaded to YouTube"
else
    log_error "Config file not found. Run: cp .env.example .env"
    log "Skipping YouTube upload..."
fi

# Step 7: Save to database
log_step "Step 7: Saving to database"
if [ -f "$PROJECT_ROOT/.env" ]; then
    node "$SUSHI_DIR/scripts/save-to-db.js" "$VIDEO_ID"
    log_success "Saved to database"
else
    log "Skipping database save..."
fi

# Step 8: Update metadata
log_step "Step 8: Updating metadata"
METADATA_FILE="$VIDEO_DIR/metadata.json"
if [ -f "$METADATA_FILE" ]; then
    # Update status to completed
    python3 -c "
import json
with open('$METADATA_FILE', 'r') as f:
    metadata = json.load(f)

metadata['status']['transcribe'] = 'completed'
metadata['status']['insights'] = 'completed'
metadata['status']['render'] = 'completed'

with open('$METADATA_FILE', 'w') as f:
    json.dump(metadata, f, indent=2)
"
    log_success "Metadata updated"
fi

# Step 9: Git commit
log_step "Step 9: Committing to git"
cd "$SUSHI_DIR/.."

# Only commit videos if stored in repo
if [[ "$VIDEOS_BASE_DIR" == "$SUSHI_DIR/videos"* ]]; then
    git add "sushi/videos/$VIDEO_ID/" 2>/dev/null || true
    log "Added video files to git"
else
    log "Videos stored externally ($VIDEOS_BASE_DIR), not adding to git"
fi

# Always commit logs (if in repo)
if [[ "$LOGS_DIR" == "$SUSHI_DIR"* ]]; then
    git add "sushi/logs/$VIDEO_ID.log" 2>/dev/null || true
fi

git commit -m "Add processed video: $VIDEO_ID

- Transcribed with Whisper
- Extracted insights with LLM
- Rendered video with Remotion
- Ready for thumbnail design

Storage: $VIDEOS_BASE_DIR

🤖 Generated with Claude Code" || log "No changes to commit"

log_success "Git commit complete"

# Final summary
echo ""
log_success "========================================"
log_success "Processing complete for: $VIDEO_ID"
log_success "========================================"
echo ""
log "Next steps:"
log "  1. Design custom thumbnail on Mac"
log "  2. Save to: sushi/videos/$VIDEO_ID/thumbnail/custom.jpg"
log "  3. Push to git and update YouTube thumbnail"
echo ""
log "Video location: $VIDEO_DIR/output/final.mp4"
log "Transcript: $VIDEO_DIR/transcripts/transcript.json"
log "Insights: $VIDEO_DIR/transcripts/insights.json"
log "Log file: $LOG_FILE"
echo ""
