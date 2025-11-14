# Batch Video Processing System - PRD

**Version:** 2.0 (Simplified with Unix Commands)
**Date:** 2025-11-13
**Author:** Claude (with Meera)
**Status:** Draft - Ready for Review

---

## Executive Summary

Build a scalable batch processing system to convert 8,000+ earnings call YouTube videos into audio-only MP3 files with AI-generated transcripts, insights, and highlights. Store outputs in R2 and serve via markethawkeye.com.

**MVP Goal:** Process videos in batches, extract company/quarter/year automatically, publish to R2, update LOCAL database (sync to production manually with psql).

**Philosophy:** Unix commands > custom scripts. Use `rclone`, `psql`, `ffmpeg` directly.

**Timeline:** 2-3 days development + 3-4 days processing (8000 videos)

---

## Problem Statement

### Current State
- Manual job creation (one video at a time)
- Requires user to provide ticker, quarter, company name upfront
- No batch processing capability
- 8,000 videos to process → infeasible manually
- No validation (might process non-earnings videos)
- Database updates risky (directly to production)

### Desired State
- Automated batch processing (100 videos per batch)
- Auto-detect company, quarter, year from transcript + YouTube metadata
- Validate videos are actual earnings calls (skip non-earnings)
- Versioned pipeline runs (e.g., "nov-13-2025-audio-only")
- Update LOCAL database first, validate, then sync to production with psql
- Use rclone directly (not Python wrappers)
- Use psql directly (not custom database scripts)
- Manual control (pilot-copilot model)

---

## Goals & Non-Goals

### Goals
1. Process 8,000 videos without manual intervention per video
2. Auto-detect company/quarter/year using GPT-4 with YouTube metadata context
3. **Validate videos are earnings calls** - skip product launches, interviews
4. Fuzzy match company names against database (7,372 companies)
5. Generate audio-only MP3 files (MVP - skip Remotion rendering)
6. Upload to R2 using **rclone** commands directly
7. **Update LOCAL database** (Mac: 192.168.86.250:54322) using **psql**
8. **Manual sync to production** using psql dump/restore
9. **Store raw LLM outputs** for debugging and cost tracking
10. Support batch sizes from 1 (testing) to 100 (production)
11. Manual control: retry failed batches, resume from specific batch
12. Clear progress tracking (YAML-based)

### Non-Goals
1. ❌ Parallel batch processing (sequential only for MVP)
2. ❌ Automatic retry on failure (manual retry only)
3. ❌ Real-time progress UI (CLI status checks only)
4. ❌ Video rendering (Remotion) - audio-only MVP
5. ❌ YouTube upload (outputs stored in R2 only)
6. ❌ Database migrations (assume schema exists)
7. ❌ Custom database scripts (use psql directly)
8. ❌ Python R2 wrappers (use rclone directly)

---

## Architecture

### Directory Structure

```
/var/markethawk/
  ├── youtube/                              # Job storage
  │   ├── dQw4w9WgXcQ_a3b9/                # Job ID: youtube_id + 4-char uuid
  │   │   ├── job.yaml                      # Single source of truth
  │   │   ├── source.mp4                    # Downloaded video
  │   │   ├── metadata.json                 # YouTube metadata (title, desc, channel)
  │   │   ├── audio.mp3                     # Extracted audio
  │   │   ├── transcript.json               # WhisperX output
  │   │   ├── paragraphs.json               # Speaker-diarized paragraphs
  │   │   ├── insights.json                 # GPT-4 structured insights
  │   │   └── insights.raw.json             # GPT-4 raw output + usage stats
  │   └── abc123xyz_k7m2/
  │       └── ...
  │
  └── batch_runs/                           # Batch orchestration
      └── nov-13-2025-audio-only/           # Pipeline version
          ├── pipeline.yaml                  # Config (batch size, DB URLs, etc.)
          ├── progress.yaml                  # Overall progress (lightweight)
          ├── video_ids_master.txt           # Full input list
          ├── errors.log                     # Aggregated errors (pipeline-level)
          │
          └── batches/
              ├── batch_001/
              │   ├── batch.yaml             # Batch status (100 videos)
              │   ├── batch.log              # Processing log (CO-LOCATED)
              │   └── video_ids.txt          # Input for this batch
              ├── batch_002/
              │   ├── batch.yaml
              │   ├── batch.log              # CO-LOCATED with batch
              │   └── video_ids.txt
              └── ... (80 batches for 8000 videos)
```

