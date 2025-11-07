# Smart Thumbnail Generator

Intelligently generates YouTube thumbnails based on video content type.

## Features

### 🎬 For Videos with Video Stream
- **Extracts 4 frames** from strategic locations (15%, 35%, 55%, 75% of duration)
- Avoids very start/end (often static screens or silence)
- Provides multiple options to choose the best frame

### 🎙️ For Audio-Only Content
- **Creates eye-catching custom thumbnail** with:
  - **Large, dashing company name** (bold, prominent)
  - **Stock chart** showing up/down movement with arrow (↑/↓)
  - **Quarter & year** in highlighted yellow box
  - **CEO image** (optional, if available)
  - **Professional gradient design** optimized for click-through

## Usage

### Basic Usage

```bash
# Activate Python environment
source .venv/bin/activate

# Run smart thumbnail generator
python lens/smart_thumbnail_generator.py <video_file> <data_json> <output_dir>
```

### Example: Video with Video Stream

```bash
# Extract frames from video
python lens/smart_thumbnail_generator.py \
  /var/earninglens/_downloads/jUnV3LiN0_k/source.trimmed.mp4 \
  studio/data/AAPL-Q4-2024.json \
  /tmp/thumbnails/

# Output:
# 📹 Video stream detected - Extracting frames...
# ✓ Extracted frame at 180.0s → /tmp/thumbnails/frame_1_at_180s.jpg
# ✓ Extracted frame at 420.0s → /tmp/thumbnails/frame_2_at_420s.jpg
# ✓ Extracted frame at 660.0s → /tmp/thumbnails/frame_3_at_660s.jpg
# ✓ Extracted frame at 900.0s → /tmp/thumbnails/frame_4_at_900s.jpg
# ✅ Extracted 4 frames for thumbnail selection
```

### Example: Audio-Only Content

```bash
# Create custom thumbnail
python lens/smart_thumbnail_generator.py \
  /var/earninglens/PLTR/Q3-2025/audio.m4a \
  studio/data/PLTR-Q3-2025.json \
  /tmp/thumbnails/

# Output:
# 🎙️ Audio-only detected - Creating custom thumbnail...
# ✅ Eye-catching thumbnail created: /tmp/thumbnails/custom_thumbnail.jpg
```

## Input Data Format

The data JSON file should contain:

```json
{
  "company": "Apple Inc.",
  "ticker": "AAPL",
  "quarter": "Q4",
  "fiscal_year": 2024,
  "call_date": "2024-11-01",
  "stock_change_percent": 5.2,
  "ceo_name": "Tim Cook"  // Optional
}
```

**Required Fields:**
- `company` - Company name (displayed large)
- `ticker` - Stock ticker symbol
- `quarter` - Fiscal quarter (Q1, Q2, Q3, Q4)
- `fiscal_year` - Fiscal year (number)

**Optional Fields:**
- `stock_change_percent` - Stock price change % (for chart direction)
  - Positive → Green chart with ↑
  - Negative → Red chart with ↓
  - Default: 0.0 (flat)
- `ceo_name` - CEO name (for image search, not yet implemented)
- `call_date` - Call date (for text display)

## Output

### For Videos with Video Stream

Creates 4 frame images:
```
output_dir/
├── frame_1_at_180s.jpg   # Frame at 15% of video
├── frame_2_at_420s.jpg   # Frame at 35% of video
├── frame_3_at_660s.jpg   # Frame at 55% of video
└── frame_4_at_900s.jpg   # Frame at 75% of video
```

**Next step:** Manually review frames and select the best one for YouTube thumbnail.

### For Audio-Only Content

Creates 1 custom thumbnail:
```
output_dir/
└── custom_thumbnail.jpg   # 1280x720, ready for YouTube
```

**Ready to upload** to YouTube immediately!

## Integration with Video Pipeline

### Option 1: Standalone Usage

```bash
# Step 1: Process video (transcribe, insights)
python lens/process_video.py uploads/video.mp4 medium gpt-4o-mini

# Step 2: Generate smart thumbnail
python lens/smart_thumbnail_generator.py \
  uploads/video.mp4 \
  studio/data/AAPL-Q4-2024.json \
  uploads/thumbnails/

# Step 3: Upload to YouTube (with thumbnail)
# ... (use best frame or custom thumbnail)
```

### Option 2: Integrated Pipeline

Modify `lens/process_video.py` to call smart thumbnail generator:

```python
# At end of process_video.py

from smart_thumbnail_generator import generate_smart_thumbnail

# Generate thumbnail
thumbnail_result = generate_smart_thumbnail(
    video_path=filepath,
    data=video_data,
    output_dir=os.path.join(output_dir, 'thumbnails')
)

if thumbnail_result['success']:
    if thumbnail_result['has_video_stream']:
        print(f"✅ Extracted {len(thumbnail_result['extracted_frames'])} frames")
        # Use first frame or let user choose
        thumbnail_path = thumbnail_result['extracted_frames'][0]
    else:
        print(f"✅ Custom thumbnail created")
        thumbnail_path = thumbnail_result['custom_thumbnail']

    # Save thumbnail path to metadata
    with open(metadata_path, 'w') as f:
        json.dump({
            ...metadata,
            'thumbnail_path': thumbnail_path
        }, f, indent=2)
```

