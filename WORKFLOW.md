# Video Production Workflow

**Goal:** Process 100+ earnings videos efficiently using sushi (GPU) for heavy work and Mac for editing.

---

## Infrastructure Setup (Already Done ✅)

### **Shared Directory:** `/var/earninglens/`

This directory is **accessible from both machines:**
- **On sushi:** `/var/earninglens/`
- **On Mac:** `/var/earninglens/` (network mapped)

**Verify it's working:**
```bash
# On Mac
ls /var/earninglens/
# Should show: PLTR/, HOOD/, etc.

# On sushi (via SSH)
ssh sushi "ls /var/earninglens/"
# Should show same folders
```

**No setup needed!** Files created on either machine are instantly visible on the other.

---

## Standard Workflow (Per Video)

### **Step 1: Process on Sushi** (Heavy: 20-30 min)

```bash
# SSH to sushi
ssh sushi

# Navigate to repo
cd ~/earninglens

# Pull latest code (themes, components, etc.)
git pull

# Process earnings video
source .venv/bin/activate
python lens/process_earnings.py --url "https://www.youtube.com/watch?v=_cYsXG6FAzk"

# Output will be in: /var/earninglens/COMPANY/QUARTER/
# - video.mp4
# - audio.mp4
# - transcript.json
# - transcript.paragraphs.json
# - insights.json

# Exit SSH
exit
```

**What happens:**
- Downloads video
- Transcribes with Whisper (GPU)
- Extracts insights with GPT-4o
- All files saved to `/var/earninglens/COMPANY/QUARTER/`

---

### **Step 2: Edit on Mac** (Light: 5-10 min)

```bash
# On Mac - files are automatically available!
cd ~/earninglens/studio

# Check what was created
ls /var/earninglens/
# You'll see the new company folder

# Example: HOOD (Robinhood)
ls /var/earninglens/HOOD/Q3-2025/
# - video.mp4
# - audio.mp4
# - transcript.json
# - insights.json

# Create composition
cat /var/earninglens/HOOD/Q3-2025/insights.json
# Review: company name, ticker, chapters, etc.

# Create composition file (or copy from template)
cp src/compositions/PLTR_Q3_2025-take2.tsx src/compositions/HOOD_Q3_2025.tsx

# Edit composition:
# - Update company name, ticker, date
# - Update theme: getTheme('HOOD')
# - Update audio path
# - Update chapters from insights.json

# Preview in Remotion Studio
npm start
# Open http://localhost:8082
# Select new composition

# Commit ONLY the composition code
git add src/compositions/HOOD_Q3_2025.tsx
git add src/Root.tsx  # If you registered the composition
git commit -m "Add HOOD Q3 2025 composition"
git push
```

**What happens:**
- You edit composition code on Mac
- Files read from `~/sushi-videos/` (mounted from sushi)
- Only commit code, NOT video files
- One clean git commit

---

### **Step 3: Render on Sushi** (Heavy: 20-30 min)

```bash
# SSH to sushi
ssh sushi

# Navigate to repo
cd ~/earninglens/studio

# Pull latest code (your composition)
git pull

# Render video (GPU-accelerated)
npm run render -- HOOD-Q3-2025

# Output: /var/earninglens/HOOD/Q3-2025/output/final.mp4

# Exit SSH
exit
```

**What happens:**
- Renders 40-minute video using GPU
- Saves to `/var/earninglens/` (accessible on Mac via mount)

---

### **Step 4: Preview Before Upload** (Mac - 5 min)

**IMPORTANT:** Always preview before uploading to YouTube to catch timing errors!

```bash
# Ensure media server is running
npx serve /var/earninglens --cors -p 8080

# Open preview in browser
# http://192.168.1.101:8080/preview-chapters.html
```

**What to Check:**

1. **Video Playback**
   - Watch full video or spot-check key moments
   - Verify metric overlays appear at correct times
   - Check speaker labels show at right moments

2. **Chapter Markers**
   - Click each timestamp in description
   - Verify video jumps to correct moment
   - Ensure chapter titles are descriptive

3. **Thumbnails**
   - Review all 4 thumbnail variations
   - Click to download your preferred one
   - Verify text is readable on background

4. **YouTube Description**
   - Copy description text
   - Verify formatting looks good
   - Check hashtags are appropriate

**If Issues Found:**

```bash
# Fix composition timestamps
# Edit: studio/src/compositions/HOOD_Q3_2025.tsx

# Re-render (on sushi)
ssh sushi
cd ~/earninglens/studio
npm run render -- HOOD-Q3-2025

# Preview again
# http://192.168.1.101:8080/preview-chapters.html
```

---

### **Step 5: Upload to YouTube** (Mac or Sushi)

