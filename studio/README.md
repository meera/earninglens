# Studio - EarningLens Video Production

Video generation using Remotion for earnings call videos.

**Studio Port:** http://localhost:8082

## Quick Start

### Install Dependencies
```bash
npm install
```

### Preview Video (Development)
```bash
npm start
```

This opens Remotion Studio at **http://localhost:8082** where you can preview and edit video compositions.

### Render First Video (Apple Q4 2024)
```bash
npm run render:aapl
```

This will:
- Read data from `data/AAPL-Q4-2024.json`
- Render video to `out/AAPL-Q4-2024.mp4`
- Duration: ~50 seconds
- Resolution: 1920x1080 (1080p)
- FPS: 30
- Codec: H.264

### Render Custom Video
```bash
npm run render -- --props='@./data/YOUR-DATA.json'
```

## Directory Structure

```
studio/
├── src/
│   ├── compositions/
│   │   └── EarningsVideo/
│   │       ├── index.tsx          # Main video composition
│   │       └── style.css          # Tailwind styles
│   ├── components/                # Reusable components (future)
│   └── index.ts                   # Remotion entry point
├── data/
│   └── AAPL-Q4-2024.json         # Apple Q4 2024 earnings data
├── out/                           # Rendered videos output here
├── public/
│   └── logos/                     # Company logos
├── package.json
├── remotion.config.ts             # Remotion configuration
├── tsconfig.json
└── tailwind.config.js
```

## Data Format

Each earnings video requires a JSON file with this structure:

```json
{
  "company": "Apple Inc.",
  "ticker": "AAPL",
  "quarter": "Q4",
  "fiscal_year": 2024,
  "call_date": "2024-11-01",
  "financials": {
    "revenue": {
      "current": 94928000000,
      "previous": 89498000000,
      "yoy_growth": 6.1
    },
    "eps": {
      "current": 1.64,
      "estimate": 1.60,
      "beat_miss": "beat"
    },
    "segments": [
      {"name": "iPhone", "revenue": 46220000000},
      {"name": "Services", "revenue": 24973000000}
    ],
    "margins": {
      "gross": 46.2,
      "operating": 30.7,
      "net": 23.9
    }
  },
  "highlights": [
    "Revenue up 6% to $94.9B",
    "iPhone revenue grew 6% to $46.2B"
  ]
}
```

## Video Composition

The EarningsVideo composition consists of 5 sequences:

1. **Title Card** (0-5s)
   - Company name, ticker, quarter/year
   - Animated entrance

2. **Revenue Card** (5-13s)
   - Current revenue
   - YoY growth comparison
   - Animated numbers

3. **EPS Card** (13-21s)
   - Earnings per share
   - Beat/miss vs. estimates
   - Visual indicator

4. **Segments** (21-35s)
   - Revenue breakdown by product/service
   - Animated bar charts

5. **Highlights** (35-50s)
   - Key takeaways from earnings call
   - Bullet points with animations

## GPU Rendering

This project is configured to use GPU acceleration (user has GPU machine):

```typescript
// remotion.config.ts
Config.setChromiumOpenGlRenderer('angle');
```

**Performance:**
- Typical render time: 2-5 minutes for 50-second video
- Requires: NVIDIA GPU (CUDA support)
- Check GPU: `nvidia-smi`

## Uploading to R2

After rendering, upload to Cloudflare R2:

```bash
# Create directory structure in R2
rclone mkdir r2-public:earninglens/AAPL
rclone mkdir r2-public:earninglens/AAPL/videos

# Upload video
rclone copy out/AAPL-Q4-2024.mp4 \
  r2-public:earninglens/AAPL/videos/2024-Q4-full.mp4 -P

# Verify
rclone ls r2-public:earninglens/AAPL/videos/
```

## Next Steps

1. **Generate First Video**
   ```bash
   npm run render:aapl
   ```

2. **Upload to R2**
   ```bash
   rclone copy out/AAPL-Q4-2024.mp4 r2-public:earninglens/AAPL/videos/ -P
   ```

3. **Upload to YouTube**
   - Manual upload via YouTube Studio
   - Or use YouTube API (future automation)

4. **Create More Data Files**
   - Copy `AAPL-Q4-2024.json` as template
   - Fill in data for other companies (MSFT, GOOGL, etc.)

## Troubleshooting

### Render Fails
- Check GPU availability: `nvidia-smi`
- Verify JSON data is valid
- Try simpler test render: `npm start` then preview

### Video Quality Issues
- Increase bitrate in `remotion.config.ts`
- Change codec settings
- Adjust resolution

### Slow Rendering
- Verify GPU acceleration is enabled
- Close other GPU-intensive apps
- Consider rendering during off-hours