## Design Choices

### Why 4 Frames at Specific Positions?

- **15%** - After intro/titles, actual content started
- **35%** - Early-mid section, often key speakers visible
- **55%** - Mid-section, peak engagement moments
- **75%** - Late section, Q&A or key insights

Avoids:
- **0-10%** - Static intro screens, logos, silence
- **90-100%** - End cards, credits, outro

### Why Eye-Catching Design for Audio-Only?

Audio-only earnings calls need thumbnails that:
- ✅ **Grab attention** in YouTube search/recommendations
- ✅ **Convey key info** at a glance (company, quarter, performance)
- ✅ **Stand out** from competitors' plain thumbnails
- ✅ **Build brand** (EarningLens badge)

**Design elements:**
- Large, bold company name (readable in small preview)
- Color-coded chart (green/red instantly signals performance)
- Yellow highlight box (draws eye to quarter/year)
- Professional gradient (not amateur PowerPoint look)

## Customization

### Change Frame Extraction Positions

Edit `smart_thumbnail_generator.py`:

```python
# Line ~140
positions = [0.15, 0.35, 0.55, 0.75][:num_frames]

# Change to:
positions = [0.10, 0.30, 0.50, 0.70][:num_frames]  # Extract earlier
```

### Change Thumbnail Colors

Edit `create_eye_catching_thumbnail()`:

```python
# Line ~400 - Stock chart colors
is_positive = change_percent >= 0
color = (34, 197, 94) if is_positive else (239, 68, 68)  # Green or Red

# Change to custom colors:
color = (0, 150, 255) if is_positive else (255, 100, 0)  # Blue or Orange
```

### Add CEO Image Search

The script has a placeholder for CEO image search. To implement:

```python
def search_ceo_image(company_name: str, ceo_name: str = None) -> str:
    """Search for CEO image using Google Custom Search API"""

    import requests

    api_key = os.getenv('GOOGLE_CUSTOM_SEARCH_API_KEY')
    search_engine_id = os.getenv('GOOGLE_CUSTOM_SEARCH_ENGINE_ID')

    query = f"{ceo_name} CEO {company_name}" if ceo_name else f"{company_name} CEO"

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': search_engine_id,
        'q': query,
        'searchType': 'image',
        'num': 1
    }

    response = requests.get(url, params=params)
    results = response.json()

    if 'items' in results and len(results['items']) > 0:
        return results['items'][0]['link']

    return None
```

## Dependencies

- **ffmpeg** - Frame extraction from video
- **ffprobe** - Video stream detection
- **Pillow** (PIL) - Image manipulation
- **requests** - Image downloading (optional)

Install:

```bash
# System dependencies (Ubuntu/Debian)
sudo apt-get install ffmpeg

# Python dependencies
pip install Pillow>=10.0.0 requests
```

## Troubleshooting

### "ffprobe: command not found"

Install ffmpeg:
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### "No frames extracted"

Check video file:
```bash
ffprobe -v error -show_streams uploads/video.mp4
```

Ensure video has `codec_type=video` stream.

### "Custom thumbnail looks wrong"

Check data JSON:
```bash
cat studio/data/AAPL-Q4-2024.json
```

Ensure required fields are present and correct.

### Font Rendering Issues

Install DejaVu fonts:
```bash
sudo apt-get install fonts-dejavu-core
```

## Future Enhancements

- [ ] **AI-powered frame selection** - Use CLIP or similar model to choose best frame
- [ ] **CEO image auto-search** - Google Custom Search API integration
- [ ] **Real stock chart data** - Fetch from Yahoo Finance API
- [ ] **Multiple thumbnail variants** - A/B testing support
- [ ] **Video preview GIF** - Animated thumbnail for social media

## Examples

### Example 1: Apple Q4 2024 (Video)

```bash
python lens/smart_thumbnail_generator.py \
  /var/earninglens/AAPL/2024-Q4/take1.mp4 \
  studio/data/AAPL-Q4-2024.json \
  /var/earninglens/AAPL/2024-Q4/thumbnails/

# Output: 4 frames extracted
# Choose frame_2 (shows Tim Cook speaking)
# Upload to YouTube as thumbnail
```

### Example 2: Palantir Q3 2025 (Audio)

```bash
python lens/smart_thumbnail_generator.py \
  /var/earninglens/PLTR/Q3-2025/audio.m4a \
  studio/data/PLTR-Q3-2025.json \
  /var/earninglens/PLTR/Q3-2025/thumbnails/

# Output: custom_thumbnail.jpg
# Shows: Large "PALANTIR" text + green ↑ chart + Q3 2025
# Ready to upload!
```

## License

Part of EarningLens project.