```bash
# On Mac (files already accessible in shared directory)
cd ~/earninglens
source .venv/bin/activate

python lens/scripts/upload_youtube.py \
  /var/earninglens/HOOD/Q3-2025/output/final.mp4 \
  /var/earninglens/HOOD/Q3-2025/insights.json

# Or on Sushi (same paths):
ssh sushi
cd ~/earninglens
source .venv/bin/activate
python lens/scripts/upload_youtube.py \
  /var/earninglens/HOOD/Q3-2025/output/final.mp4 \
  /var/earninglens/HOOD/Q3-2025/insights.json
```

---

## Git Workflow Summary

### ✅ **DO Commit:**
- New compositions (`src/compositions/*.tsx`)
- New components (`src/components/*.tsx`)
- New themes (`src/themes/companies/*.ts`)
- Theme registry updates (`src/themes/index.ts`)
- Root.tsx updates (composition registration)

### ❌ **DON'T Commit:**
- Video files (`*.mp4`, `*.wav`)
- Audio files (`*.mp4`, `*.m4a`)
- Transcripts (`*.json`, `*.vtt`)
- Insights (`insights.json`)
- Rendered outputs (`output/`)

**Why?** These files are large and auto-generated. They live in `/var/earninglens/` only.

---

## File Locations Reference

### Shared Directory (Both Machines):
```
/var/earninglens/            (accessible from both sushi and Mac)
├── PLTR/
│   └── Q3-2025/
│       ├── video.mp4            (original download)
│       ├── audio.mp4            (trimmed)
│       ├── transcript.json
│       ├── transcript.paragraphs.json
│       ├── insights.json
│       └── output/
│           └── final.mp4        (rendered video)
├── HOOD/
│   └── Q3-2025/
└── AAPL/
    └── Q4-2024/
```

**Same path on both machines:** `/var/earninglens/`

### Git Repo (both machines):
```
~/earninglens/
├── studio/
│   ├── src/
│   │   ├── compositions/
│   │   │   ├── PLTR_Q3_2025.tsx
│   │   │   ├── HOOD_Q3_2025.tsx
│   │   │   └── AAPL_Q4_2024.tsx
│   │   ├── components/
│   │   │   └── SubscribeLowerThird.tsx
│   │   └── themes/
│   │       └── companies/
│   │           ├── robinhood.ts
│   │           └── palantir.ts
│   └── public/
│       └── audio/               (symlink or copy for local preview)
└── lens/
    └── process_earnings.py
```

---

## Troubleshooting

### Shared Directory Not Accessible
```bash
# On Mac - verify access
ls /var/earninglens/
# Should show company folders

# If not accessible, check network connection to sushi
ping sushi

# SSH should work
ssh sushi "ls /var/earninglens/"
```

### Files Not Visible After Processing
```bash
# Verify file was created on sushi
ssh sushi "ls /var/earninglens/COMPANY/QUARTER/"

# Check Mac can see it
ls /var/earninglens/COMPANY/QUARTER/

# If not, may need to wait a few seconds for network sync
```

### Render Fails on Sushi
```bash
# Make sure audio file is accessible
ssh sushi
ls /var/earninglens/HOOD/Q3-2025/audio.mp4

# Check composition references correct path
cat ~/earninglens/studio/src/compositions/HOOD_Q3_2025.tsx
# Should use: staticFile('audio/HOOD_Q3_2025.mp4')

# Copy audio to public/ for rendering
cp /var/earninglens/HOOD/Q3-2025/audio.mp4 \
   ~/earninglens/studio/public/audio/HOOD_Q3_2025.mp4
```

---

## Benefits of This Workflow

✅ **Minimal git commits** - Only commit actual code changes
✅ **No manual file copying** - Mount handles it automatically
✅ **Fast editing** - Work on Mac, render on sushi
✅ **Clean repo** - No large video files in git
✅ **Easy to scale** - Process 100+ videos without bloating git history
✅ **Automatic sync** - Files appear on Mac instantly after sushi processing

---

## Quick Reference

```bash
# Process on sushi
ssh sushi "cd ~/earninglens && source .venv/bin/activate && python lens/process_earnings.py --url 'YOUTUBE_URL'"

# Check files created
ls /var/earninglens/COMPANY/QUARTER/

# Edit composition on Mac
cd ~/earninglens/studio
# Edit src/compositions/COMPANY_QUARTER.tsx
git add src/compositions/ && git commit -m "Add COMPANY QUARTER" && git push

# Render on sushi (after creating composition)
ssh sushi "cd ~/earninglens/studio && git pull && npm run render -- COMPANY-QUARTER-YEAR"

# Upload from Mac
source .venv/bin/activate && python lens/scripts/upload_youtube.py /var/earninglens/COMPANY/QUARTER/output/final.mp4 /var/earninglens/COMPANY/QUARTER/insights.json
```

---

**Last Updated:** November 6, 2025