---

## Pipeline Steps (8 Steps)

```
1. Download      → source.mp4 + metadata.json (YouTube title/desc/channel)
2. Transcribe    → transcript.json, paragraphs.json (WhisperX + diarization)
3. Insights      → insights.json + insights.raw.json (GPT-4 with YouTube context)
4. Validate      → Check if earnings call (skip if not)
5. Fuzzy Match   → Match company name to database
6. Extract Audio → audio.mp3 (ffmpeg)
7. Upload R2     → rclone copy (direct command, no Python wrapper)
8. Update DB     → psql to LOCAL database (sync to production manually)
```

**Duration per video:** ~2-3 minutes (if valid earnings call)
**8,000 videos:** ~267 hours sequential (skip ~10-15% non-earnings)

---

## Unix Commands (Not Scripts!)

### Step 6: Extract Audio (ffmpeg)

```bash
ffmpeg -i /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/source.mp4 \
  -vn -c:a libmp3lame -b:a 128k \
  /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/audio.mp3
```

---

### Step 7: Upload to R2 (rclone)

**Setup rclone config once:**

```bash
# Load credentials from .env file
source .env

# Configure rclone for R2
rclone config create r2-markethawkeye s3 \
  provider Cloudflare \
  access_key_id $R2_ACCESS_KEY_ID \
  secret_access_key $R2_SECRET_ACCESS_KEY \
  endpoint https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com

# Verify config
rclone listremotes
# Output: r2-markethawkeye:

# Test connection
rclone lsd r2-markethawkeye:markeyhawkeye
```

**Upload job files:**

```bash
# Upload all files for a job
rclone copy \
  /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/ \
  r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ \
  --include "audio.mp3" \
  --include "metadata.json" \
  --include "transcript.json" \
  --include "paragraphs.json" \
  --include "insights.json" \
  --include "insights.raw.json" \
  --progress

# Verify upload
rclone ls r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/
```

**Batch upload (all jobs at once):**

```bash
# Upload all jobs from batch_001
for job_dir in /var/markethawk/youtube/*/; do
  job_id=$(basename "$job_dir")
  rclone copy "$job_dir" \
    "r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/$job_id/" \
    --include "*.mp3" \
    --include "*.json" \
    --progress
done
```

---

### Step 8: Update Database (psql)

**Update LOCAL database:**

```bash
# Update local database (Mac)
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres <<SQL
UPDATE markethawkeye.companies
SET metadata = jsonb_set(
  metadata,
  '{earnings_videos,nov-13-2025-audio-only,Q3-2025}',
  '{
    "job_id": "dQw4w9WgXcQ_a3b9",
    "youtube_id": "dQw4w9WgXcQ",
    "r2_base": "nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9",
    "audio_url": "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/audio.mp3",
    "duration_seconds": 3215,
    "published_at": "2025-11-13T15:08:30Z"
  }'::jsonb
)
WHERE ticker = 'NVDA';
SQL
```

**Batch update (from CSV):**

```bash
# Generate SQL from batch results
cat > /tmp/batch_001_updates.sql <<EOF
UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, '{earnings_videos,nov-13-2025-audio-only,Q3-2025}', '{"job_id":"dQw4w9WgXcQ_a3b9",...}'::jsonb) WHERE ticker = 'NVDA';
UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, '{earnings_videos,nov-13-2025-audio-only,Q4-2024}', '{"job_id":"abc123xyz_k7m2",...}'::jsonb) WHERE ticker = 'AAPL';
EOF

# Execute batch update
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -f /tmp/batch_001_updates.sql
```

**Sync LOCAL → PRODUCTION:**

```bash
# 1. Dump earnings_videos data from local
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  COPY (
    SELECT ticker, metadata->'earnings_videos'->'nov-13-2025-audio-only' as earnings_data
    FROM markethawkeye.companies
    WHERE metadata->'earnings_videos' ? 'nov-13-2025-audio-only'
  ) TO STDOUT WITH CSV HEADER
" > /tmp/earnings_local.csv

# 2. Review data
head /tmp/earnings_local.csv

# 3. Generate production update SQL
python -c "
import csv
import json

with open('/tmp/earnings_local.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        ticker = row['ticker']
        data = row['earnings_data']
        print(f\"UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, '{{earnings_videos,nov-13-2025-audio-only}}', '{data}'::jsonb) WHERE ticker = '{ticker}';\")
" > /tmp/sync_to_production.sql

# 4. Apply to production (DRY RUN first)
psql $NEON_DATABASE_URL --dry-run -f /tmp/sync_to_production.sql

# 5. Confirm and apply
psql $NEON_DATABASE_URL -f /tmp/sync_to_production.sql
```

