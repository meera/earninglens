# Batch Processing Quick Start Guide

This guide shows how to test the batch processing pipeline with a single video (batch_size=1).

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd ~/markethawk
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure rclone for R2:**
   ```bash
   source .env
   rclone config create r2-markethawkeye s3 \
     provider Cloudflare \
     access_key_id $R2_ACCESS_KEY_ID \
     secret_access_key $R2_SECRET_ACCESS_KEY \
     endpoint https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

3. **Verify rclone:**
   ```bash
   # List files in bucket
   rclone ls r2-markethawkeye:markeyhawkeye

   # Test upload to nested path (requires --s3-no-check-bucket for R2)
   echo "test" > /tmp/test.txt
   rclone copyto /tmp/test.txt \
     r2-markethawkeye:markeyhawkeye/test-folder/test.txt \
     --s3-no-check-bucket
   ```

## Test with Single Video (Batch Size = 1)

### Step 1: Create test video ID file

Create a file with a single YouTube video ID for testing:

```bash
cd ~/markethawk
echo "dQw4w9WgXcQ" > test_video.txt
```

Replace `dQw4w9WgXcQ` with an actual earnings call YouTube video ID.

### Step 2: Setup batch structure

```bash
python lens/batch_setup.py \
  test_video.txt \
  nov-13-2025-test \
  --batch-size 1
```

This creates:
```
/var/markethawk/batch_runs/nov-13-2025-test/
├── pipeline.yaml
└── batch_001/
    ├── batch.yaml
    └── batch.log
```

### Step 3: Process the batch

```bash
python lens/batch_processor.py \
  /var/markethawk/batch_runs/nov-13-2025-test/batch_001/batch.yaml
```

### Step 4: Monitor progress

In another terminal, watch the log:

```bash
tail -f /var/markethawk/batch_runs/nov-13-2025-test/batch_001/batch.log
```

### Step 5: Check results

After completion, check:

1. **Job directory:**
   ```bash
   ls -la /var/markethawk/youtube/{job_id}/
   ```

2. **Batch status:**
   ```bash
   cat /var/markethawk/batch_runs/nov-13-2025-test/batch_001/batch.yaml
   ```

3. **R2 upload:**
   ```bash
   # List by company (R2 structure: {company}/{quarter}/{pipeline}/)
   rclone ls r2-markethawkeye:markeyhawkeye/nvidia/Q3-2025/nov-13-2025-test/
   ```

4. **Database:**
   ```bash
   psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
     -c "SELECT * FROM markethawkeye.earnings_calls ORDER BY created_at DESC LIMIT 1;"
   ```

## Understanding the Pipeline Steps

Each video goes through 8 steps:

1. **Download** - YouTube video download via Rapid API (cached after first download)
2. **Transcribe** - WhisperX transcription with speaker diarization
3. **Insights** - GPT-4 auto-detection + insights extraction
4. **Validate** - Check if it's an actual earnings call
5. **Fuzzy Match** - Match company against database (7,372 companies)
6. **Extract Audio** - ffmpeg MP3 extraction
7. **Upload R2** - rclone upload to Cloudflare R2
8. **Update DB** - psql update to PostgreSQL

## R2 Storage Structure

**Files are organized by company first** (Option 4: Pipeline name in path):

```
markeyhawkeye/
  └── nvidia/                         # Company slug
      └── Q3-2025/                    # Quarter-Year
          ├── nov-13-2025-audio-only/ # Pipeline version
          │   └── audio.mp3
          ├── dec-01-2025-video/      # Different pipeline (future)
          │   └── video.mp4
          └── jan-15-2026-clips/      # Another pipeline (future)
              └── clip1.mp4
```

**Benefits:**
- ✅ Website navigation: Browse by company → quarter → pipeline type
- ✅ Multiple pipeline types per company/quarter (audio-only, video, clips)
- ✅ Each pipeline version creates separate output
- ⚠️ Re-running same pipeline overwrites (use different version name to avoid)

**Public URLs:**
```
https://a8e524fbf66f8c16fe95c513c6ef5dac.r2.cloudflarestorage.com/markeyhawkeye/nvidia/Q3-2025/nov-13-2025-audio-only/audio.mp3
```

**Website URL structure:**
```
/companies/nvidia/earnings/Q3-2025
```
Shows all available pipeline versions (audio-only, video, etc.)

## Resume from Failure

If a batch fails mid-processing, simply re-run the same command:

```bash
python lens/batch_processor.py \
  /var/markethawk/batch_runs/nov-13-2025-test/batch_001/batch.yaml
```

The processor automatically skips completed steps and resumes from where it left off.

## Scale to 100 Videos

Once you've verified the pipeline works with batch_size=1:

```bash
# Create production batch structure
python lens/batch_setup.py \
  production_videos.txt \
  nov-13-2025-audio-only \
  --batch-size 100

# Process first batch
python lens/batch_processor.py \
  /var/markethawk/batch_runs/nov-13-2025-audio-only/batch_001/batch.yaml
```

## Troubleshooting

### Download fails
- Check RAPID_API_KEY in .env
- Verify YouTube video ID is valid
- Check scripts/download_source.py output

### Transcription fails
- Verify WhisperX is installed (GPU machine only)
- Check GPU memory: `nvidia-smi`
- Verify audio track in source.mp4: `ffprobe input/source.mp4`

### Insights extraction fails
- Check OPENAI_API_KEY in .env
- Verify raw_openai_response.json for errors
- Check OpenAI API usage/quota

### Fuzzy match fails
- Verify companies_master.csv exists
- Check detected company name in batch.yaml
- Try lowering min_score in fuzzy_match.py

### R2 upload fails
- Verify rclone config: `rclone config show r2-markethawkeye`
- Test connection: `rclone lsd r2-markethawkeye:markeyhawkeye`
- Check R2 credentials in .env

### Database update fails
- Check PostgreSQL connection: `psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "\dt markethawkeye.*"`
- Verify earnings_calls table exists
- Check PGPASSWORD environment variable

## File Structure

**Unified with single-job pipeline** - Same structure for manual and batch jobs:

```
/var/markethawk/jobs/{job_id}/
├── job.yaml                        # ✅ Single source of truth
├── source/
│   ├── source.mp4                  # Downloaded video
│   └── metadata.json               # YouTube metadata
├── transcripts/
│   ├── transcript.json             # WhisperX full output
│   └── transcript.paragraphs.json  # Compact format for LLM
├── insights.raw.json               # GPT-4 raw output + usage stats
├── audio.mp3                       # Extracted MP3
└── thumbnails/                     # (future)
    └── thumbnail.jpg
```

**Benefits:**
- ✅ Same path for manual and batch jobs
- ✅ job.yaml = single source of truth (original design restored)
- ✅ Portable (can move/retry independently)
- ✅ Organized with subdirectories

The batch structure:

```
/var/markethawk/batch_runs/{version}/
├── pipeline.yaml               # Overall config
├── batch_001/
│   ├── batch.yaml             # Batch status (jobs, steps, stats)
│   └── batch.log              # Detailed log
├── batch_002/
│   ├── batch.yaml
│   └── batch.log
...
```

## Next Steps

1. **Test with batch_size=1** ← Start here!
2. Review PRD: `PRD/BATCH-VIDEO-PROCESSING.md`
3. Scale to batch_size=100
4. Sync database to production: `pg_dump` + `psql`
5. Update web app to display earnings calls
