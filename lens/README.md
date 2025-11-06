# Lens Pipeline - Earnings Video Processing

Complete Python-based pipeline for processing earnings call videos. Works on both Mac and Linux.

**Supports parallel processing** - process multiple videos simultaneously with automatic state management.

## Quick Start

```bash
# Setup (one time)
cd ~/earninglens
source .venv/bin/activate
pip install -r requirements.txt

# Process a video (all steps)
python lens/process_earnings.py --url "https://www.youtube.com/watch?v=jUnV3LiN0_k"
```

## What It Does

1. **Downloads** video from YouTube (via RapidAPI)
2. **Parses** metadata → auto-detects company & quarter
3. **Removes** initial silence from video
4. **Transcribes** with Whisper (GPU-accelerated on sushi)
5. **Extracts** insights with LLM
6. **Renders** video with Remotion
7. **Uploads** to YouTube

---

## Individual Steps

```bash
# Download only
python process_earnings.py --url "..." --step download

# Parse metadata
python process_earnings.py --url "..." --step parse

# Remove silence
python process_earnings.py --url "..." --step remove-silence

# Transcribe
python process_earnings.py --url "..." --step transcribe

# Extract insights
python process_earnings.py --url "..." --step insights

# Render video
python process_earnings.py --url "..." --step render

# Upload to YouTube
python process_earnings.py --url "..." --step upload
```

---

## Resume from Step

```bash
# Resume from transcription onwards
python process_earnings.py --url "..." --from transcribe

# Resume from render onwards
python process_earnings.py --url "..." --from render
```

---

## File Structure

```
/var/earninglens/
├── _downloads/                    # Permanent archive
│   └── <video_id>/
│       ├── input/
│       │   ├── source.mp4        # Original (with silence)
│       │   └── metadata.json     # RapidAPI data
│       └── .state.json           # Processing state
│
├── PLTR/                          # Auto-organized by company
│   └── Q3-2024/                   # Auto-detected quarter
│       ├── input/
│       │   └── source.mp4        # Trimmed (silence removed)
│       ├── transcripts/
│       │   ├── transcript.json
│       │   └── insights.json
│       ├── take1/
│       │   ├── final.mp4
│       │   └── thumbnail.jpg
│       └── metadata.json
```

---

## State Tracking

- State is saved in `_downloads/<video_id>/.state.json`
- Rerun safely - completed steps are skipped
- Resume from any step after failure

**Example state:**
```json
{
  "steps": {
    "download": {"status": "completed", "timestamp": "2024-11-05T10:30:00"},
    "parse": {"status": "completed", "data": {"ticker": "PLTR", "quarter": "Q3-2024"}},
    "transcribe": {"status": "in_progress"}
  }
}
```

---

## Mac + Linux Workflow

Works on both! Fast steps on Mac, heavy processing on Linux GPU.

**On Mac (Quick steps):**
```bash
cd ~/earninglens/sushi
source .venv/bin/activate

# Download multiple videos
python process_earnings.py --url "video1" --step download
python process_earnings.py --url "video2" --step download

# Parse them all
python process_earnings.py --url "video1" --step parse
python process_earnings.py --url "video2" --step parse
```

**On Sushi (GPU processing):**
```bash
ssh meera@192.168.1.101
cd ~/earninglens/sushi
source .venv/bin/activate

# Process from transcribe onwards (GPU-accelerated)
python process_earnings.py --url "video1" --from transcribe
python process_earnings.py --url "video2" --from transcribe
```

Since `/var/earninglens/` is mounted on both, files are instantly available!

---

## Performance (46-min video)

| Step | Mac (CPU) | Sushi (GPU) |
|------|-----------|-------------|
| Download | 1-2 min | 1-2 min |
| Parse | <1 sec | <1 sec |
| Remove Silence | 5-10 sec | 5-10 sec |
| **Transcribe** | **60-90 min** | **15-20 min** ⚡ |
| Insights | 30 sec | 30 sec |
| **Render** | **20-30 min** | **5-10 min** ⚡ |
| Upload | 2-3 min | 2-3 min |
| **Total** | **~90-120 min** | **~25-35 min** |

**3-4x faster on GPU!**

---

## Individual Scripts

All scripts can be run directly:

- `scripts/download-source.py` - Download from YouTube
- `scripts/parse-metadata.py` - Parse company/quarter
- `scripts/remove-silence.py` - Remove initial silence
- `transcribe.py` - Whisper transcription
- `process_video.py` - LLM insights extraction

---

## Setup

### On Mac
```bash
cd ~/earninglens/sushi

# Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Install ffmpeg
brew install ffmpeg

# Mount /var/earninglens
sudo ln -sf /Volumes/earninglens /var/earninglens

# Copy .env
cp ../.env .env
```

### On Sushi
```bash
cd ~/earninglens/sushi

# Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Install ffmpeg
sudo apt install ffmpeg

# Fix permissions
sudo chown -R meera:meera /var/earninglens

# Copy .env
cp ../.env .env
```

---

## Troubleshooting

**"Metadata not found"**
```bash
python process_earnings.py --url "..." --step download
```

**"Could not parse company/quarter"**
```bash
# Check metadata
cat /var/earninglens/_downloads/<video_id>/input/metadata.json

# Add ticker to TICKER_MAP in scripts/parse-metadata.py
```

**Reset state**
```bash
rm /var/earninglens/_downloads/<video_id>/.state.json
python process_earnings.py --url "..."
```

---

## Documentation

- **Complete Guide:** [WORKFLOW-GUIDE.md](./WORKFLOW-GUIDE.md)
- **Network Storage:** [NETWORK-STORAGE.md](./NETWORK-STORAGE.md)
- **Pipeline Setup:** [PIPELINE-SETUP.md](./PIPELINE-SETUP.md)

---

**Process your first video:**
```bash
python process_earnings.py --url "https://www.youtube.com/watch?v=jUnV3LiN0_k"
```
