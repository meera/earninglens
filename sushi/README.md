# Sushi Production Pipeline

Complete earnings video production pipeline running on sushi GPU machine.

## Network Storage

Sushi has network-accessible drives for video storage:
- **home-meera** (192.168.1.101/home-meera): ~1.7TB
- **var-data** (192.168.1.101/var-data): Large capacity (RECOMMENDED)

**Configure storage:** `./setup-storage.sh`
**Documentation:** See `NETWORK-STORAGE.md`

Videos can be stored on network drives to keep git repo small.

## Directory Structure (Co-located by Video)

```
sushi/
├── videos/
│   ├── pltr-q3-2024/              # Video ID folder
│   │   ├── input/
│   │   │   └── source.mp4         # Downloaded/uploaded source video
│   │   ├── transcripts/
│   │   │   ├── transcript.json    # Whisper full output
│   │   │   ├── transcript.vtt     # Subtitles
│   │   │   ├── transcript.srt     # Subtitles
│   │   │   ├── transcript.txt     # Plain text
│   │   │   ├── paragraphs.json    # Formatted for LLM
│   │   │   └── insights.json      # LLM-extracted insights
│   │   ├── output/
│   │   │   └── final.mp4          # Rendered Remotion video
│   │   ├── thumbnail/
│   │   │   └── custom.jpg         # Custom designed thumbnail
│   │   └── metadata.json          # Video metadata & processing status
│   │
│   ├── nvda-q3-2024/
│   └── ...
│
├── scripts/
│   ├── process-earnings.sh        # Master script (runs everything)
│   ├── download-source.py         # Download from YouTube or URL
│   ├── transcribe.py              # Whisper + LLM (existing)
│   ├── render-video.js            # Remotion rendering
│   ├── upload-youtube.js          # YouTube upload
│   └── save-to-db.js              # Database record creation
│
├── config/
│   └── .env                       # API keys & credentials
│
└── logs/
    └── pltr-q3-2024.log          # Processing logs per video
```

---

## Workflow

### 1. On Mac: Create Video Entry

Edit `sushi/videos-list.md`:

```markdown
## Videos to Process

- [ ] pltr-q3-2024 - Palantir Q3 2024 - https://youtube.com/watch?v=...
- [ ] nvda-q3-2024 - NVIDIA Q3 2024 - (manual upload)
```

```bash
git add -A
git commit -m "Add PLTR Q3 2024 to queue"
git push
```

### 2. On Sushi: Pull & Process

```bash
# Pull latest
git pull

# Option A: Download from YouTube
./sushi/scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=jUnV3LiN0_k

# Option B: Use manually uploaded file
# (First: scp video to sushi/videos/pltr-q3-2024/input/source.mp4)
./sushi/scripts/process-earnings.sh pltr-q3-2024 manual

# This runs entire pipeline:
# 1. Download (if YouTube)
# 2. Transcribe with Whisper
# 3. Extract insights with LLM
# 4. Render video with Remotion
# 5. Upload to YouTube
# 6. Save record to database
```

### 3. On Mac: Custom Thumbnail

```bash
# Pull results
git pull

# Design custom thumbnail
# Save to: sushi/videos/pltr-q3-2024/thumbnail/custom.jpg

# Push back
git add sushi/videos/pltr-q3-2024/thumbnail/custom.jpg
git commit -m "Add custom thumbnail for PLTR Q3"
git push
```

### 4. On Sushi: Update YouTube Thumbnail

```bash
git pull
./sushi/scripts/update-thumbnail.sh pltr-q3-2024
```

---

## One-Command Processing

```bash
# Complete pipeline in one command
./sushi/scripts/process-earnings.sh <video-id> <source> [url]

# Examples:
./sushi/scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=jUnV3LiN0_k
./sushi/scripts/process-earnings.sh nvda-q3-2024 manual
```

**What it does:**
1. ✅ Creates video folder structure
2. ✅ Downloads source (if YouTube)
3. ✅ Transcribes with Whisper (GPU)
4. ✅ Extracts insights with LLM
5. ✅ Renders Remotion video
6. ✅ Uploads to YouTube
7. ✅ Creates database record
8. ✅ Updates git with results

---

## Setup (One-time on Sushi)

```bash
# 1. Install dependencies
./sushi/setup-sushi.sh

# 2. Install Node.js & Remotion
./sushi/setup-node.sh

# 3. Configure credentials
cp sushi/config/.env.example sushi/config/.env
nano sushi/config/.env

# Add:
# OPENAI_API_KEY=...
# YOUTUBE_API_KEY=...
# DATABASE_URL=...
```

---

## File Locations

**Per video, all assets co-located:**

```
sushi/videos/pltr-q3-2024/
├── input/source.mp4           # Source video (75 MB)
├── transcripts/
│   ├── transcript.json        # Full Whisper (200 KB)
│   ├── transcript.vtt         # Subtitles (50 KB)
│   ├── paragraphs.json        # LLM input (150 KB)
│   └── insights.json          # LLM output (100 KB)
├── output/final.mp4           # Rendered video (100 MB)
├── thumbnail/custom.jpg       # Custom thumbnail (200 KB)
└── metadata.json              # Status & info (5 KB)
```

**metadata.json format:**
```json
{
  "video_id": "pltr-q3-2024",
  "ticker": "PLTR",
  "company": "Palantir Technologies",
  "quarter": "Q3",
  "year": 2024,
  "created_at": "2024-11-03T20:00:00Z",
  "status": {
    "download": "completed",
    "transcribe": "completed",
    "insights": "completed",
    "render": "completed",
    "upload": "completed",
    "database": "completed"
  },
  "youtube": {
    "video_id": "abc123xyz",
    "url": "https://youtube.com/watch?v=abc123xyz",
    "uploaded_at": "2024-11-03T22:00:00Z"
  },
  "database": {
    "record_id": "rec_xyz123",
    "created_at": "2024-11-03T22:05:00Z"
  }
}
```

---

## Cost Estimates

**Per 46-minute earnings video:**

| Step | Resource | Cost |
|------|----------|------|
| Download | YouTube/IR | Free |
| Transcribe | Whisper (GPU) | Free |
| LLM Insights | OpenAI gpt-4o-mini | ~$0.02 |
| Render | Remotion (GPU) | Free |
| Upload | YouTube API | Free |
| Database | Neon | Free (tier) |
| **Total** | | **~$0.02** |

**Time per video:** ~20-30 minutes (mostly transcription)

---

## Monitoring

**Check status:**
```bash
# View processing log
tail -f sushi/logs/pltr-q3-2024.log

# Check metadata
cat sushi/videos/pltr-q3-2024/metadata.json
```

**List all videos:**
```bash
ls -lh sushi/videos/
```

---

## Troubleshooting

**GPU out of memory:**
```bash
# Use smaller Whisper model
./sushi/scripts/process-earnings.sh pltr-q3-2024 youtube <url> --whisper-model small
```

**Remotion rendering slow:**
```bash
# Check GPU usage
nvidia-smi

# Render with CPU fallback
./sushi/scripts/process-earnings.sh pltr-q3-2024 youtube <url> --no-gpu
```

**YouTube upload failed:**
```bash
# Retry upload only
./sushi/scripts/upload-youtube.js pltr-q3-2024
```

**Database save failed:**
```bash
# Retry database only
./sushi/scripts/save-to-db.js pltr-q3-2024
```
