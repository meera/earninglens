# EarningsHawk TODO

## High Priority

### Thumbnail Validation Agent
**Need**: Automated thumbnail validation to ensure quality before upload
**Requirements**:
- Check text readability (sufficient contrast with background)
- Verify EarningsHawk branding is visible
- Verify company branding (logo/colors) is prominent
- Ensure thumbnail is visually attractive and engaging
- Flag thumbnails that don't meet quality standards

**Implementation Ideas**:
- Use image analysis (PIL/OpenCV) to check contrast ratios
- OCR to verify text is readable
- Brand color detection (check for company brand colors)
- Visual quality metrics (sharpness, composition)

**Priority**: High (quality control for YouTube thumbnails)

---

## Critical Issues

### 1. Context Length Exceeded for Insights Extraction
**Error**: Transcript is 522k tokens, but OpenAI model limit is 128k tokens
**File**: `lens/extract_insights.py`
**Impact**: Cannot extract insights from full transcript

**Solutions to explore**:
1. **Chunk the transcript** - Process in smaller segments
2. **Use longer context model** - GPT-4 Turbo 128k or Claude 200k
3. **Summarize first** - Create summary, then extract insights
4. **Extract incrementally** - Process sections (revenue, EPS, guidance separately)

Make sure transcript.paragraphs.json is used to send to LLM.
**Priority**: Medium (MVP works without insights)

---

## MVP Completed
- [x] Download video
- [x] Parse metadata
- [x] Remove silence
- [x] Transcribe with Whisper
- [x] Create PLTR Q3 2025 composition
- [x] Audio playback in Remotion Studio
- [x] Simple banner overlay (next)
- [ ] Upload to YouTube

---

## Future Enhancements
- [ ] Fix SimpleBanner to use TailwindCSS instead of inline styles (currently using inline styles as workaround)
- [ ] Update all render commands to work from root directory (currently requires cd studio/)
- [ ] Fix rendering to work with symbolic links in public/audio/ (currently fails with 404 on Mac, may work on sushi)
- [ ] Fix context length issue for insights
- [ ] Add transcript subtitles overlay
- [ ] Add charts and visualizations
- [ ] Add speaker identification
- [ ] Add key quote highlights
- [ ] Generate thumbnail
