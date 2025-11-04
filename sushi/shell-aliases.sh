#!/bin/bash

# EarningLens Output Directory Aliases
# Source this file on both Mac and Linux (sushi) for consistent paths
# Usage: source sushi/shell-aliases.sh

# Base directories
export EARNINGLENS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SUSHI_ROOT="$EARNINGLENS_ROOT/sushi"
export VIDEOS_ROOT="$SUSHI_ROOT/videos"

# Aliases for common output paths
alias videos="cd $VIDEOS_ROOT"
alias sushi="cd $SUSHI_ROOT"
alias studio="cd $EARNINGLENS_ROOT/studio"

# Helper functions
video() {
  # Usage: video pltr-q3-2024
  # Goes to specific video directory
  cd "$VIDEOS_ROOT/$1"
}

video-output() {
  # Usage: video-output pltr-q3-2024
  # Opens output directory for specific video
  cd "$VIDEOS_ROOT/$1/output"
}

video-transcripts() {
  # Usage: video-transcripts pltr-q3-2024
  # Opens transcripts directory for specific video
  cd "$VIDEOS_ROOT/$1/transcripts"
}

list-videos() {
  # List all processed videos
  ls -1 "$VIDEOS_ROOT" | grep -v "^\."
}

# Output directory info
echo "✅ EarningLens aliases loaded"
echo "📁 Videos root: $VIDEOS_ROOT"
echo ""
echo "Available commands:"
echo "  videos             - cd to videos directory"
echo "  sushi              - cd to sushi directory"
echo "  studio             - cd to studio directory"
echo "  video <id>         - cd to specific video"
echo "  video-output <id>  - cd to video output"
echo "  list-videos        - list all videos"