**Simpler sync (dump entire table):**

```bash
# Dump local companies table
pg_dump -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -t markethawkeye.companies \
  --data-only \
  > /tmp/companies_local.sql

# Review dump
head -50 /tmp/companies_local.sql

# Restore to production (with backup first!)
psql $NEON_DATABASE_URL -c "CREATE TABLE markethawkeye.companies_backup AS SELECT * FROM markethawkeye.companies;"
psql $NEON_DATABASE_URL -f /tmp/companies_local.sql
```

---

## Data Models

### Pipeline Config (`pipeline.yaml`)

```yaml
pipeline_version: "nov-13-2025-audio-only"
pipeline_type: "audio-only"
created_at: "2025-11-13T14:00:00Z"

config:
  batch_size: 100
  audio_bitrate: "128k"

  # R2 config (for rclone)
  r2:
    rclone_remote: "r2-markethawkeye"  # rclone remote name
    bucket: "markeyhawkeye"
    base_path: "nov-13-2025-audio-only"

  # Database config (for psql)
  database:
    local:
      host: "192.168.86.250"
      port: 54322
      user: "postgres"
      database: "postgres"
      schema: "markethawkeye"
    production:
      url: "${NEON_DATABASE_URL}"  # From environment
      schema: "markethawkeye"
    target: "local"  # Always update local first

  # Validation
  validation:
    skip_non_earnings: true
    confidence_threshold: "medium"

input:
  source_file: "video_ids_master.txt"
  total_videos: 8000

batches:
  total_batches: 80
  batch_directory: "batches/"
```

---

### Job YAML (`youtube/{job_id}/job.yaml`)

```yaml
job_id: dQw4w9WgXcQ_a3b9
youtube_id: dQw4w9WgXcQ
pipeline_version: "nov-13-2025-audio-only"
batch_id: "batch_001"

status: completed

company:
  name: "NVIDIA Corporation"
  ticker: "NVDA"
  slug: "nvidia"
  cik_str: "0001045810"

quarter: "Q3"
year: 2025

processing:
  download:
    status: completed
    file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/source.mp4"
    metadata_file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/metadata.json"

  transcribe:
    status: completed
    transcript_file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/transcript.json"

  insights:
    status: completed
    insights_file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/insights.json"
    raw_file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/insights.raw.json"
    is_earnings_call: true
    confidence: "high"

  validate:
    status: completed
    is_earnings_call: true

  fuzzy_match:
    status: completed
    matched_company: "NVIDIA CORP"

  extract_audio:
    status: completed
    audio_file: "/var/markethawk/youtube/dQw4w9WgXcQ_a3b9/audio.mp3"
    # Command used:
    command: "ffmpeg -i source.mp4 -vn -c:a libmp3lame -b:a 128k audio.mp3"

  upload_r2:
    status: completed
    # Command used:
    command: "rclone copy . r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ --include *.{mp3,json}"

  update_database:
    status: completed
    database_target: "local"
    # SQL executed:
    sql: "UPDATE markethawkeye.companies SET metadata = ... WHERE ticker = 'NVDA';"

r2:
  base_path: "nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9"
  audio_url: "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/audio.mp3"
```

---

## Workflows

### Workflow 1: Test Single Video

```bash
# Create test
echo "dQw4w9WgXcQ" > test_video.txt

python lens/batch_setup.py \
  --input test_video.txt \
  --version "test-run-1" \
  --batch-size 1

# Process (uses ffmpeg, rclone, psql directly)
python lens/batch_processor.py \
  --pipeline test-run-1 \
  --batch batch_001

# Verify R2 upload
rclone ls r2-markethawkeye:markeyhawkeye/test-run-1/dQw4w9WgXcQ_a3b9/

# Verify database update
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  SELECT ticker, metadata->'earnings_videos'->'test-run-1'
  FROM markethawkeye.companies
  WHERE ticker = 'NVDA';
"
```

---

