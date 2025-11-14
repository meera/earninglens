# Pipeline Types

## Concept: Pipeline Type vs. Version

### Pipeline Type (What We're Building)
Different **types** of outputs/products from the same source material:

- `audio-only` - Extract audio, upload to R2 (current implementation)
- `video-full` - Full Remotion video with visual overlays
- `thumbnails` - Generate thumbnails only
- `shorts` - YouTube Shorts from highlights
- `transcript-only` - Transcription and insights only

**Think of it as:** Different recipes for the same ingredients.

### Version (How We Build It)
Iterations and improvements to the **same pipeline type**:

- `audio-only` v1.0 - Initial implementation
- `audio-only` v1.1 - Bug fixes, performance improvements
- `audio-only` v2.0 - Breaking changes, new features

**Think of it as:** Version numbers for the same recipe.

## Current Implementation

We use `pipeline_type` to distinguish different processing pipelines:

```yaml
# pipeline.yaml
batch_name: nov-13-2025-test
pipeline_type: audio-only    # What we're building
created_at: '2025-11-13T...'

# job.yaml
job_id: xw6oCFYNz8c_a328
batch_name: nov-13-2025-test
pipeline_type: audio-only    # What this job produces
```

## Supported Pipeline Types

### 1. audio-only (Current)
**Status:** ✅ Implemented
**Steps:**
1. Download YouTube video
2. Transcribe with WhisperX
3. Extract insights with GPT-4
4. Validate earnings call
5. Fuzzy match company
6. Extract audio (MP3)
7. Upload to R2
8. Update database

**Output:**
- `audio.mp3` uploaded to R2
- Record in `earnings_calls` table

**R2 Path:**
```
{company_slug}/{quarter}-{year}/{batch_name}-{job_id}/audio.mp3
```

### 2. video-full (Future)
**Status:** 🚧 Planned
**Steps:**
1-5. Same as audio-only
6. Render video with Remotion
7. Upload video to R2
8. Update database

**Output:**
- `video.mp4` with visual overlays
- Thumbnails
- Record in database

**R2 Path:**
```
{company_slug}/{quarter}-{year}/{batch_name}-{job_id}/
├── video.mp4
├── thumbnail.jpg
└── audio.mp3
```

### 3. thumbnails (Future)
**Status:** 🚧 Planned
**Steps:**
1-5. Same as audio-only
6. Generate thumbnails (4 variations)
7. Upload to R2
8. Update database

**Output:**
- 4 thumbnail variations
- Metadata about which performed best

### 4. shorts (Future)
**Status:** 🚧 Planned
**Steps:**
1-5. Same as audio-only
6. Extract highlights (60s segments)
7. Render shorts with Remotion
8. Upload to R2/YouTube
9. Update database

**Output:**
- Multiple 60s YouTube Shorts
- Optimized for vertical video

### 5. transcript-only (Future)
**Status:** 🚧 Planned
**Steps:**
1. Download YouTube video
2. Transcribe with WhisperX
3. Extract insights with GPT-4
4. Upload JSON to R2
5. Update database

**Output:**
- `transcript.json`
- `insights.json`
- No audio/video files

## Usage Examples

### Create Audio-Only Batch (Current)
```bash
python lens/batch_setup.py /var/markethawk/video_ids.txt nov-13-2025-batch1 --batch-size 100
# Uses default: --pipeline-type audio-only
```

### Create Video Batch (Future)
```bash
python lens/batch_setup.py /var/markethawk/video_ids.txt dec-2025-video --pipeline-type video-full --batch-size 50
```

### Create Shorts Batch (Future)
```bash
python lens/batch_setup.py /var/markethawk/video_ids.txt jan-2026-shorts --pipeline-type shorts --batch-size 100
```

## R2 Storage Structure

Files are organized by company and quarter, with batch_name + job_id for uniqueness:

```
markeyhawkeye/
└── nvidia/
    └── Q3-2025/
        ├── nov-13-2025-test-audio-xw6oCFYNz8c_a328/   # audio-only pipeline
        │   └── audio.mp3
        ├── dec-2025-video-xw6oCFYNz8c_b4f9/            # video-full pipeline
        │   ├── video.mp4
        │   ├── thumbnail.jpg
        │   └── audio.mp3
        └── jan-2026-shorts-xw6oCFYNz8c_c5g1/           # shorts pipeline
            ├── short_1.mp4
            ├── short_2.mp4
            └── short_3.mp4
```

**Benefits:**
- Same source video can be processed multiple times with different pipeline types
- Each pipeline type creates separate output
- Easy to query by company → quarter → pipeline type
- No overwrites (batch_name + job_id ensures uniqueness)

## Database Metadata

The `pipeline_type` is stored in database metadata:

```sql
SELECT
  symbol,
  quarter,
  year,
  metadata->>'pipeline_type' as pipeline_type,
  metadata->>'batch_name' as batch_name
FROM markethawkeye.earnings_calls
ORDER BY created_at DESC;
```

**Example output:**
```
symbol | quarter | year | pipeline_type | batch_name
-------|---------|------|---------------|------------------
NVDA   | Q3      | 2025 | audio-only    | nov-13-2025-test
AAPL   | Q4      | 2024 | video-full    | dec-2025-video
TSLA   | Q1      | 2025 | shorts        | jan-2026-shorts
```

## Future: Pipeline Versioning

When we need versioning (e.g., breaking changes to audio-only pipeline):

```yaml
# Option 1: Separate pipeline_type
pipeline_type: audio-only-v2

# Option 2: Add version field
pipeline_type: audio-only
version: 2.0

# Option 3: Include in batch_name
batch_name: nov-13-2025-test-v2
pipeline_type: audio-only
```

**Recommendation:** Start simple with pipeline_type only. Add versioning when needed.

## Summary

**Use `pipeline_type` for:**
- Different outputs/products (audio vs video vs shorts)
- Different processing workflows
- Different use cases

**Don't confuse with:**
- Software versions (1.0, 2.0) - that's for code releases
- Batch names - that's the unique identifier for a batch run
- Job IDs - that's the unique identifier for a single video

**Current default:** `audio-only` (extracts audio only, uploads to R2)
