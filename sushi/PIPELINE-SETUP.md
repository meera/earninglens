# Unified Pipeline Setup (Mac ↔ Linux)

This guide sets up a unified output directory structure shared between Mac and Linux (sushi) machines.

## Architecture

```
Mac                             Linux (sushi)
─────────────────────────────────────────────────────
earninglens/                    earninglens/
└── sushi/                      └── sushi/
    └── videos/    ←───────────────→ videos/
        └── {video-id}/             └── {video-id}/
            ├── input/                  ├── input/
            │   └── source.mp4          │   └── source.mp4
            ├── transcripts/            ├── transcripts/
            │   ├── transcript.json     │   ├── transcript.json
            │   └── transcript.vtt      │   └── transcript.vtt
            └── output/                 └── output/
                └── final.mp4               └── final.mp4

         ↑ Shared via mount or git ↑
```

## Setup on Mac

### 1. Source Shell Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# EarningLens aliases
source ~/earninglens/sushi/shell-aliases.sh
```

Then reload:
```bash
source ~/.zshrc
```

### 2. Mount Linux Directory (Optional)

If you want real-time access to sushi files:

```bash
# Using SSHFS
brew install macfuse sshfs

# Mount sushi:/home/user/earninglens/sushi/videos to local
mkdir -p ~/sushi-videos
sshfs user@sushi:/home/user/earninglens/sushi/videos ~/sushi-videos

# Unmount when done
umount ~/sushi-videos
```

### 3. Test Aliases

```bash
videos          # Go to sushi/videos/
list-videos     # List all videos
video pltr-q3-2024    # Go to specific video
```

## Setup on Linux (sushi)

### 1. Clone Repo

```bash
cd ~
git clone <repo-url> earninglens
cd earninglens
```

### 2. Source Shell Aliases

Add to `~/.bashrc`:

```bash
# EarningLens aliases
source ~/earninglens/sushi/shell-aliases.sh
```

Then reload:
```bash
source ~/.bashrc
```

### 3. Create Videos Directory

```bash
mkdir -p ~/earninglens/sushi/videos
```

### 4. Test Aliases

```bash
videos          # Go to sushi/videos/
sushi           # Go to sushi/
studio          # Go to studio/
```

## Unified Output Paths

All tools now use the same output structure:

### Python Scripts (Transcription)
```python
# transcribe.py outputs to:
# sushi/videos/{video-id}/transcripts/transcript.json
```

### Remotion (Video Rendering)
```bash
# Renders to:
# sushi/videos/{video-id}/output/final.mp4
```

### Git Workflow
```bash
# On sushi (Linux):
cd ~/earninglens
git pull
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>
git add sushi/videos/pltr-q3-2024
git commit -m "Add PLTR Q3 2024 video"
git push

# On Mac:
cd ~/earninglens
git pull  # Get the new video
open sushi/videos/pltr-q3-2024/output/final.mp4  # View result
```

## Directory Structure

Each video follows this structure:

```
sushi/videos/{video-id}/
├── input/
│   ├── source.mp4              # Original video (YouTube or manual)
│   └── audio.m4a               # Extracted audio
├── transcripts/
│   ├── transcript.json         # Whisper output (timestamped)
│   ├── transcript.vtt          # WebVTT subtitles
│   ├── transcript.srt          # SRT subtitles
│   ├── transcript.txt          # Plain text
│   ├── paragraphs.json         # Formatted for LLM
│   └── insights.json           # LLM-generated insights
├── output/
│   ├── final.mp4               # Rendered Remotion video
│   └── preview.mp4             # 30s preview clip (optional)
├── thumbnail/
│   ├── auto.jpg                # Auto-generated thumbnail
│   └── custom.jpg              # Custom thumbnail (designed on Mac)
└── metadata.json               # Processing metadata
```

## .gitignore Configuration

Large files should not be committed to git:

```bash
# sushi/.gitignore

# Large video files (upload to R2 instead)
videos/*/input/source.mp4
videos/*/input/audio.m4a
videos/*/output/final.mp4
videos/*/output/preview.mp4

# Keep these small files
!videos/*/transcripts/*.json
!videos/*/transcripts/*.vtt
!videos/*/transcripts/*.srt
!videos/*/transcripts/*.txt
!videos/*/thumbnail/*.jpg
!videos/*/metadata.json
```

## Workflow Examples

### Process Video on Sushi

```bash
# SSH into sushi
ssh sushi

# Load aliases
source ~/.bashrc

# Go to sushi directory
sushi

# Pull latest changes
git pull

# Process video
./scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=...

# Check output
video-output pltr-q3-2024
ls -lh  # See final.mp4

# Commit results (transcripts, metadata only)
git add videos/pltr-q3-2024
git commit -m "Process PLTR Q3 2024"
git push
```

### Review on Mac

```bash
# Pull changes
cd ~/earninglens
git pull

# View transcripts
video-transcripts pltr-q3-2024
cat transcript.txt

# View video (if using mount or copied manually)
video-output pltr-q3-2024
open final.mp4

# Design custom thumbnail
# Save to: sushi/videos/pltr-q3-2024/thumbnail/custom.jpg

# Push thumbnail
git add sushi/videos/pltr-q3-2024/thumbnail/custom.jpg
git commit -m "Add custom thumbnail for PLTR"
git push
```

## Troubleshooting

### Path Issues

```bash
# Check that aliases are loaded
echo $VIDEOS_ROOT

# Should output: /path/to/earninglens/sushi/videos
```

### Permission Issues

```bash
# On sushi, ensure videos directory is writable
chmod -R u+w ~/earninglens/sushi/videos
```

### Mount Issues (Mac)

```bash
# Unmount and remount
umount ~/sushi-videos
sshfs user@sushi:/home/user/earninglens/sushi/videos ~/sushi-videos
```

## Environment Variables

Set these on both Mac and Linux:

```bash
# In ~/.zshrc or ~/.bashrc
export EARNINGLENS_ROOT="$HOME/earninglens"
export SUSHI_ROOT="$EARNINGLENS_ROOT/sushi"
export VIDEOS_ROOT="$SUSHI_ROOT/videos"
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `videos` | Go to videos directory |
| `sushi` | Go to sushi directory |
| `studio` | Go to studio directory |
| `video pltr-q3-2024` | Go to specific video |
| `video-output pltr-q3-2024` | Go to video output |
| `video-transcripts pltr-q3-2024` | Go to transcripts |
| `list-videos` | List all processed videos |

---

**Last Updated:** November 4, 2025