### Workflow 2: Manual R2 Upload (if batch processor fails)

```bash
# Upload single job
cd /var/markethawk/youtube/dQw4w9WgXcQ_a3b9
rclone copy . r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ \
  --include "*.mp3" \
  --include "*.json" \
  --progress

# Upload entire batch (100 jobs)
cd /var/markethawk/youtube
for job_id in dQw4w9WgXcQ_a3b9 abc123xyz_k7m2 ...; do
  rclone copy "$job_id/" "r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/$job_id/" \
    --include "*.mp3" --include "*.json"
done
```

---

### Workflow 3: Manual Database Update (if batch processor fails)

```bash
# Update single company
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres <<SQL
UPDATE markethawkeye.companies
SET metadata = jsonb_set(
  metadata,
  '{earnings_videos,nov-13-2025-audio-only,Q3-2025}',
  '{
    "job_id": "dQw4w9WgXcQ_a3b9",
    "audio_url": "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/audio.mp3"
  }'::jsonb
)
WHERE ticker = 'NVDA';
SQL

# Verify
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  SELECT ticker, metadata->'earnings_videos'->'nov-13-2025-audio-only'->'Q3-2025'
  FROM markethawkeye.companies
  WHERE ticker = 'NVDA';
"
```

---

### Workflow 4: Sync Local → Production

```bash
# Dump local earnings_videos for specific pipeline
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres <<SQL > /tmp/earnings_export.sql
SELECT
  'UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, ''{earnings_videos,nov-13-2025-audio-only}'', ''' ||
  (metadata->'earnings_videos'->'nov-13-2025-audio-only')::text ||
  '''::jsonb) WHERE ticker = ''' || ticker || ''';'
FROM markethawkeye.companies
WHERE metadata->'earnings_videos' ? 'nov-13-2025-audio-only';
SQL

# Review
head /tmp/earnings_export.sql

# Apply to production
psql $NEON_DATABASE_URL -f /tmp/earnings_export.sql
```

---

## Components to Build

### Python Scripts (Minimal)

| Script | Purpose | What It Does | What It DOESN'T Do |
|--------|---------|--------------|---------------------|
| `batch_setup.py` | Create pipeline structure | Split videos into batches, create lightweight batch.yaml (job references only) | ❌ No job.yaml created upfront (lazy creation) |
| `batch_processor.py` | Process single batch | Orchestrate 8 steps, create job.yaml on-demand, call ffmpeg/rclone/psql | ❌ No custom R2/DB libraries |
| `batch_status.py` | View progress | Read YAML files, display stats | ❌ No database queries |
| `fuzzy_match.py` | Match company to DB | Query PostgreSQL, fuzzy string match | ❌ No updates |

**Lazy Creation:** `batch_setup.py` creates batch structure with lightweight job references. Individual `job.yaml` files are created on-demand during processing, avoiding 1000+ file creation upfront.

### What We DON'T Build

- ❌ `r2_upload.py` - Use `rclone` directly
- ❌ `db_update.py` - Use `psql` directly
- ❌ `db_sync.py` - Use `pg_dump` / `psql` directly

---

## rclone Examples

### Upload Files

```bash
# Single file
rclone copy /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/audio.mp3 \
  r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/

# Multiple files with filter
rclone copy /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/ \
  r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ \
  --include "*.{mp3,json}" \
  --progress

# Directory (all files)
rclone copy /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/ \
  r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ \
  --exclude "source.mp4"  # Don't upload original video
```

### List Files

```bash
# List all files in R2
rclone ls r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/

# Check if file exists
rclone ls r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/audio.mp3
```

### Sync (Copy only new/changed files)

```bash
# Sync local → R2 (faster than copy for re-runs)
rclone sync /var/markethawk/youtube/dQw4w9WgXcQ_a3b9/ \
  r2-markethawkeye:markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/ \
  --exclude "source.mp4" \
  --progress
```

---

## psql Examples

### Query Companies

```bash
# Find company by ticker
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  SELECT ticker, name, slug, metadata->'earnings_videos'
  FROM markethawkeye.companies
  WHERE ticker = 'NVDA';
"

# List all companies with earnings videos
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  SELECT ticker, name, metadata->'earnings_videos'->'nov-13-2025-audio-only'
  FROM markethawkeye.companies
  WHERE metadata->'earnings_videos' ? 'nov-13-2025-audio-only'
  ORDER BY ticker;
"
```

