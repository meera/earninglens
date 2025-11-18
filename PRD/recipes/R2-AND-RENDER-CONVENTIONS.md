# R2 Storage and Render Output Conventions

---

## Render Output Filename (CRITICAL)

**Convention:** Always output to `rendered.mp4`

```
{job_dir}/renders/rendered.mp4  ← All render methods use this
```

**Why:**
- Predictable R2 URLs: `r2://{bucket}/{company}/{year}/{quarter}/{job_id}/rendered.mp4`
- Traceability via job ID: `job_youtube-ffmpeg_*` = FFmpeg, `job_remotion_*` = Remotion
- Database/frontend simplicity: Always fetch `{job_id}/rendered.mp4`

**Implementation:**
```python
# lens/steps/ffmpeg_audio_intact_with_banner.py
output_video = renders_dir / "rendered.mp4"  # NOT ffmpeg_render.mp4
```

---

## R2 Bucket Strategy

**Dev (`DEV_MODE=true`):**
- Upload to `dev-markethawkeye`
- Store URLs as `r2://dev-markethawkeye/...`

**Prod (`DEV_MODE=false`):**
- Upload to `markeyhawkeye`
- Store URLs as `r2://markeyhawkeye/...`

**Why separate buckets:**
- Safe testing without polluting production
- Dev environment works (URLs point to actual files)
- Clear migration state (bucket name tells you environment)

**Migration:**
```bash
export DEV_MODE=false
python lens/workflow.py job.yaml --step upload_artifacts --force
python lens/workflow.py job.yaml --step upload_r2 --force
python lens/workflow.py job.yaml --step update_database --force
```

**Environment config:**
- `.env`: `R2_BUCKET_NAME=dev-markethawkeye`
- `.env.production`: `R2_BUCKET_NAME=markeyhawkeye`

---

## Rejected Alternatives

**❌ Single bucket:** Production pollution during development
**❌ Lying URLs:** Breaks dev environment (URLs point to wrong bucket)
**❌ Method-specific filenames:** Unnecessary complexity

---

**Last Updated:** 2025-01-17
