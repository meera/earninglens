# Sushi Quick Start Guide

Complete earnings video production pipeline on GPU machine.

## First-Time Setup (On Sushi)

```bash
# 1. Clone repo and pull latest
git pull

# 2. Setup Python environment
cd sushi
./setup-sushi.sh

# 3. Setup Node.js & Remotion
./setup-node.sh

# 4. Configure credentials
cp config/.env.example config/.env
nano config/.env

# Add:
# - OPENAI_API_KEY
# - YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
# - DATABASE_URL
```

## Process a Single Video

### Option A: YouTube Source

```bash
./scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=jUnV3LiN0_k
```

This will:
1. ✅ Download video from YouTube
2. ✅ Extract audio
3. ✅ Transcribe with Whisper (GPU)
4. ✅ Extract insights with LLM
5. ✅ Render Remotion video
6. ✅ Upload to YouTube
7. ✅ Save to database
8. ✅ Commit to git

### Option B: Manual Upload

```bash
# 1. Upload video first
scp earnings-call.mp4 sushi:~/earninglens/sushi/videos/nvda-q3-2024/input/source.mp4

# 2. Process
./scripts/process-earnings.sh nvda-q3-2024 manual
```

## Daily Workflow

### On Mac: Add Videos to Queue

1. Edit `sushi/videos-list.md`
2. Add videos to process:
   ```markdown
   - [ ] pltr-q3-2024 - Palantir Q3 2024 - https://youtube.com/watch?v=...
   - [ ] nvda-q4-2024 - NVIDIA Q4 2024 - https://youtube.com/watch?v=...
   ```
3. Commit and push:
   ```bash
   git add sushi/videos-list.md
   git commit -m "Add videos to process"
   git push
   ```

### On Sushi: Process Videos

```bash
# Pull latest
git pull

# Process each video
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>

# Wait for completion (~20-30 mins)
# Check logs: tail -f logs/pltr-q3-2024.log
```

### On Mac: Design Thumbnails

```bash
# Pull results
git pull

# Design thumbnail (use Figma, Canva, etc.)
# Save to: sushi/videos/pltr-q3-2024/thumbnail/custom.jpg

# Push back
git add sushi/videos/pltr-q3-2024/thumbnail/custom.jpg
git commit -m "Add custom thumbnail for PLTR Q3"
git push
```

### On Sushi: Update YouTube Thumbnail

```bash
git pull
./scripts/update-thumbnail.sh pltr-q3-2024
```

## File Structure

Each video creates this structure:

```
sushi/videos/pltr-q3-2024/
├── input/
│   └── source.mp4              # Downloaded/uploaded video
├── transcripts/
│   ├── transcript.json         # Whisper output
│   ├── transcript.vtt          # Subtitles
│   ├── transcript.srt          # Subtitles
│   ├── transcript.txt          # Plain text
│   ├── paragraphs.json         # Formatted for LLM
│   └── insights.json           # LLM insights
├── output/
│   └── final.mp4               # Rendered video
├── thumbnail/
│   └── custom.jpg              # Custom thumbnail
└── metadata.json               # Processing status
```

## Monitoring

### Check Processing Status

```bash
# View live logs
tail -f sushi/logs/pltr-q3-2024.log

# Check metadata
cat sushi/videos/pltr-q3-2024/metadata.json
```

### Check GPU Usage

```bash
nvidia-smi
watch -n 1 nvidia-smi  # Update every second
```

## Troubleshooting

### GPU Out of Memory

```bash
# Use smaller Whisper model
# Edit transcribe.py: model = "small" instead of "medium"
```

### YouTube Upload Failed

```bash
# Retry upload only
node scripts/upload-youtube.js pltr-q3-2024
```

### Database Save Failed

```bash
# Retry database save only
node scripts/save-to-db.js pltr-q3-2024
```

### Remotion Rendering Failed

```bash
# Retry rendering only
node scripts/render-video.js pltr-q3-2024
```

## Cost Per Video

- Download: **Free**
- Transcribe (Whisper GPU): **Free**
- LLM Insights (GPT-4o-mini): **~$0.02**
- Render (GPU): **Free**
- Upload (YouTube): **Free**
- Database (Neon): **Free (tier)**

**Total: ~$0.02 per video**

## Time Per Video

- Download: ~1-2 min
- Transcribe (46 min video): ~15-20 min
- LLM Insights: ~30 sec
- Render: ~5-10 min
- Upload: ~2-3 min
- Database: ~1 sec

**Total: ~20-30 minutes**

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `process-earnings.sh` | Master orchestration (run everything) |
| `download-source.py` | Download from YouTube or manual |
| `transcribe.py` | Whisper transcription |
| `process_video.py` | Transcribe + LLM insights |
| `render-video.js` | Remotion rendering |
| `upload-youtube.js` | YouTube upload |
| `save-to-db.js` | Database record creation |
| `update-thumbnail.sh` | Update YouTube thumbnail |

## Environment Variables

See `config/.env.example` for required credentials.

## Next Steps

1. **First Video**: Process Palantir Q3 2024
2. **Scale Up**: Process 10 videos
3. **Optimize**: Tune LLM prompts, Remotion templates
4. **Automate**: Schedule processing via cron
5. **Scale**: Target 100+ videos per quarter

## Support

- Logs: `sushi/logs/<video-id>.log`
- README: `sushi/README.md`
- Issues: Check git commit history

---

**Last Updated:** November 3, 2025
**Version:** 1.0