### Update Company

```bash
# Update single company
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres <<SQL
UPDATE markethawkeye.companies
SET metadata = jsonb_set(
  metadata,
  '{earnings_videos,nov-13-2025-audio-only,Q3-2025}',
  '{
    "job_id": "dQw4w9WgXcQ_a3b9",
    "youtube_id": "dQw4w9WgXcQ",
    "r2_base": "nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9",
    "audio_url": "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/markeyhawkeye/nov-13-2025-audio-only/dQw4w9WgXcQ_a3b9/audio.mp3",
    "duration_seconds": 3215,
    "published_at": "2025-11-13T15:08:30Z"
  }'::jsonb
)
WHERE ticker = 'NVDA'
RETURNING ticker, metadata->'earnings_videos'->'nov-13-2025-audio-only';
SQL
```

### Bulk Updates from File

```bash
# Generate SQL file from batch results
cat > /tmp/batch_001_updates.sql <<EOF
UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, '{earnings_videos,nov-13-2025-audio-only,Q3-2025}', '{"job_id":"dQw4w9WgXcQ_a3b9",...}'::jsonb) WHERE ticker = 'NVDA';
UPDATE markethawkeye.companies SET metadata = jsonb_set(metadata, '{earnings_videos,nov-13-2025-audio-only,Q4-2024}', '{"job_id":"abc123xyz_k7m2",...}'::jsonb) WHERE ticker = 'AAPL';
EOF

# Execute
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -f /tmp/batch_001_updates.sql
```

### Database Sync

```bash
# Export local data
pg_dump -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -t markethawkeye.companies \
  --data-only \
  --column-inserts \  # Safer for JSONB
  > /tmp/companies_local.sql

# Import to production (after backup!)
psql $NEON_DATABASE_URL < /tmp/companies_local.sql
```

---

## Testing Plan

### Phase 1: Single Video (Unix Commands)

```bash
# 1. Setup
echo "dQw4w9WgXcQ" > test_1.txt
python lens/batch_setup.py --input test_1.txt --version test-1 --batch-size 1

# 2. Process
python lens/batch_processor.py --pipeline test-1 --batch batch_001

# 3. Verify ffmpeg
ls -lh /var/markethawk/youtube/dQw4w9WgXcQ_*/audio.mp3

# 4. Verify rclone
rclone ls r2-markethawkeye:markeyhawkeye/test-1/

# 5. Verify psql
psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "
  SELECT ticker, metadata->'earnings_videos'->'test-1'
  FROM markethawkeye.companies
  WHERE ticker = 'NVDA';
"
```

---

## Success Metrics

### Functional Requirements

- [ ] ffmpeg extracts audio successfully
- [ ] rclone uploads to R2 (6 files per job)
- [ ] psql updates local database
- [ ] Can manually sync to production with pg_dump
- [ ] Validates earnings call vs non-earnings (95%+ accuracy)
- [ ] Logs co-located with batch files
- [ ] No custom database/R2 scripts needed

### Performance Requirements

- [ ] rclone upload: <30 seconds per job
- [ ] psql update: <1 second per company
- [ ] Database sync: <5 minutes for 1000 records

---

## Open Questions

1. **rclone performance:** Faster to upload per-job or batch upload?
   - **Test:** Compare single rclone call vs batch rclone script

2. **Database sync strategy:** pg_dump vs SELECT/INSERT?
   - **Recommendation:** pg_dump for full sync, UPDATE statements for incremental

3. **Failed uploads:** How to retry rclone failures?
   - **Use:** `rclone sync` (idempotent, only uploads missing files)

---

**End of PRD**

---

## Key Changes from v1

1. ✅ **Unix commands over scripts:** Use `ffmpeg`, `rclone`, `psql` directly
2. ✅ **No custom wrappers:** No `r2_upload.py`, no `db_update.py`, no `db_sync.py`
3. ✅ **Portable database:** Update local first, manual sync to production
4. ✅ **YouTube metadata context:** LLM uses title/description from RapidAPI
5. ✅ **Raw LLM output stored:** `insights.raw.json` with usage stats
6. ✅ **Co-located logs:** `batch_001/batch.log`
7. ✅ **Validation step:** Skip non-earnings videos
8. ✅ **Clear examples:** Actual rclone and psql commands provided
