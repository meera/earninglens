# CLAUDE.md

Guidance for Claude Code when working with MarketHawk repository.

---

## Project: Markey HawkEye

**Website:** [markethawkeye.com](https://markethawkeye.com)

### Overview
Markey HawkEye transforms earnings call audio into visually-enhanced YouTube videos with an interactive SaaS web platform. The monetization is important goal. Monetization will be in three ways - 
1.Sell subscription to Sass
2. YouTube Monetization
3. Get companies to place orders to generate their videos.  

**Core Value:**
- Fantastic visually appealing videos from boring earnings calls
- Automated pipeline at scale (1000+ companies, every quarter)
- Speed to market (full video within hours)

**We compete on presentation and automation, not on data.**

---

## ⚠️ GOVERNING PRINCIPLES (CRITICAL)

### Audio is Sacred
- Use ACTUAL earnings call audio (30-60 minutes, unaltered)
- NEVER synthesize, paraphrase, or alter what was said
- Three pillars of truth: **Original audio + SEC filings + Initial prompt**

### Trust & Integrity
- **NEVER make up data**
- **NEVER infer or guess numbers**
- Carefully vet all data sources
- If uncertain, don't show it

### Approved Data Sources (Trust Hierarchy)

**Tier 1 (Always Trust):**
- Earnings call audio (company IR or YouTube official)
- SEC filings (10-K, 10-Q, 8-K)
- Company investor relations websites

**Tier 2 (Verify First):**
- Bloomberg, Reuters, WSJ
- Yahoo Finance, Google Finance
- Seeking Alpha transcripts (verify against audio)

**Never Use:**
- Unverified sources
- AI-generated summaries (unless from official source)
- Forums, message boards

---

## Technology Stack

### Frontend
- Next.js 14+ (App Router), TypeScript (strict mode)
- TailwindCSS, shadcn/ui
- React Context / Zustand

### Backend
- **Database:** PostgreSQL with Drizzle ORM (avoid Neon-specific packages)
  - **Local:** PostgreSQL at 192.168.86.250:54322
  - **Production:** Neon (ep-twilight-leaf-a4dgbd70)
- **Authentication:** Better Auth with Google One Tap
- **Payments:** Stripe (via Better Auth plugin)
- **Storage:** Cloudflare R2 (bucket: `earninglens`)


### Mono Repo Project Structure ### 

```
markethawk/
├─ package.json          # Root monorepo, defines workspaces
├─ node_modules/         # Hoisted dependencies & binaries
├─ web/                  # Next.js frontend
│  ├─ package.json
│  ├─ .env               # Environment variables
│  └─ drizzle.config.ts
├─ studio/               # Studio/processing package
│  └─ package.json
```

**Key Points:**

* Dependencies are **hoisted to root `node_modules`**; do not create local `node_modules` in packages.
* Binaries (e.g., `drizzle-kit`) live in `root/node_modules/.bin` but are accessible in package scripts.
* `.env` files are **package-specific**, loaded automatically by scripts in that package.

**Web package.json scripts:**

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

**How to execute DB scripts:**

```bash
# Install dependencies in the monorepo root
cd /Users/Meera/markethawk
npm install

# Navigate to the workspace
cd web

# Run migrations
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

**Notes:**

* Scripts automatically resolve `drizzle-kit` from hoisted `.bin`.
* Avoid local `node_modules` in packages to prevent broken binaries.
* Keep `.env` per package; do not commit secrets.

### Database Schema (Companies)

**Source:** SEC company_tickers.json (authoritative source for company names and CIK)
**Enrichment:** NASDAQ Screener CSV for financial data (market cap, sector, industry)

**Schema Design:**
```sql
CREATE TABLE markethawkeye.companies (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,       -- Stock ticker (e.g., NVDA)
  name VARCHAR(255) NOT NULL,               -- Company name (e.g., NVIDIA CORP)
  cik_str VARCHAR(20) UNIQUE NOT NULL,      -- SEC Central Index Key (for filings)
  slug VARCHAR(255) UNIQUE NOT NULL,        -- URL-friendly (e.g., nvidia, alphabet-goog)
  metadata JSONB DEFAULT '{}',              -- Flexible metadata (see below)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_companies_cik ON markethawkeye.companies(cik_str);
CREATE UNIQUE INDEX idx_companies_slug ON markethawkeye.companies(slug);
CREATE INDEX idx_companies_metadata ON markethawkeye.companies USING GIN (metadata);
CREATE INDEX idx_companies_name_trgm ON markethawkeye.companies USING GIN (name gin_trgm_ops);
```

**JSONB Metadata Fields:**
```json
{
  "exchange": "NASDAQ",
  "market_cap": 4693788000000,
  "sector": "Technology",
  "industry": "Semiconductors",
  "ipo_year": 1999,
  "country": "United States",
  "website": "https://nvidia.com",
  "description": "GPU manufacturer..."
}
```

**Why JSONB?** Flexible schema for future enrichment without migrations.

**Data Sources:**
- **SEC company_tickers.json** (10,142 companies) - Clean names, CIK numbers
- **NASDAQ Screener CSV** - Financial enrichment (market cap, sector)

**Filtering Applied:**
- Removed 1,566 derivative securities (warrants, units, preferred shares)
- Deduplicated by CIK (one company per CIK): -1,204 duplicates
- Final: 7,372 unique companies

**Slug Generation:**
- Base: `nvidia` from "NVIDIA CORP"
- Conflicts: Append ticker suffix (e.g., `alphabet-goog`, `alphabet-googl`)
- Only 10 companies needed ticker suffix

**Master CSV:** `data/companies_master.csv` (committed to Git)

**Database Seeding:**
```bash
# 1. Download SEC data
python lens/scripts/download_sec_companies.py

# 2. Download NASDAQ screener
# Visit: https://www.nasdaq.com/market-activity/stocks/screener
# Download CSV to data/nasdaq_screener.csv

# 3. Merge and generate slugs
python lens/scripts/create_master_companies.py

# 4. Migrate database (local or production)
python lens/scripts/migrate_companies_db.py

# Production migration
bash migrate-companies-neon.sh
```

**TypeScript Interface:**
```typescript
export interface Company {
  id: number;
  cik_str: string;
  symbol: string;
  name: string;
  slug: string;
  metadata: {
    exchange?: string;
    market_cap?: number;
    sector?: string;
    industry?: string;
    ipo_year?: number;
    country?: string;
    website?: string;
    description?: string;
    [key: string]: any;  // Flexible for future additions
  };
  created_at: Date;
  updated_at: Date;
}
```

**Querying JSONB in Drizzle:**
```typescript
// Filter by sector
const result = await db.execute(sql`
  SELECT * FROM markethawkeye.companies
  WHERE metadata->>'sector' = ${sector}
  ORDER BY (metadata->>'market_cap')::bigint DESC NULLS LAST
`);

// Access in TypeScript
company.metadata.market_cap
company.metadata.sector
```

**URL Structure:**
- Old: `/stocks/${ticker}` (e.g., `/stocks/nvda`)
- New: `/companies/${slug}` (e.g., `/companies/nvidia`)
- SEO-friendly, human-readable URLs

### Video Pipeline
- **Transcription:** WhisperX 3.3.1 (speaker diarization  )
- **Insights:** OpenAI GPT-4o with structured outputs 
- **Rendering:** Remotion 4.0+ (H.264 MP4, 1080p, 30fps)
- **GPU:** Primary rendering on sushi (Linux), fallback to Remotion Lambda

### APIs
- YouTube Data API v3 (upload, analytics, metadata)
- Rapid API (YouTube download, audio extraction)

---

## Development Machines

**Two-machine setup:**

1. **Sushi (Linux GPU)** - Heavy processing
   - GPU-accelerated transcription (WhisperX)
   - GPU-accelerated rendering (Remotion)
   - Fast processing (20-30 min per video)

2. **Mac Laptop** - Development & editing
   - Composition editing (React/TypeScript)
   - Remotion Studio preview
   - Git commits, YouTube uploads

**Shared Directory:** `/var/markethawk/` (accessible from both machines)
- On sushi: `/var/markethawk/`
- On Mac: `/var/markethawk/`

**Key Principle:**
- Video files, transcripts, audio → `/var/markethawk/` (shared, NOT in git)
- Code, compositions, components → `~/markethawk/` (git repo, committed)

---

## Project Structure

```
markethawk/
├── lens/                          # Python video processing pipeline
│   ├── job.py                     # Job manager (create, list, process)
│   ├── job.yaml.template          # Job configuration template
│   ├── process_job_pipeline.py   # Pipeline orchestrator
│   ├── transcribe_whisperx.py    # WhisperX transcription
│   ├── extract_insights_structured.py  # OpenAI insights
│   └── scripts/
│       ├── download_source.py     # YouTube downloader
│       ├── download_hls.py        # HLS stream downloader
│       └── upload_youtube.py      # YouTube uploader
│
├── studio/                        # Remotion video compositions
│   ├── src/
│   │   ├── compositions/          # Video templates (BIP_Q3_2025.tsx, etc.)
│   │   ├── components/            # Reusable components
│   │   ├── themes/                # Company brand themes
│   │   └── Root.tsx               # Composition registry
│   └── public/
│       └── nebula_youtube_music.mp3  # Intro music
│
├── web/                           # Next.js public website
│   ├── app/                       # Next.js App Router
│   ├── components/                # React components
│   └── lib/                       # Utilities (db, auth, youtube, r2)
│
├── /var/markethawk/               # Shared storage (NOT in git)
│   └── jobs/
│       └── {JOB_ID}/              # Collocated job directory
│           ├── job.yaml           # Single source of truth
│           ├── input/             # source.mp4
│           ├── transcripts/       # transcript.json, paragraphs.json
│           ├── renders/           # take1.mp4, take2.mp4, etc.
│           └── thumbnails/        # Generated thumbnails
│
├── AUDIO-ONLY-EARNINGS-RECIPE.md # Recipe for audio-only videos
├── THUMBNAIL-OPTIONS.md           # Thumbnail generation guide
├── COLLOCATION-STRUCTURE.md       # Job directory structure
└── CLAUDE.md                      # This file
```

**Recipes and companion documentation are in PRD/ directory.** 
---

## Workflow-Based Processing System

**Architecture:** Jobs are processed through composable workflows defined in YAML files.

**Single source of truth:** `job.yaml` in each job directory

### Available Workflows

**Location:** `lens/workflows/*.yaml`

1. **manual-audio** - Manually downloaded MP3/audio files
   - LLM extracts metadata from transcript
   - Interactive confirmation
   - No ticker/quarter required upfront

2. **youtube-video** - YouTube videos (standard pipeline)
   - Download → Transcribe → Insights → Render

3. **audio-batch** - Batch processing multiple videos
   - Auto-detection + fuzzy matching
   - Database storage

### Create Job (Explicit Workflow Selection)

**IMPORTANT:** Always specify `--workflow` explicitly.

```bash
cd ~/markethawk
source .venv/bin/activate

# Manual audio workflow (for downloaded MP3 files)
python lens/job.py create \
  --workflow manual-audio \
  --audio /path/to/earnings_call.mp3

# YouTube video workflow
python lens/job.py create \
  --workflow youtube-video \
  --ticker NVDA \
  --quarter Q3 \
  --url "https://youtube.com/watch?v=..."

# HLS stream workflow
python lens/job.py create \
  --workflow youtube-video \
  --ticker BIP \
  --quarter Q3-2025 \
  --company "Brookfield Infrastructure Partners LP" \
  --url "https://media.main.pro2.mas.media-server.com/.../audio.m3u8"
```

### Run Workflow

**Use `lens/workflow.py` (replaces deprecated `process_job_pipeline.py`)**

```bash
# Run all steps in workflow
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml

# Run single step
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step transcribe

# Run from specific step onwards
python lens/workflow.py /var/markethawk/jobs/{JOB_ID}/job.yaml --from-step extract_insights

# List available step handlers
python lens/workflow.py --list-handlers
```

### Workflow Customization

**Edit workflow YAML files to customize processing:**

```bash
# Edit workflows
code lens/workflows/manual-audio.yaml
code lens/workflows/youtube-video.yaml
code lens/workflows/audio-batch.yaml
```

**Customization options:**
- Remove steps you don't need
- Change `required: true/false` flags
- Modify `skip_if` conditions
- Reorder steps
- Add new steps (create handler in `lens/steps/`)

**Common workflow steps:**
1. Download / Copy Audio
2. Transcribe (WhisperX with speaker diarization + word-level timestamps)
3. Extract metadata (LLM or manual)
4. Extract insights (OpenAI structured outputs)
5. Refine timestamps (word-level precision)
6. Upload artifacts (R2)
7. Render video (Remotion)
8. Generate thumbnails
9. Upload to YouTube
10. Update database

### Start Media Server (Background)

**Required for both preview and rendering:**

```bash
cd /var/markethawk
screen -S media-server
npx serve . --cors -p 8080

# Press Ctrl+A then D to detach
# screen -r media-server  # to reattach if needed
```

### Preview in Remotion Studio (Background)

**Preview compositions before rendering:**

```bash
cd ~/markethawk/studio
screen -S remotion-studio
npm run start

# Press Ctrl+A then D to detach
# screen -r remotion-studio  # to reattach when needed
```

Access at: `http://localhost:3000`

### Render Video

**Two Options:**

#### Option 1: Pipeline (Recommended)
```bash
cd ~/markethawk
source .venv/bin/activate

# Render via pipeline (updates job.yaml automatically)
python lens/process_job_pipeline.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step render

# Specify take name (default: take1)
python lens/process_job_pipeline.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step render --take take2

# Override composition ID (default: auto-detected from job)
python lens/process_job_pipeline.py /var/markethawk/jobs/{JOB_ID}/job.yaml --step render --composition PSKY-Q3-2025
```

**Benefits:**
- Automatically updates `job.yaml` with render status
- Adds entry to `renders` array
- Tracks file size, duration, timestamp
- Auto-detects composition ID from job

**Updates in job.yaml:**
```yaml
processing:
  render:
    status: completed
    composition_id: PSKY-Q3-2025
    output_file: /var/markethawk/jobs/.../renders/take1.mp4
    duration_seconds: 2633
    file_size_mb: 592.4
    rendered_at: "2025-11-11T12:30:00"

renders:
  - take: take1
    file: /var/markethawk/jobs/.../renders/take1.mp4
    composition_id: PSKY-Q3-2025
    rendered_at: "2025-11-11T12:30:00"
    duration_seconds: 2633
    file_size_mb: 592.4
    notes: "Automated render via pipeline"
```

#### Option 2: Manual (Background)

**CRITICAL:** Always run renders in background to prevent accidental terminal shutdown!

```bash
cd ~/markethawk/studio
screen -S render
npx remotion render TICKER-Q3-2025 /var/markethawk/jobs/{JOB_ID}/renders/take1.mp4

# Press Ctrl+A then D to detach
# screen -r render  # to reattach
```

**Why background rendering is critical:**
- Renders take 15-30 minutes
- Accidental terminal close = lost render progress
- Use `screen` to persist

**Check running screens:**
```bash
screen -ls  # List all screen sessions
```

### Generate Thumbnails

**See:** `PRD/recipes/THUMBNAIL-OPTIONS.md` for detailed thumbnail generation guide.

```bash
python lens/smart_thumbnail_generator.py \
  /var/markethawk/jobs/{JOB_ID}/renders/take1.mp4 \
  /var/markethawk/jobs/{JOB_ID}/job.yaml \
  /var/markethawk/jobs/{JOB_ID}/thumbnails/
```

**Note:** Uses positional arguments (video, data, output). Supports both JSON and YAML data files.

### Preview with YouTube Chapter Markers

Before uploading, preview the video with clickable chapter markers and thumbnails:

```
http://192.168.1.101:8080/preview-chapters?job={JOB_ID}&take=take1.mp4
```

**Example:**
```
http://192.168.1.101:8080/preview-chapters?job=B_Q3_2025_20251110_220309&take=take1.mp4
```

**Features:**
- Watch rendered video with synchronized chapter markers
- Click chapter timestamps to jump to sections
- View all 4 thumbnail variations (click to download)
- Copy YouTube description with markethawkeye.com link
- All data loaded from job.yaml (single source of truth)

**File location:** `/var/markethawk/preview-chapters.html`

**Note:** The media server (`npx serve`) uses clean URLs, so access without `.html` extension.

### Upload to YouTube - this may need to happen on mac -
```bash
python lens/scripts/upload_youtube.py \
  --video /var/markethawk/jobs/{JOB_ID}/renders/take1.mp4 \
  --thumbnail /var/markethawk/jobs/{JOB_ID}/thumbnails/thumbnail_1.jpg \
  --metadata /var/markethawk/jobs/{JOB_ID}/job.yaml
```

---

## Timestamp Refinement (Word-Level Precision)

**Problem:** LLM uses paragraph-level timestamps, causing metrics to appear before they're actually spoken.

**Solution:** Separate refinement step searches word-level transcript within +30s window to find exact moment keywords are spoken.

### How It Works:

1. **LLM suggests metric** with paragraph timestamp (e.g., "$1.5 billion" at 320s)
2. **Extract keywords** from metric: ["content", "investment", "1", "5", "billion"]
3. **Prioritize number keywords** - search for "1", "5" first (more specific than "billion")
4. **Search word-level transcript** from 320s to 350s (+30s window)
5. **Find first match** with quality filters:
   - Skip single-letter words ('a', 'i', 'to')
   - Require minimum 3-character match for text keywords
   - Prioritize number matches over text matches
6. **Add 0.5s buffer** → final timestamp: 331.6s (overlay appears right after spoken)

### Match Quality Improvements:

- **Number priority**: "1.5" > "billion" > "investment"
- **Filter noise**: Ignores 'a', 'the', 'in', 'on', single letters
- **Minimum length**: 3+ chars for text keywords, exact match for short words
- **Window increased**: 20s → 30s to catch delayed mentions

### Run Refinement

**Automatic (part of pipeline):**
```bash
python lens/process_job_pipeline.py /var/markethawk/jobs/{JOB_ID}/job.yaml
```

**Manual (standalone):**
```bash
# Refine timestamps for existing job
python lens/refine_timestamps.py /var/markethawk/jobs/{JOB_ID}/job.yaml

# Adjust search window (default: 30s)
python lens/refine_timestamps.py /var/markethawk/jobs/{JOB_ID}/job.yaml --window 40
```

### Output During Processing:

```
🔍 Refining timestamps with word-level data...
   Window: +30s from LLM suggestion

Refining 6 financial metrics:
  Content Investment: $1.5 billion
    Keywords: content, investment, 1, 5, billion
    ✓ 320s → 331.6s (matched 'investment' [text])

  Segment Revenue Growth: 24% for Paramount Plus
    Keywords: segment, revenue, growth, 24, paramount
    ✓ 531s → 537.5s (matched '24' [number])

Refining 10 highlights:
  Strategic focus on content quality...
    Keywords: strategic, focus, content
    ✓ 180s → 183.2s (matched 'strategic' [text])

✅ Timestamp refinement complete!
   Metrics: 5 refined, 1 unchanged
   Highlights: 10 refined, 0 unchanged
```

### State Tracking

Refinement status is tracked in job.yaml:

```yaml
processing:
  insights:
    status: completed
    # Contains paragraph-level timestamps

  refine_timestamps:
    status: completed
    metrics_refined: 5
    metrics_unchanged: 1
    highlights_refined: 10
    highlights_unchanged: 0
    search_window_seconds: 30
```

**Benefits of Separate Step:**
- Can re-run without expensive LLM call
- Idempotent (safe to run multiple times)
- Adjustable search window
- Clear separation: LLM insights vs local word search

**Implementation:** `lens/refine_timestamps.py` - runs automatically as pipeline step 6.

---

## Audio-Only Earnings Calls

**See:** `PRD/recipes/AUDIO-ONLY-EARNINGS-RECIPE.md` for complete recipe.

### Key Design Principles:

**1. Audio Components:**
- Use `<Audio>` component, NOT `<OffthreadVideo>` (audio-only files have no video stream)
- Add `FadedAudio` component for smooth transitions:
  - Title music fades out at 4-5s (smooth transition to earnings audio)
  - Earnings audio fades in over 1.5s (45 frames at 30fps)

**2. Visual Hierarchy (Fill the Canvas):**
- **Primary:** Company Name + "Q3 2025 Earnings Call" - Large and centered
- **Secondary:** Stock ticker (PSKY, BIP, etc.) - Smaller, watermark style
- Example layout:
  ```
  Paramount Global          ← Large (140px)
  Q3 2025 Earnings Call     ← Large (84px)
  PSKY                      ← Secondary (120px, semi-transparent)
  ```

**3. Persistent Speaker Labels:**
- Keep speaker names visible throughout their speaking time
- **Don't just show at chapter transitions** - span entire speaker duration
- Purpose: Fill empty canvas, provide context
- Example: "David Ellison - Chairman and CEO" visible for 10+ minutes

**4. Brand Colors:**
- Use company brand colors for gradient background
- Ticker watermark uses brand primary color with transparency (0.3-0.4 opacity)
- Speaker labels use dark semi-transparent backgrounds (readable on any background)

**5. Thumbnails:**
- Generate thumbnails from rendered video (not from source audio file)

**Examples:**
- `studio/src/compositions/BIP_Q3_2025.tsx`
- `studio/src/compositions/PSKY_Q3_2025.tsx`

---

## Remotion Media Server

**Required for rendering:** Serve `/var/markethawk` via HTTP with CORS enabled.

```bash
# Start server (keep running during development/rendering)
cd /var/markethawk
npx serve . --cors -p 8080
```

**Environment Variable:**
```bash
# .env
MEDIA_SERVER_URL="http://192.168.1.101:8080"
```

**In Compositions:**
```tsx
const mediaServerUrl = process.env.MEDIA_SERVER_URL || 'http://192.168.1.101:8080';
const videoPath = `${mediaServerUrl}/jobs/{JOB_ID}/input/source.mp4`;
```

---

## Development Commands

### Setup
```bash
npm install
cp .env.example .env.local
# Fill in: DATABASE_URL, YOUTUBE_API_KEY, etc.
```

### Development
```bash
npm run dev                          # Next.js web app
cd studio && npm run start          # Remotion Studio (preview)
```

### Video Processing
```bash
cd ~/markethawk
source .venv/bin/activate
python lens/job.py create --ticker AAPL --quarter Q4-2024 --url "..."
python lens/process_job_pipeline.py /var/markethawk/jobs/{JOB_ID}/job.yaml
```

### Deployment
```bash
vercel deploy                        # Deploy web app
```

---

## Git Workflow

**Only commit code changes, NOT video files.**

```bash
git add lens/ studio/ web/
git commit -m "Add BIP Q3-2025 composition"
git push
```

**Never commit:**
- Video files (*.mp4)
- Audio files (*.mp3, *.m4a)
- Transcripts (*.json in /var/markethawk)
- Job directories (/var/markethawk/jobs/)

---

## Code Style

- TypeScript strict mode
- Validate inputs with Zod
- TailwindCSS utility classes (avoid custom CSS)
- Server components by default (Next.js)
- No emojis unless explicitly requested

---

## Performance Best Practices

- Use `OffthreadVideo` in Remotion (faster rendering)
- Optimize images with next/image
- Cache YouTube API responses (60s TTL)
- Use ISR for video pages (revalidate hourly)

---

## Troubleshooting

### Permission Errors on SMB Mount
```bash
# Directories created on Mac may have restrictive permissions
# Fix from sushi:
chmod 755 /var/markethawk/jobs/{JOB_ID}/renders
```

**Prevention:** `lens/job.py` now creates directories with `mode=0o755`

### "No video stream found" Error
- You're using `<OffthreadVideo>` on audio-only file
- Switch to `<Audio>` component
- See: `AUDIO-ONLY-EARNINGS-RECIPE.md`

### Abrupt Audio Cuts
- Add `FadedAudio` component for smooth transitions
- Fade out title music (30 frames)
- Fade in earnings audio (45 frames)

### YouTube Upload Port Conflict
- **Error:** `[Errno 98] Address already in use`
- **Cause:** OAuth flow (port 8090) or media server (port 8080) conflict
- **Ports used:**
  - Media server: `8080` (npx serve)
  - YouTube OAuth: `8090` (upload_youtube.py)
- **Fix:** Keep media server running, OAuth will use 8090

---

## Related Documentation

### Core Documentation
- **PRD:** `PRD/README.md` - Complete product requirements document
- **Job Structure:** `PRD/recipes/COLLOCATION-STRUCTURE.md` - Directory organization

### Video Pipeline Recipes
- **Audio-Only Recipe:** `PRD/recipes/AUDIO-ONLY-EARNINGS-RECIPE.md` - Complete workflow for audio-only earnings calls
- **Thumbnail Guide:** `PRD/recipes/THUMBNAIL-OPTIONS.md` - Thumbnail generation options

### SaaS Platform Guides (for web app development)
- **Web App Guide:** `PRD/WEB-APP-GUIDE.md` - Next.js, Better Auth, Stripe integration
- **SEO Strategy:** `PRD/SEO-STRATEGY.md` - YouTube + website SEO optimization
- **User Experience:** `PRD/USER-EXPERIENCE.md` - Free tier, paywalls, personalization
- **Admin Dashboard:** `PRD/ADMIN-DASHBOARD.md` - Monitoring, analytics, real-time metrics
- **Database Schema:** `PRD/DATABASE-SCHEMA.md` - Complete schema with Drizzle ORM
- **Deployment:** `PRD/DEPLOYMENT.md` - Vercel deployment, environment variables

### Reference
- **VideotoBe Platform:** `~/videotobe/platform` - Reusable components for web app

---

**Last Updated:** 2025-11-12
**Project Status:** Active Development - Job-based pipeline with audio-only support + Neon production database
- Guidelines for Marketing Copy: Always talk in terms of User Benefits and not Product Features.
- greenfield project - no legacy consideration
- nextjs 15  use actions instead of API routes.
- never output the source of earning calls media. Never expoise internal pipeline/job ids on external UI.
- for production database use postgresql://neondb_owner:npg_e1uBMOdh5QUy@ep-twilight-leaf-a4dgbd70.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
- To run with  production database use following command  'npx dotenv -e .env.production -- npm run dev'
- no need to include "source .venv/bin/activate" while outputting commands to execute.
- never hardcode  database urls in code