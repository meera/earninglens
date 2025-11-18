# R2 Storage and Render Output Conventions

**Final decisions on R2 bucket strategy and render output naming**

---

## R2 Bucket Strategy

### Decision: Separate Dev and Production Buckets

**Dev Environment (`DEV_MODE=true`):**
- Upload to: `dev-markethawkeye`
- Store URLs as: `r2://dev-markethawkeye/...`
- Dev database has working URLs that point to dev bucket

**Production Environment (`DEV_MODE=false`):**
- Upload to: `markeyhawkeye`
- Store URLs as: `r2://markeyhawkeye/...`
- Production database has working URLs that point to production bucket

### Rationale

**Why separate buckets:**
1. **Active development safety** - Test/experiment without polluting production
2. **Working dev environment** - Dev frontend can play videos/view transcripts
3. **Clear migration state** - Bucket name in URL tells you if record was migrated
4. **No broken references** - URLs always point to actual file location

**Why honest URLs (not lying):**
- ❌ Rejected: Upload to dev bucket but store `r2://markeyhawkeye/...` URLs
- Problem: Dev database URLs would be broken (point to non-existent files)
- Dev environment wouldn't work for testing

### Migration Path

When promoting from dev to production:

```bash
# Set production mode
export DEV_MODE=false

# Step 1: Upload artifacts to production bucket
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step upload_artifacts --force

# Step 2: Upload media to production bucket
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step upload_r2 --force

# Step 3: Insert into production database
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step update_database --force
```

**What happens:**
- Files copied from `dev-markethawkeye` to `markeyhawkeye`
- Database record created with `r2://markeyhawkeye/...` URLs
- Production frontend can access files

### When to Switch to Single Bucket

Consider using `markeyhawkeye` only when:
- Pipeline is 100% stable (no more experiments)
- Processing at production scale (1000s of companies)
- Every run is a "production" run
- No need for test-then-promote workflow

---

## Render Output Filename

### Decision: Always use `rendered.mp4`

**Convention:**
```
{job_dir}/renders/rendered.mp4  ← Always this filename
```

**Regardless of render method:**
- FFmpeg render → `rendered.mp4`
- Remotion render → `rendered.mp4`
- Future render methods → `rendered.mp4`

### Rationale

**Why single filename:**
1. **Predictable URLs** - Always know the filename: `{job_id}/renders/rendered.mp4`
2. **Method traceable via job** - Job ID and workflow name tell you render method
   - `job_youtube-ffmpeg_b6v4` → FFmpeg render
   - `job_remotion_abc123` → Remotion render
3. **Database simplicity** - No need to track which render created which filename
4. **Frontend simplicity** - Always fetch `{job_id}/rendered.mp4`
5. **Swap renderers easily** - Change pipeline, output location unchanged

**Why NOT method-specific filenames:**
- ❌ `ffmpeg_render.mp4`, `remotion_render.mp4` add complexity
- Job directory already has complete audit trail in `job.yaml`:
  ```yaml
  workflow: youtube-ffmpeg
  processing:
    render:
      status: completed
      renderer: ffmpeg
      output_file: /var/markethawk/jobs/.../renders/rendered.mp4
  ```

### Traceability

**How to identify render method:**

```bash
# By job ID pattern
ls /var/markethawk/jobs/job_youtube-ffmpeg_*/renders/rendered.mp4  # FFmpeg renders
ls /var/markethawk/jobs/job_remotion_*/renders/rendered.mp4        # Remotion renders

# By job.yaml
cat /var/markethawk/jobs/job_youtube-ffmpeg_b6v4/job.yaml
# Shows: workflow: youtube-ffmpeg, renderer: ffmpeg

# By database
SELECT id, metadata->>'workflow' FROM earnings_calls WHERE symbol = 'PLBY';
# Shows which workflow/renderer was used
```

**A/B testing different renderers:**
- Use different job IDs, not different filenames
- Compare: `job_ffmpeg_test1/rendered.mp4` vs `job_remotion_test1/rendered.mp4`

---

## Implementation

### Upload Scripts

**`lens/steps/upload_media_r2.py`:**
```python
# Uses environment-based bucket selection
from env_loader import get_r2_bucket_name

R2_BUCKET = get_r2_bucket_name()  # dev-markethawkeye or markeyhawkeye

# Uploads from: {job_dir}/renders/rendered.mp4
# Stores URL: r2://{R2_BUCKET}/{company}/{year}/{quarter}/{job_id}/rendered.mp4
```

**`lens/steps/ffmpeg_audio_intact_with_banner.py`:**
```python
# Always outputs to same filename
output_video = renders_dir / "rendered.mp4"  # NOT ffmpeg_render.mp4
```

### Environment Configuration

**`.env` (Dev):**
```bash
DATABASE_URL=postgresql://postgres:postgres@192.168.86.250:54322/markethawk
R2_BUCKET_NAME=dev-markethawkeye
```

**`.env.production` (Production):**
```bash
DATABASE_URL=postgresql://neondb_owner:...@ep-twilight-leaf-a4dgbd70.us-east-1.aws.neon.tech/neondb
R2_BUCKET_NAME=markeyhawkeye
```

**`lens/env_loader.py`:**
```python
def load_environment():
    # Load .env (common + dev)
    load_dotenv('.env')

    # If production mode, override with .env.production
    if not DEV_MODE:
        load_dotenv('.env.production', override=True)
```

---

## Database Schema

### R2 URLs in Database

**Dev database record:**
```json
{
  "id": "PLBY-Q3-2025-b6v4",
  "media_url": "r2://dev-markethawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/rendered.mp4",
  "transcripts": {
    "transcript_url": "r2://dev-markethawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/transcripts/transcript.json",
    "paragraphs_url": "r2://dev-markethawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/transcripts/transcript.paragraphs.json"
  }
}
```

**Production database record (after migration):**
```json
{
  "id": "PLBY-Q3-2025-b6v4",
  "media_url": "r2://markeyhawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/rendered.mp4",
  "transcripts": {
    "transcript_url": "r2://markeyhawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/transcripts/transcript.json",
    "paragraphs_url": "r2://markeyhawkeye/playboy-incorporated/2025/Q3/job_youtube-ffmpeg_b6v4/transcripts/transcript.paragraphs.json"
  }
}
```

**Note:** Bucket name in URL matches actual file location (no lying URLs)

---

## Alternatives Considered and Rejected

### ❌ Single Bucket (markeyhawkeye only)
- **Why rejected:** Production pollution during active development
- **When to reconsider:** Pipeline is stable and at production scale

### ❌ Lying URLs (dev bucket, prod URLs)
```
Upload to: dev-markethawkeye
Store as: r2://markeyhawkeye/...
```
- **Why rejected:** Breaks dev environment (URLs point to non-existent files)
- **No benefit:** Still need to copy files for migration

### ❌ Method-Specific Filenames
```
ffmpeg_render.mp4
remotion_render.mp4
```
- **Why rejected:** Job ID/workflow already provides traceability
- **Adds complexity:** Database and frontend need to track which filename

---

**Last Updated:** 2025-01-17
**Status:** Final - Implemented in production pipeline
