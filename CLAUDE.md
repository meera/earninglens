# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: EarningLens

### Overview
EarningLens transforms earnings call audio into visually-enhanced YouTube videos with an interactive SaaS web platform.

---

## ⚠️ GOVERNING PRINCIPLES (CRITICAL)

### Core Value Proposition
**Earnings calls are drab and uninteresting.** We convert audio into visually stimulating video.

**Our Key Value:**
- **Fantastic visually appealing videos** - Make boring earnings calls engaging
- **Compelling storytelling** - Transform data into narratives
- **Automated pipeline** - Mass produce at scale (1000+ companies, every quarter)
- **Speed to market** - Full video within hours of earnings call

We don't compete on data (available everywhere). We compete on **presentation and automation at scale**.

### The EarningLens Approach

1. **Audio is Sacred**
   - Use the ACTUAL earnings call audio (30-60 minutes)
   - NEVER synthesize, paraphrase, or alter what was said
   - Strict adherence to: **original audio + SEC filings + initial prompt**
   - If CEO says "revenue up 6%", we show exactly that - not 5%, not 7%
   - Sources of truth: Audio + SEC filings + initial prompt (the 3 pillars)

2. **Visual Enhancement**
   - Overlay dynamic visuals synchronized to audio
   - Speaker identification (photo + name when speaking)
   - Metrics appear when mentioned ("up 9000%" → show ↑ 9000%)
   - Charts, graphs, and data visualizations
   - Company branding throughout

3. **Peripheral Data (Web App)**
   - Supplement video with contextual data from web
   - Present in interactive web application
   - Sources: SEC filings, investor relations, reputable financial sites
   - All data traceable to source

4. **Traffic Generation**
   - Create YouTube Shorts (30-60s snippets) from full video
   - Key moments: Revenue announcement, EPS beat, guidance
   - Drive traffic from Shorts → Full video → Web app

5. **Trust & Integrity (NON-NEGOTIABLE)**
   - **NEVER make up data**
   - **NEVER infer or guess numbers**
   - **NEVER use unreliable sources**
   - Carefully vet all data sources
   - If uncertain, don't show it
   - **Three pillars of truth:** Original audio + SEC filings + Initial prompt

6. **Scale Through Automation**
   - Build once, run 1000+ times
   - Every company, every quarter
   - Automated pipeline: Download → Parse → Transcribe → Smart Trim → Insights → Render → Upload
     1. **Download** - Get video from YouTube
     2. **Parse** - Extract ticker/quarter from metadata
     3. **Transcribe** - Run Whisper on original video
     4. **Smart Trim** - Cut 5s before first speech (keeps intro music)
     5. **Insights** - GPT-4o extracts metrics/highlights
     6. **Render** - Remotion generates final video with overlays
     7. **Upload** - Push to YouTube with metadata
   - Goal: 10 videos per week → 50 videos per week → 500+ videos per quarter

### The Three Pillars of Truth

**Everything must come from one of these three sources:**

1. **Original Audio** - The earnings call recording (unaltered)
2. **SEC Filings** - 10-K, 10-Q, 8-K (official regulatory documents)
3. **Initial Prompt** - User's input/request for video creation

These are the ONLY sources we trust absolutely. Everything else is supplementary.

### Approved Data Sources (Trust Hierarchy)

**Tier 1 (Always Trust):**
- Earnings call audio (company IR or YouTube official)
- SEC filings (10-K, 10-Q, 8-K)
- Company investor relations websites
- Official press releases

**Tier 2 (Verify First):**
- Bloomberg, Reuters, WSJ (financial data)
- Yahoo Finance, Google Finance (stock quotes)
- Seeking Alpha transcripts (verify against audio)

**Tier 3 (Use with Extreme Caution):**
- Social media (FinTwit) - sentiment only, never data
- Blogs and analyst reports - opinions only
- Wikipedia - general context only

**Never Use:**
- Unverified sources
- AI-generated summaries (unless from official source)
- Forums, message boards
- Promotional content

### Content Creation Rules

✅ **DO:**
- Play original audio in full
- Show speaker when they speak
- Display metrics exactly as stated in audio
- Add context from SEC filings
- Cite all external data sources
- Create clips from actual moments in call

❌ **DON'T:**
- Summarize or paraphrase the call
- Show data not mentioned in audio (unless clearly labeled "Additional Context")
- Mix opinions with facts
- Use clickbait or sensational language
- Alter timing or sequence of statements
- Remove context that changes meaning

### Example: The Right Way

**Audio says:** "Revenue was $94.9 billion, up 6% year-over-year"

**We show:**
```
[Speaker: Tim Cook, CEO]
┌──────────────────┐
│  REVENUE         │
│  $94.9B          │
│  ↑ +6% YoY       │
└──────────────────┘
```

**We DON'T show:**
- "Revenue nearly $95B" (rounding can introduce error - do not round unless mentioned in call)
- "Strong revenue growth" (subjective interpretation - stick to exact facts stated)
- Comparison to competitors (unless mentioned in call)
- Any data not directly from the audio or verified sources

---

**Vision:** "Show, don't tell" - Data-driven earnings content, text, maximum engagement.

**Monetization:**
1. YouTube ad revenue (1000+ subs, 4000+ watch hours)
2. Website subscriptions (freemium SaaS)

**Development Philosophy:**
- **Speed first:** "Ugly, dirty first version" deployed ASAP
- **Iterate rapidly:** First 10 videos → 100 videos → scale
- **Automate everything:** Build pipeline for mass production
- **Visual storytelling:** Fantastic, engaging video presentation
- **Data-driven:** Monitor via admin dashboard (NOT email)
- **Mobile-first:** Admin interface optimized for mobile monitoring

**Command Execution Principles:**
- **Always run from project root:** `~/earninglens/`
- **NEVER cd into subdirectories** to run commands
- **Use relative paths from root** for all commands
- Examples:
  ```bash
  # ✅ CORRECT - Run from root
  cd ~/earninglens
  source .venv/bin/activate
  python lens/process_earnings.py --url "..."
  npm run dev --prefix web
  npm run start --prefix studio

  # ❌ WRONG - Don't cd into subdirectories
  cd ~/earninglens/lens
  python process_earnings.py --url "..."
  ```
- **Benefits:** Consistent working directory, .env always in same location, clearer paths

**What We're Good At:**
- 🎨 Visually appealing video production
- 📖 Compelling storytelling with data
- 🤖 Automated pipeline (scale to 1000+ companies)
- ⚡ Speed (full video hours after earnings call)

**What We're NOT:**
- ❌ Just another data aggregator (data is commodity)
- ❌ Manual video production (can't scale)
- ❌ Opinion/analysis provider (we present facts)
- ❌ Slow (can't wait days for video)

### Related Documentation
- **PRD:** See `/Users/Meera/earninglens/PRD.md` for complete product requirements
- **Testing:** See `/Users/Meera/earninglens/TESTING-INFRASTRUCTURE.md` for testing strategy
- **Data Architecture:** See `/Users/Meera/earninglens/DATA-ARCHITECTURE.md` for R2 + database structure
- **VideotoBe Platform:** Existing codebase at `~/videotobe/platform` (reuse heavily)

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui or custom
- **State Management:** React Context / Zustand
- **Forms:** React Hook Form + Zod validation

### Backend
- **Database:** Neon PostgreSQL (serverless)
  - Cost-effective serverless Postgres
  - Auto-scaling
  - Monitor costs closely
- **Authentication:** Better Auth
  - **Google One Tap** (automatic, no explicit sign-in page)
  - Organization/team structure support
  - Stripe plugin for payments
  - Seamless authentication (users sign in as they browse)
- **Payments:** Stripe
  - Integrated via Better Auth plugin
  - Subscription management
  - Usage-based billing (future)
- **Storage:** Cloudflare R2
  - **Bucket:** `earninglens` (separate from videotobe)
  - **Structure:** Collocated by company (AAPL/videos/, AAPL/audio/, etc.)
  - Video files (rendered + backups)
  - Audio files (earnings calls, segments)
  - Transcripts (JSON with timestamps, VTT captions)
  - Reports (SEC filings, press releases)
  - Thumbnails only (NO chart images - charts rendered from data)

### Video Generation
- **Framework:** Remotion 4.0+
- **Rendering:** GPU machine (primary) or Remotion Lambda (scale)
- **Format:** H.264 MP4, 1080p, 30fps
- **Audio:** Synced narration + background audio

### Media Server (Critical for Remotion)

**Problem:** Remotion cannot use absolute file paths (not portable). Videos in `/var/earninglens/` need to be served via HTTP.

**Solution:** Serve `/var/earninglens` via HTTP with CORS enabled.

**Setup:**
```bash
# Terminal 1: Start media server (keep running)
npx serve /var/earninglens --cors -p 8080

# Terminal 2: Run Remotion Studio
cd ~/earninglens/studio
npm run start
```

**Environment Variable:**
```bash
# .env
MEDIA_SERVER_URL="http://192.168.1.101:8080"
```

**In Compositions:**
```typescript
// Compositions read from environment variable
const mediaServerUrl = process.env.MEDIA_SERVER_URL || 'http://localhost:8080';
const videoPath = `${mediaServerUrl}/HOOD/Q3-2025/input/source.trimmed.mp4`;
```

**Benefits:**
- ✅ No copying files to `public/` directory
- ✅ Direct access to `/var/earninglens` videos
- ✅ Configurable server URL via `.env`
- ✅ Works for both preview and rendering

**Important:** The media server must be running for Remotion Studio and rendering to work!

### YouTube Preview System

**Purpose:** Preview video, thumbnails, chapter markers, and description BEFORE uploading to YouTube.

**Preview Tool:** `preview-chapters.html` - A YouTube-like interface to verify all content.

**How to Preview:**

1. **Ensure media server is running:**
   ```bash
   npx serve /var/earninglens --cors -p 8080
   ```

2. **Access preview page in browser:**
   ```
   http://192.168.1.101:8080/preview-chapters.html
   ```

**What You Can Preview:**

- ✅ **Video Player** - Full rendered video with controls
- ✅ **Thumbnails** - 4 generated thumbnails (click to download)
- ✅ **Chapter Markers** - Clickable timestamps in description (just like YouTube)
- ✅ **YouTube Description** - Ready to copy/paste into YouTube
- ✅ **Hashtags** - Pre-formatted hashtags for YouTube

**Configuration:**

Edit the config section in `preview-chapters.html`:
```javascript
const CONFIG = {
  ticker: 'HOOD',
  quarter: 'Q3-2025',
  videoType: 'take1',        // or 'take2', 'take3' for different renders
  videoFilename: 'final.mp4', // Actual rendered filename
  serverUrl: 'http://192.168.1.101:8080'
};
```

**Workflow:**

```bash
# 1. Render video
cd ~/earninglens/studio
npx remotion render HOOD-Q3-2025 /var/earninglens/HOOD/Q3-2025/take1/final.mp4

# 2. Generate thumbnails
cd ~/earninglens
source .venv/bin/activate
python lens/smart_thumbnail_generator.py \
  --data /var/earninglens/HOOD/Q3-2025/insights.json \
  --output /var/earninglens/HOOD/Q3-2025/

# 3. Preview (ensure media server is running)
# Open in browser: http://192.168.1.101:8080/preview-chapters.html

# 4. Verify:
#    - Watch video to check overlays/timing
#    - Click chapter markers to test navigation
#    - Download preferred thumbnail
#    - Copy description for YouTube upload

# 5. Upload to YouTube (only after preview looks good)
python lens/scripts/upload_youtube.py \
  --video /var/earninglens/HOOD/Q3-2025/take1/final.mp4 \
  --thumbnail /var/earninglens/HOOD/Q3-2025/thumbnail_1.jpg \
  --metadata /var/earninglens/HOOD/Q3-2025/insights.json
```

**Benefits:**

- ✅ Catch timing errors before uploading
- ✅ Test chapter navigation like YouTube
- ✅ Choose best thumbnail from 4 variations
- ✅ Verify description formatting
- ✅ No need to upload/delete test videos

### APIs
- **YouTube Data API v3:**
  - Video upload (automated)
  - Analytics (views, watch time, engagement)
  - Metadata management
  - Comment monitoring
- **Rapid API:**
  - YouTube video download
  - Audio extraction
  - Thumbnail extraction

### Infrastructure
- **Hosting:** Vercel (Next.js)
- **CDN:** Cloudflare (R2 + caching)
- **Monitoring:** Custom admin dashboard
- **Email:** Resend or SendGrid (transactional)

### **Development Machines (CRITICAL)**

**Two-machine setup for video production:**

1. **Sushi (Linux GPU machine)** - Heavy processing
   - GPU-accelerated transcription (Whisper)
   - GPU-accelerated rendering (Remotion)
   - Fast processing (20-30 min per video)

2. **Mac Laptop** - Development & editing
   - Composition editing (React/TypeScript)
   - Remotion Studio preview
   - Git commits
   - YouTube uploads

**Shared Directory (CRITICAL):**
```
/var/earninglens/  ← Shared between sushi and Mac
```

This directory is **accessible from both machines**:
- **On sushi:** `/var/earninglens/`
- **On Mac:** `/var/earninglens/` (network mounted - `/Volumes/earninglens-1/`)

**Structure:**
```
/var/earninglens/
├── _downloads/                    # Processing directory (by YouTube video ID)
│   └── {youtube_video_id}/        # e.g., jUnV3LiN0_k
│       ├── .state.json            # Processing state tracker
│       ├── source.mp4             # Original download
│       ├── source.trimmed.mp4     # Silence removed
│       ├── metadata.json          # YouTube metadata
│       ├── transcript.json        # Full Whisper transcript
│       ├── transcript.paragraphs.json  # Optimized (for GPT)
│       ├── transcript.srt         # Subtitle format
│       ├── transcript.vtt         # WebVTT format
│       ├── transcript.txt         # Plain text
│       └── transcript.tsv         # Timestamps
│
├── PLTR/                          # Final outputs (by company/quarter)
│   └── Q3-2025/
│       ├── metadata.json          # Company/video metadata
│       ├── insights.json          # GPT-4o extracted insights
│       ├── take1.mp4              # First render
│       ├── take2.mp4              # Second render (after fixes)
│       ├── input/                 # (empty - reserved)
│       └── transcripts/           # (empty - reserved)
│
├── HOOD/
│   └── Q3-2025/
├── AAPL/
│   └── Q4-2024/
└── [TICKER]/
    └── [QUARTER]/
```

**Processing State Tracking:**

Each video has a `.state.json` file in `_downloads/{youtube_video_id}/` that tracks:
```json
{
  "video_id": "jUnV3LiN0_k",
  "started_at": "2025-11-05T19:23:12.214552",
  "steps": {
    "download": {"status": "completed", "timestamp": "..."},
    "parse": {"status": "completed", "data": {"ticker": "PLTR", "quarter": "Q3-2025"}},
    "remove_silence": {"status": "completed"},
    "transcribe": {"status": "completed"},
    "insights": {"status": "completed"}
  },
  "last_updated": "2025-11-06T00:07:38.563300"
}
```

This allows resuming failed processing from the last successful step.

**Workflow Benefits:**
- ✅ Process on sushi (GPU)
- ✅ Files instantly available on Mac
- ✅ Edit compositions on Mac
- ✅ Render on sushi (GPU)
- ✅ **Only commit code changes to git** (not video files)
- ✅ Clean git history (no large files)

**Key Principle:**
- Video files, transcripts, audio → `/var/earninglens/` (shared, NOT in git)
- Code, compositions, components → `~/earninglens/` (git repo, committed)

---

## Project Structure (Monorepo)

**Repository:** `~/earninglens/`

```
earninglens/
├── studio/                        # Remotion video compositions
│   ├── src/
│   │   ├── compositions/          # Video templates (PLTR_Q3_2025.tsx, etc.)
│   │   ├── components/            # Reusable components (SubscribeLowerThird, etc.)
│   │   ├── themes/                # Company brand themes (robinhood.ts, palantir.ts)
│   │   └── Root.tsx               # Composition registry
│   ├── public/
│   │   └── audio/                 # Audio files for local preview (symlinks)
│   ├── package.json
│   └── remotion.config.ts
│
├── web/                           # Next.js public website (earninglens.com)
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth pages
│   │   ├── (public)/              # Landing, video pages
│   │   ├── (dashboard)/           # User dashboard
│   │   └── api/                   # API routes
│   ├── components/                # React components
│   ├── lib/                       # Utilities (db, auth, youtube, r2)
│   └── package.json
│
├── dashboard/                     # Admin dashboard (separate Next.js app)
│   ├── app/
│   │   ├── page.tsx               # Main admin view (mobile-first)
│   │   ├── videos/                # Video management
│   │   └── analytics/             # Deep analytics
│   ├── components/
│   │   ├── StatsCard.tsx
│   │   ├── VideoTable.tsx
│   │   └── RealtimeChart.tsx
│   └── package.json
│
├── lens/                          # Python video processing pipeline
│   ├── process_earnings.py       # Main pipeline script
│   ├── transcribe.py              # Whisper transcription
│   ├── extract_insights.py        # GPT-4o insights extraction
│   ├── scripts/
│   │   ├── download-youtube.py    # YouTube downloader
│   │   └── upload_youtube.py      # YouTube uploader
│   └── requirements.txt
│
├── api/                           # Backend API (if separate from web)
│   └── (reserved for future use)
│
├── marketing/                     # Marketing assets
│   ├── landing-pages/
│   ├── email-templates/
│   └── assets/
│
├── shared/                        # Shared utilities across packages
│   └── types/                     # TypeScript types
│
├── scripts/                       # Utility scripts
│   ├── mount-sushi.sh             # Mount sushi directory (if needed)
│   ├── batch-render.sh            # GPU batch rendering
│   └── seed-database.ts           # Database seeding
│
├── public/                        # Global public assets
│   └── logos/                     # Company logos
│
├── .env.local                     # Local environment variables
├── .env.prod                      # Production environment variables
├── package.json                   # Root package.json (workspace)
├── turbo.json                     # Turborepo config (if using)
├── CLAUDE.md                      # This file
├── WORKFLOW.md                    # Video production workflow
└── PRD.md                         # Product requirements
```

**Workspace Management:**
- **Root `package.json`** manages workspaces for studio, web, dashboard
- Shared dependencies installed at root level
- Each package has its own `package.json` for specific dependencies

**Key Directories:**
- `studio/` - Video generation (Remotion)
- `web/` - Public website (Next.js)
- `dashboard/` - Admin interface (Next.js)
- `lens/` - Processing pipeline (Python)
- `marketing/` - Marketing materials
- `shared/` - Shared code/types

---

## Video Composition & Enhancement System

### Philosophy: MVP Approach

**For MVP:**
- ✅ Create **generic, reusable enhancement components** (MetricDisplay, AnimatedTitle, etc.)
- ❌ Do NOT abstract compositions - one specific composition per video
- Build `HOOD_Q3_2025.tsx`, `PLTR_Q3_2025.tsx`, etc. with hardcoded timing
- Focus on shipping videos quickly, not building a template engine

### Enhancement Components (Generic, Reusable)

**Location:** `studio/src/components/enhancements/`

**Available Components:**
1. **AnimatedTitle** - Opening title card with company branding
2. **MetricDisplay** - Animated metric cards (revenue, EPS, subscribers, etc.)
3. **SpeakerLabel** - Speaker identification lower thirds
4. **CompanyLogo** - Persistent watermark logo
5. **CallToAction** - End-screen CTA with subscribe button
6. ~~**ChapterProgress**~~ - **NOT USED** (chapters don't make sense for earnings calls)

**Brand Profiles:**
- `lens/companies/HOOD.json` - Robinhood green theme (#00C805)
- `lens/companies/PLTR.json` - Palantir blue theme (#0033A0)
- `lens/companies/_default.json` - Fallback theme

**Key Principle:** All components accept `brandColors` prop and adapt styling automatically.

### Video Composition Pattern

**Example:** `studio/src/compositions/HOOD_Q3_2025.tsx`

```typescript
import {OffthreadVideo, Sequence} from 'remotion';
import {AnimatedTitle, MetricDisplay, CompanyLogo, CallToAction} from '../components/enhancements';
import robinhoodBrand from '../../../lens/companies/HOOD.json';

export const HOOD_Q3_2025: React.FC = () => {
  const videoPath = staticFile('audio/HOOD_Q3_2025.mp4');

  return (
    <AbsoluteFill>
      {/* Title card (0-5s) */}
      <Sequence from={0} durationInFrames={150}>
        <AnimatedTitle company="Robinhood" quarter="Q3" year={2025}
                       brandColors={robinhoodBrand.brandColors} />
      </Sequence>

      {/* Main video (5s onwards) */}
      <Sequence from={150} durationInFrames={durationInFrames - 450}>
        <OffthreadVideo src={videoPath} />
      </Sequence>

      {/* Metric at specific timestamp (from insights.json) */}
      <Sequence from={fps * 107} durationInFrames={fps * 5}>
        <MetricDisplay metric="Revenue" value="$1.3B" change="+100% YoY"
                       changeType="positive" brandColors={robinhoodBrand.brandColors} />
      </Sequence>

      {/* Persistent logo */}
      <Sequence from={150} durationInFrames={durationInFrames - 150}>
        <CompanyLogo logoUrl={robinhoodBrand.logo.url}
                     brandColors={robinhoodBrand.brandColors} />
      </Sequence>

      {/* End CTA (last 10s) */}
      <Sequence from={durationInFrames - 300} durationInFrames={300}>
        <CallToAction message="View full analysis" url="EarningLens.com/HOOD/Q3-2025"
                      brandColors={robinhoodBrand.brandColors} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

**Registration in Root.tsx:**
```typescript
<Composition
  id="HOOD-Q3-2025"
  component={HOOD_Q3_2025}
  durationInFrames={139254} // 77 min at 30fps
  fps={30}
  width={1920}
  height={1080}
/>
```

### Audio/Video Files for Remotion Studio

**On Mac (for preview):**
```bash
# Create symlink to processed video
ln -sf /var/earninglens/_downloads/<video_id>/source.trimmed.mp4 \
       ~/earninglens/studio/public/audio/HOOD_Q3_2025.mp4
```

**On Sushi (for rendering):**
- No symlinks needed - pipeline creates files in `/var/earninglens/`
- Remotion render command accesses files directly

### Design Decisions

**Why no chapter progress bar?**
- Earnings calls are continuous conversations, not segmented content
- Chapters like "Opening Remarks", "Q&A Part 1", "Q&A Part 2" add no value
- Users care about metrics/highlights, not artificial chapter boundaries
- **Decision:** ChapterProgress component exists but should NOT be used in earnings videos

**What to use instead:**
- Metric overlays at key timestamps (from insights.json)
- Speaker labels when speakers change
- Persistent company logo watermark
- End-screen CTA

---

## Code Reuse from VideotoBe Platform

### Location
`~/videotobe/platform`

### Reusable Components (Copy These)

1. **YouTube API Integration**
   - Video upload utilities
   - Analytics fetching
   - Metadata optimization
   - Rapid API YouTube downloader

2. **Better Auth Setup**
   - Organization/team structure
   - Stripe plugin configuration
   - Social login flows
   - Session management

3. **Admin Dashboard**
   - Real-time metrics components
   - Chart visualizations
   - Mobile-responsive layouts
   - API polling hooks

4. **R2 Integration**
   - Upload utilities
   - URL generation
   - Batch operations
   - rclone wrapper functions

5. **Database Patterns**
   - Schema designs
   - Query optimization
   - Migration patterns
   - Seed data scripts

### Files to Copy (Examples)
```bash
# Copy YouTube utilities
cp ~/videotobe/platform/lib/youtube.ts ./src/lib/youtube.ts

# Copy R2 utilities
cp ~/videotobe/platform/lib/r2.ts ./src/lib/r2.ts

# Copy Better Auth config
cp ~/videotobe/platform/lib/auth.ts ./src/lib/auth.ts

# Copy admin dashboard components
cp -r ~/videotobe/platform/components/admin ./src/components/admin
```

---

## Project Structure

```
earninglens/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── (public)/                 # Public routes (landing, videos)
│   │   ├── (dashboard)/              # Protected routes (user dashboard)
│   │   ├── admin/                    # Admin dashboard
│   │   │   ├── page.tsx              # Main admin view (mobile-first)
│   │   │   ├── videos/               # Video management
│   │   │   └── analytics/            # Deep analytics
│   │   ├── api/                      # API routes
│   │   │   ├── admin/                # Admin endpoints
│   │   │   │   └── stats/            # Real-time stats
│   │   │   ├── youtube/              # YouTube integration
│   │   │   │   ├── upload/           # Auto-upload
│   │   │   │   └── analytics/        # Fetch metrics
│   │   │   ├── videos/               # Video CRUD
│   │   │   └── webhooks/             # Stripe webhooks
│   │   ├── [company]/                # Dynamic company pages
│   │   │   └── [videoSlug]/          # Video detail pages
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── admin/                    # Admin dashboard components
│   │   │   ├── StatsCard.tsx        # Metric display cards
│   │   │   ├── VideoTable.tsx       # Video management table
│   │   │   ├── RealtimeChart.tsx    # Live analytics charts
│   │   │   └── MobileNav.tsx        # Mobile navigation
│   │   ├── video/                    # Video player components
│   │   │   ├── EmbeddedPlayer.tsx   # YouTube embed wrapper
│   │   │   ├── Transcript.tsx       # Transcript display
│   │   │   ├── InteractiveChart.tsx # Chart interactions
│   │   │   └── RelatedVideos.tsx    # Recommendations
│   │   ├── auth/                     # Auth components (Better Auth)
│   │   └── ui/                       # Reusable UI components
│   ├── lib/
│   │   ├── db.ts                     # Neon database client
│   │   ├── auth.ts                   # Better Auth config
│   │   ├── youtube.ts                # YouTube API utilities
│   │   ├── r2.ts                     # Cloudflare R2 utilities
│   │   ├── stripe.ts                 # Stripe client
│   │   └── utils.ts                  # Helper functions
│   ├── remotion/                     # Video compositions
│   │   ├── Root.tsx                  # Composition registry
│   │   ├── index.ts                  # Remotion entry point
│   │   └── EarningsVideo/            # Earnings video template
│   │       ├── index.tsx             # Main composition
│   │       ├── TitleCard.tsx         # Intro sequence
│   │       ├── TranscriptOverlay.tsx # Subtitle component
│   │       ├── ChartSequence.tsx     # Chart animations
│   │       └── schema.ts             # Zod schema
│   ├── types/
│   │   ├── database.ts               # Database types
│   │   ├── youtube.ts                # YouTube API types
│   │   └── index.ts                  # Global types
│   └── hooks/
│       ├── useAdmin.ts               # Admin dashboard hooks
│       ├── useVideoAnalytics.ts      # Video metrics hooks
│       └── useAuth.ts                # Auth hooks
├── public/
│   ├── logos/                        # Company logos
│   ├── charts/                       # Generated charts
│   └── audio/                        # Earnings call audio
├── scripts/
│   ├── batch-render.sh               # GPU batch rendering
│   ├── upload-to-youtube.ts          # Automated upload
│   └── seed-database.ts              # Database seeding
├── prisma/                           # Database schema (if using Prisma)
│   └── schema.prisma
├── .env.local                        # Environment variables
├── remotion.config.ts                # Remotion configuration
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # TailwindCSS configuration
├── tsconfig.json                     # TypeScript configuration
├── PRD.md                            # Product Requirements Document
└── CLAUDE.md                         # This file
```

---

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Then fill in: NEON_DATABASE_URL, YOUTUBE_API_KEY, STRIPE_SECRET_KEY, etc.

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Development
```bash
# Start Next.js dev server
npm run dev

# Open Remotion Studio
npm run remotion

# Run database studio (Prisma/Drizzle)
npm run db:studio

# Lint code
npm run lint

# Type check
npm run type-check
```

### Video Generation
```bash
# Start media server (required for Remotion)
npx serve /var/earninglens --cors -p 8080

# Open Remotion Studio (in another terminal)
cd ~/earninglens/studio
npm run start
# Access at: http://192.168.1.101:8082/

# Render video
cd ~/earninglens/studio
npx remotion render src/index.ts HOOD-Q3-2025 /var/earninglens/HOOD/Q3-2025/take1/take1.mp4

# Generate smart thumbnails (4 variations with different text effects)
python lens/smart_thumbnail_generator.py \
  /var/earninglens/HOOD/Q3-2025/input/source.trimmed.mp4 \
  /var/earninglens/HOOD/Q3-2025/insights.json \
  /var/earninglens/HOOD/Q3-2025/

# Preview chapters before YouTube upload
# Open scripts/preview-chapters.html in browser
# Requires media server running: npx serve /var/earninglens --cors -p 8080

# Upload to YouTube
python lens/scripts/upload_youtube.py \
  /var/earninglens/HOOD/Q3-2025/take1/take1.mp4 \
  /var/earninglens/HOOD/Q3-2025/insights.json
```

### Deployment
```bash
# Deploy to Vercel
vercel deploy

# Run production build locally
npm run build
npm start
```

---

## Working on Laptop (Travel Mode)

**IMPORTANT:** Always ensure work can be done on this laptop in case of travel. It will be slower and some paths need updating, but it must be possible.

### Key Differences When Working on Mac Laptop

**Primary Setup (Recommended):**
- Linux GPU machine ("sushi") - Fast transcription, rendering
- SSH access required
- Shared output directory

**Travel Mode (Mac Laptop):**
- No SSH to sushi (offline/traveling)
- CPU-only (slower, but functional)
- Local file paths

### Path Updates for Laptop

When working on laptop, update these paths:

**1. Transcription (Python)**
```bash
# On sushi (GPU): Fast (~15-20 min for 46 min video)
python transcribe.py --model medium

# On Mac (CPU): Slower (~60-90 min for 46 min video)
python transcribe.py --model small  # Use smaller model
```

**2. Remotion Rendering**
```bash
# On sushi: GPU-accelerated rendering
npm run render:aapl  # ~5-10 min

# On Mac: CPU rendering (slower)
npm run render:aapl  # ~20-30 min

# Update remotion.config.ts for Mac (if needed):
Config.setChromiumOpenGlRenderer('swangle');  # Software renderer
Config.setConcurrency('50%');  # Lower concurrency
```

**3. Output Directory**
```bash
# Standard (with GPU machine mount): ~/earninglens/lens/videos/
# Travel mode (local only): ~/earninglens/lens/videos/

# Same path! No changes needed if working locally.
# Just no access to GPU machine's generated files until you sync.
```

### Laptop Workflow (Offline/Travel)

**Option A: Work on Web/Dashboard Only**
```bash
cd ~/earninglens
npm run dev          # Next.js web app
npm run remotion     # Remotion Studio (preview only)
```

**Option B: Process Videos Locally (Slower)**
```bash
# 1. Download video
cd lens
python scripts/download-youtube.py <video-id>

# 2. Transcribe (CPU - slower)
python transcribe.py --video-id pltr-q3-2024 --model small

# 3. Render video (CPU - slower)
cd ../studio
npm run render -- pltr-q3-2024

# 4. Upload to R2 when online
cd ..
npm run upload:r2 -- lens/videos/pltr-q3-2024/output/final.mp4

# 5. Commit transcripts
git add lens/videos/pltr-q3-2024
git commit -m "Process PLTR Q3 2024 (laptop)"
git push
```

### Performance Expectations

| Task | Sushi (GPU) | Mac Laptop (CPU) |
|------|-------------|------------------|
| Download video (46 min) | 1-2 min | 1-2 min (same) |
| Transcribe (Whisper) | 15-20 min | 60-90 min |
| LLM Insights | 30 sec | 30 sec (same) |
| Render video (Remotion) | 5-10 min | 20-30 min |
| Upload to R2 | 2-3 min | 2-3 min (same) |
| **Total** | **~20-30 min** | **~90-120 min** |

### Recommendations for Travel

1. **Do web development on laptop** (fast, no GPU needed)
2. **Queue videos for processing** (edit `sushi/videos-list.md`)
3. **Process videos on sushi when back** (SSH in remotely if possible)
4. **Emergency processing on laptop** (if urgent, accept slower times)

### Verify Laptop Setup

Before traveling, ensure laptop has:

```bash
# 1. Python environment
cd ~/earninglens/lens
python --version  # Should be 3.9+
pip install -r requirements.txt

# 2. Node.js setup
cd ~/earninglens
npm install

# 3. Whisper model downloaded
python -c "import whisper; whisper.load_model('small')"

# 4. Test render
cd studio
npm run render -- --props='@./data/AAPL-Q4-2024.json'

# 5. Verify R2 access
rclone ls r2-public:videotobe-public
```

### Syncing Work Between Laptop and Sushi

**Before leaving (with sushi access):**
```bash
# Pull latest from sushi
ssh sushi "cd ~/earninglens && git pull && git push"
cd ~/earninglens
git pull
```

**While traveling (laptop only):**
```bash
# Work on web app, design, documentation
git add .
git commit -m "Web app updates (travel mode)"
git push
```

**After returning (sync with sushi):**
```bash
# SSH into sushi
ssh sushi
cd ~/earninglens
git pull  # Get your laptop changes

# Process any queued videos
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>
git push
```

### Emergency GPU Access While Traveling

If you need GPU processing while traveling:

**Option 1: SSH to Sushi (if online)**
```bash
ssh sushi
cd ~/earninglens
git pull
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>
```

**Option 2: Use Remotion Lambda (paid, but fast)**
```bash
# Deploy to Lambda
npm run deploy

# Render on Lambda
npx remotion lambda render <composition-id>
```

**Option 3: Process locally overnight**
```bash
# Start render before bed
npm run render:aapl &
# Will finish in ~2 hours
```

---

## R2 Bucket Organization (Cloudflare)

### Bucket: `earninglens` (Separate from VideotoBe)

**Structure:** Flat structure - all files for a quarter in one directory

```
r2:earninglens/
├── AAPL/
│   ├── 2024-Q4/                    # All Q4 2024 files in one directory
│   │   ├── take1.mp4               # First render
│   │   ├── take2.mp4               # Second render (corrections)
│   │   ├── preview.mp4             # 30s teaser/YouTube Short
│   │   ├── audio.m4a               # Full earnings call audio
│   │   ├── transcript.json         # Full transcript with timestamps
│   │   ├── transcript.vtt          # Video captions (WebVTT)
│   │   ├── transcript.srt          # Subtitles (SRT)
│   │   ├── insights.json           # GPT-4o extracted insights
│   │   ├── metadata.json           # YouTube/company metadata
│   │   ├── thumbnail.jpg           # Video thumbnail
│   │   ├── 10Q.pdf                 # SEC filing
│   │   └── earnings-release.pdf   # Press release
│   └── 2024-Q3/
│       └── ...
│
├── PLTR/
│   └── Q3-2025/
│       ├── take1.mp4
│       ├── take2.mp4
│       ├── insights.json
│       └── ...
│
├── MSFT/
│   └── 2024-Q4/
│
└── shared/                         # Shared assets across all companies
    └── logos/
        ├── AAPL.png
        ├── PLTR.png
        └── MSFT.png
```

**Key Principles:**
- ✅ **Flat structure** - All files for a quarter in ONE directory (no nested subdirs)
- ✅ Matches local `/var/earninglens/` structure
- ✅ Easy to backup entire quarter
- ✅ Simple to list/manage files
- ✅ Multiple render versions (take1, take2, take3...)
- ❌ NO chart images (charts rendered from database data)

### rclone Configuration

```bash
# Upload entire quarter directory
rclone copy /var/earninglens/AAPL/2024-Q4/ r2-public:earninglens/AAPL/2024-Q4/ -P

# Upload single file
rclone copy /var/earninglens/PLTR/Q3-2025/take2.mp4 r2-public:earninglens/PLTR/Q3-2025/take2.mp4 -P

# List quarter files
rclone ls r2-public:earninglens/PLTR/Q3-2025/

# List all companies
rclone lsd r2-public:earninglens/
```

---

## Charts: Data-Driven, Not Static Images

### Philosophy

**Store chart DATA in database, render charts dynamically on frontend**

```
Traditional (❌):                   EarningLens (✅):
─────────────────                   ─────────────────
1. Generate chart PNG               1. Store data in database (JSON)
2. Upload to R2                     2. Render chart client-side (Chart.js)
3. Display <img> tag                3. Charts are interactive (zoom, hover)
4. Static, not interactive          4. Can re-style without re-uploading
```

### Database Schema

```sql
CREATE TABLE earnings_data (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),

  -- All chart data as JSON
  financial_data JSONB NOT NULL

  -- Example:
  -- {
  --   "revenue": {
  --     "current": 89500000000,
  --     "segments": [
  --       {"name": "iPhone", "value": 43800000000},
  --       {"name": "Services", "value": 22300000000}
  --     ]
  --   },
  --   "eps": {"current": 1.64, "estimate": 1.58}
  -- }
);
```

### Chart Component

```tsx
'use client';

import {Bar} from 'react-chartjs-2';

export function RevenueChart({data}) {
  const chartData = {
    labels: data.revenue.segments.map(s => s.name),
    datasets: [{
      data: data.revenue.segments.map(s => s.value / 1e9),
      backgroundColor: ['#007AFF', '#5AC8FA', '#34C759'],
    }],
  };

  return <Bar data={chartData} options={chartOptions} />;
}
```

**Benefits:**
- ✅ Interactive charts (zoom, filter, hover tooltips)
- ✅ No image storage costs
- ✅ Re-style charts without re-uploading
- ✅ Export to PNG on-demand (for social sharing)

---

## ISR Optimization (Blog-Like Performance)

**EarningLens is a content site with 100+ video pages** → Use Next.js ISR for static performance

### Pre-render All Video Pages

```typescript
// app/[company]/[slug]/page.tsx

// Revalidate every hour
export const revalidate = 3600;

// Pre-render all video pages at build time
export async function generateStaticParams() {
  const videos = await db.videos.findMany({
    where: {status: 'published'},
    include: {company: true},
  });

  return videos.map((video) => ({
    company: video.company.ticker.toLowerCase(),
    slug: video.slug,
  }));
}

// This page is pre-rendered as static HTML
export default async function VideoPage({params}) {
  const video = await getVideo(params.slug);

  return (
    <div>
      <VideoEmbed youtubeId={video.youtube_id} />
      <ChartSection data={video.earnings_data} />
      <RelatedVideos videos={video.recommendations} />
    </div>
  );
}
```

**Result:**
- User visits `/aapl/q4-2024` → **instant load** (pre-rendered HTML)
- Page updates hourly (revalidates from database)
- Build time: ~5-10 minutes for 100 pages
- Page load: <500ms (served from CDN)

---

## Environment Variables

```bash
# Database
NEON_DATABASE_URL="postgresql://..."

# Better Auth
AUTH_SECRET="your-secret-key"
AUTH_GOOGLE_CLIENT_ID="..."
AUTH_GOOGLE_CLIENT_SECRET="..."
AUTH_GITHUB_CLIENT_ID="..."
AUTH_GITHUB_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# YouTube
YOUTUBE_API_KEY="..."
YOUTUBE_CLIENT_ID="..."
YOUTUBE_CLIENT_SECRET="..."
YOUTUBE_REFRESH_TOKEN="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://pub-{hash}.r2.dev"

# Rapid API (YouTube Download)
RAPID_API_KEY="..."

# Email
RESEND_API_KEY="..."

# Analytics
NEXT_PUBLIC_GA_ID="..."
```

---

## Database Schema (Neon PostgreSQL)

See `PRD.md` for complete schema. Key tables:

- `users` - User accounts (Better Auth managed)
- `organizations` - Organization/team structure
- `organization_members` - Org membership
- `companies` - Public companies (AAPL, MSFT, etc.)
- `videos` - YouTube videos + metadata
- `video_views` - View tracking
- `video_engagement` - User interactions
- `click_throughs` - YouTube → website traffic
- `subscriptions` - Stripe subscriptions
- `earnings_data` - Financial metrics

### Key Indexes
```sql
CREATE INDEX idx_video_views_timestamp ON video_views(timestamp);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_video_engagement_video_id ON video_engagement(video_id);
```

---

## Admin Dashboard Requirements

### Primary Monitor (NOT Email)
**URL:** `earninglens.com/admin`

**Design Principles:**
- **Mobile-first:** Optimized for phone viewing
- **One-glance:** All key metrics visible immediately
- **Real-time:** Poll every 30 seconds
- **Actionable:** Quick actions (hide video, edit metadata)

### Key Metrics to Display

**Top Section (Above the Fold):**
1. **Top Videos (24h)**
   - Video title
   - View count
   - Change % (vs. previous 24h)
   - Click-through count

2. **Click-through Correlation**
   - Video → Website clicks
   - Conversion rate
   - Top performing CTAs

3. **Today's Performance**
   - Total views
   - Watch time (hours)
   - New subscribers
   - Website visits
   - Conversions (free → paid)

4. **Revenue**
   - YouTube ads (daily)
   - Subscriptions (MRR)
   - Total 30-day revenue

**API Endpoint:**
```typescript
// GET /api/admin/stats
{
  topVideos: [
    {id, title, youtube_id, views, change_percent, click_throughs}
  ],
  clickThroughs: [
    {video_id, title, views, clicks, ctr}
  ],
  todayStats: {
    total_views, watch_hours, new_subscribers, website_visits, conversions
  },
  revenue: {
    youtube_ads_daily, mrr, total_30d
  }
}
```

### Mobile Responsiveness
```tsx
// Example: Mobile-first stats card
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    title="Total Views"
    value="42.3K"
    change="+15%"
    icon={<EyeIcon />}
  />
  {/* More cards... */}
</div>
```

---

## YouTube Integration Details

### Video Upload Pipeline

```typescript
// Automated upload workflow
async function uploadEarningsVideo(videoData) {
  // 1. Render video with Remotion (on GPU machine)
  const renderedPath = await renderVideo(videoData);

  // 2. Upload to R2 (backup)
  const r2Url = await uploadToR2(renderedPath);

  // 3. Generate optimized metadata
  const metadata = generateSEOMetadata(videoData);

  // 4. Upload to YouTube
  const {videoId} = await uploadToYouTube({
    filePath: renderedPath,
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
  });

  // 5. Set custom thumbnail
  const thumbnailPath = await generateThumbnail(videoData);
  await setYouTubeThumbnail(videoId, thumbnailPath);

  // 6. Save to database
  await db.videos.create({
    youtube_id: videoId,
    r2_url: r2Url,
    ...videoData,
  });

  return {videoId, r2Url};
}
```

### SEO Metadata Optimization

```typescript
function generateSEOMetadata({company, ticker, quarter, year}) {
  return {
    title: `${company} (${ticker}) ${quarter} ${year} Earnings Call - Visual Summary | EarningLens`,
    description: `
${company} (${ticker}) ${quarter} ${year} earnings call with visual charts, transcripts, and financial analysis.

📊 Key Metrics:
- Revenue: [Auto-filled]
- EPS: [Auto-filled]
- Guidance: [Auto-filled]

🔗 Full interactive analysis: https://earninglens.com/${ticker.toLowerCase()}/${quarter.toLowerCase()}-${year}

Subscribe for more earnings call visualizations!

#${ticker} #earnings #investing #stocks #finance #${company.replace(/\s/g, '')}
    `.trim(),
    tags: [
      ticker,
      company,
      'earnings call',
      'earnings',
      'investing',
      'stocks',
      'finance',
      quarter,
      year.toString(),
      'earnings analysis',
      'stock market',
      'quarterly earnings',
    ],
  };
}
```

### Analytics Fetching

```typescript
// Fetch YouTube analytics via API
async function fetchVideoAnalytics(videoId: string) {
  const youtube = getYouTubeClient();

  const [statsResponse, analyticsResponse] = await Promise.all([
    youtube.videos.list({
      part: ['statistics', 'contentDetails'],
      id: [videoId],
    }),
    // YouTube Analytics API for detailed metrics
    youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2024-01-01',
      endDate: 'today',
      metrics: 'views,estimatedMinutesWatched,likes,comments',
      dimensions: 'video',
      filters: `video==${videoId}`,
    }),
  ]);

  return {
    views: parseInt(statsResponse.data.items[0].statistics.viewCount),
    watchTime: analyticsResponse.data.rows[0][1], // minutes
    likes: parseInt(statsResponse.data.items[0].statistics.likeCount),
    comments: parseInt(statsResponse.data.items[0].statistics.commentCount),
  };
}
```

---

## Remotion Video Composition Guide

### Base Template Structure

```typescript
// src/remotion/EarningsVideo/index.tsx

export const EarningsVideo: React.FC<EarningsVideoProps> = ({
  company,
  ticker,
  quarter,
  year,
  audioUrl,
  logoUrl,
  transcript,
  charts,
  financialData,
}) => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill className="bg-gradient-to-br from-blue-900 to-black">
      {/* 1. Title Card (0-5s) */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <TitleCard company={company} ticker={ticker} quarter={quarter} year={year} />
      </Sequence>

      {/* 2. Key Metrics Overview (5-15s) */}
      <Sequence from={fps * 5} durationInFrames={fps * 10}>
        <MetricsOverview data={financialData} />
      </Sequence>

      {/* 3. Chart Sequences (15s+) */}
      {charts.map((chart, i) => (
        <Sequence
          key={i}
          from={chart.startTime * fps}
          durationInFrames={chart.duration * fps}
        >
          <ChartSequence chart={chart} />
        </Sequence>
      ))}

      {/* 4. Transcript Overlay (entire video) */}
      <TranscriptOverlay transcript={transcript} />

      {/* 5. Audio Track */}
      <Audio src={audioUrl} />

      {/* 6. Logo Watermark */}
      <div className="absolute top-8 left-8">
        <Img src={logoUrl} className="w-24 h-24 rounded-xl" />
      </div>
    </AbsoluteFill>
  );
};
```

### GPU Rendering Configuration

```typescript
// remotion.config.ts

import {Config} from '@remotion/cli/config';

// GPU acceleration for H.264 encoding
Config.setVideoCodec('h264');
Config.setCrf(18); // Visually lossless quality

// Use 50% of CPU cores for parallel processing
Config.setConcurrency('50%');

// Output format
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p'); // YouTube-compatible

// Override webpack for custom fonts/assets
Config.overrideWebpackConfig((config) => {
  // Add custom loaders if needed
  return config;
});
```

### Batch Rendering Script

```bash
#!/bin/bash
# scripts/batch-render.sh

# Companies to render
companies=(
  "AAPL:Apple:Q4:2024"
  "MSFT:Microsoft:Q4:2024"
  "GOOGL:Alphabet:Q4:2024"
  "TSLA:Tesla:Q4:2024"
  "AMZN:Amazon:Q4:2024"
)

for company in "${companies[@]}"; do
  IFS=':' read -r ticker name quarter year <<< "$company"

  echo "Rendering $name ($ticker) $quarter $year..."

  # Render video
  npx remotion render \
    src/remotion/index.ts \
    EarningsVideo \
    out/${ticker}-${quarter}-${year}.mp4 \
    --props="{\"ticker\":\"$ticker\",\"company\":\"$name\",\"quarter\":\"$quarter\",\"year\":$year}"

  # Upload to R2
  rclone copy out/${ticker}-${quarter}-${year}.mp4 \
    r2-public:videotobe-public/earnings-videos/ -P

  echo "✓ $ticker completed"
done

echo "All videos rendered and uploaded!"
```

---

## User Experience Requirements

### Landing Page ("Show, Don't Tell")

**Design Principles:**
- ❌ No marketing copy, no long paragraphs
- ✅ Data visualizations immediately visible
- ✅ Interactive earnings dashboard
- ✅ Auto-playing video preview
- ✅ Engage users with data, not words

**Layout:**
```tsx
<main>
  {/* Hero: Interactive Earnings Grid */}
  <section className="h-screen">
    <EarningsGrid companies={featuredCompanies} />
  </section>

  {/* Featured Video (auto-play) */}
  <section className="h-screen">
    <FeaturedVideoPlayer videoId="latest" autoPlay muted />
  </section>

  {/* Live Dashboard */}
  <section className="h-screen">
    <LiveEarningsDashboard />
  </section>

  {/* No text-heavy sections! */}
</main>
```

### Free Tier Restrictions

**Trigger login prompts at:**
1. **50% video progress** → "Login to watch the full earnings call"
2. **Chart interaction** → "Login to interact with financial data"
3. **Quarterly report link click** → "Login to access reports"

**Partial View Strategy:**
```typescript
function VideoPlayer({videoId, user}) {
  const [progress, setProgress] = useState(0);
  const isFreeUser = !user || user.tier === 'free';

  useEffect(() => {
    if (isFreeUser && progress >= 0.5) {
      pauseVideo();
      showLoginModal();
    }
  }, [progress, isFreeUser]);

  // ...
}
```

### Logged-in Experience

**Free Users:**
- Watch up to 50% of video
- View partial charts (no zoom/filter)
- Limited quarterly report access (summary only)

**Pro Users ($29/month):**
- Unlimited video access
- Full interactive charts
- Download transcripts
- Email alerts for earnings dates
- Priority support

**Team Users ($99/month):**
- All Pro features
- Up to 10 team members
- Shared watchlists
- Custom alerts
- API access

---

## Personalization Engine

### Recommendation Algorithm

**Inputs:**
- Watch history (companies, industries)
- Engagement (likes, saves, shares)
- Watch time per video
- Chart interactions
- Industry preferences (explicit + inferred)

**Recommendation Types:**

1. **Related Earnings** (same industry)
   ```sql
   SELECT v.* FROM videos v
   JOIN companies c ON v.company_id = c.id
   WHERE c.industry = $user_preferred_industry
   AND v.id NOT IN (SELECT video_id FROM user_watch_history WHERE user_id = $user_id)
   ORDER BY v.published_at DESC
   LIMIT 10
   ```

2. **Trending Now** (high engagement)
   ```sql
   SELECT v.*, COUNT(ve.id) as engagement_score
   FROM videos v
   JOIN video_engagement ve ON v.id = ve.video_id
   WHERE ve.timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY v.id
   ORDER BY engagement_score DESC
   LIMIT 10
   ```

3. **Companies You Might Like** (similar performance)
   - Use collaborative filtering
   - "Users who watched AAPL also watched..."

4. **Upcoming Earnings** (calendar-based)
   - Fetch from earnings calendar API
   - Notify users 1 day before

---

## SEO Strategy

### YouTube SEO

**Title Format:**
```
[Company Name] ([TICKER]) [Quarter] [Year] Earnings Call - Visual Summary | EarningLens
```

**Description Template:**
```
[Company] earnings call with visual charts, transcripts, and financial analysis.

📊 Key Metrics:
- Revenue: $X.XX billion (±X%)
- EPS: $X.XX (±X%)
- Guidance: [Summary]

🔗 Full interactive analysis: https://earninglens.com/[ticker]/[quarter]-[year]

Timestamps:
0:00 Intro
0:30 Revenue Overview
1:15 EPS Analysis
2:00 Guidance
3:00 Q&A Highlights

Subscribe for more earnings visualizations!

#[ticker] #earnings #investing #stocks
```

**Tags:**
- Primary: ticker, company name, "earnings call"
- Secondary: quarter, year, "investing", "stocks", "finance"
- Long-tail: "earnings analysis", "quarterly earnings", "stock market"

### Website SEO

**Dynamic Meta Tags:**
```tsx
// app/[company]/[videoSlug]/page.tsx

export async function generateMetadata({params}) {
  const video = await getVideo(params.videoSlug);

  return {
    title: `${video.company} (${video.ticker}) ${video.quarter} ${video.year} Earnings | EarningLens`,
    description: `Watch ${video.company} earnings call with interactive charts and financial data analysis.`,
    openGraph: {
      title: video.title,
      description: video.description,
      images: [video.thumbnail_url],
      type: 'video.other',
    },
  };
}
```

**Structured Data (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Apple (AAPL) Q4 2024 Earnings Call",
  "description": "Visual earnings call analysis with charts and data",
  "thumbnailUrl": "https://...",
  "uploadDate": "2024-11-01",
  "duration": "PT10M30S",
  "contentUrl": "https://youtube.com/watch?v=...",
  "embedUrl": "https://youtube.com/embed/..."
}
```

---

## Monitoring & Logging

### Events to Track

**User Events:**
- `page_view` (page, referrer)
- `video_play` (video_id, source)
- `video_progress` (video_id, progress %)
- `video_complete` (video_id, watch_time)
- `chart_interact` (video_id, chart_type, action)
- `click_through` (video_id, destination)
- `signup` (source, plan)
- `subscription_created` (plan, amount)

**System Events:**
- `video_rendered` (video_id, duration, errors)
- `video_uploaded` (video_id, youtube_id)
- `analytics_synced` (video_id, views, watch_time)

### Logging Implementation

```typescript
// lib/analytics.ts

export async function trackEvent(event: {
  event_type: string;
  user_id?: string;
  video_id?: string;
  metadata?: Record<string, any>;
}) {
  await db.events.create({
    ...event,
    timestamp: new Date(),
  });

  // Also send to analytics platform (PostHog, Mixpanel, etc.)
  if (process.env.POSTHOG_API_KEY) {
    posthog.capture(event);
  }
}

// Usage
trackEvent({
  event_type: 'video_play',
  user_id: user.id,
  video_id: video.id,
  metadata: {source: 'homepage'},
});
```

---

## Authentication: Google One Tap (No Explicit Sign-in)

### What is Google One Tap?

**Traditional OAuth (❌):**
```
User clicks "Sign in with Google"
  → Redirects to google.com
  → User logs in
  → Redirects back to app
  → User is logged in
```

**Google One Tap (✅):**
```
User visits site
  → Small popup appears automatically
  → User clicks once
  → Instantly signed in (no redirect)
```

### Implementation with Better Auth

#### 1. Configure Google OAuth

```typescript
// backend/src/lib/auth.ts

import {betterAuth} from 'better-auth';
import {google} from 'better-auth/providers';

export const auth = betterAuth({
  database: {
    provider: 'postgres',
    url: process.env.DATABASE_URL,
  },
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Enable One Tap
      oneTap: true,
    },
  },
  // Organization plugin for team structure
  plugins: [
    organizationPlugin(),
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    }),
  ],
});
```

#### 2. Frontend: Auto-display One Tap Prompt

```tsx
// frontend/src/components/auth/GoogleOneTap.tsx

'use client';

import {useEffect} from 'react';
import Script from 'next/script';

export function GoogleOneTap() {
  useEffect(() => {
    // Initialize Google One Tap
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true, // Auto-select if user previously signed in
        cancel_on_tap_outside: false,
      });

      // Display the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        }
      });
    }
  }, []);

  async function handleCredentialResponse(response) {
    // Send credential to backend
    const res = await fetch('/api/auth/google-one-tap', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({credential: response.credential}),
    });

    if (res.ok) {
      // User is now signed in
      window.location.reload();
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div id="g_id_onload" />
    </>
  );
}
```

#### 3. Add to Layout (Shows on Every Page)

```tsx
// frontend/src/app/layout.tsx

import {GoogleOneTap} from '@/components/auth/GoogleOneTap';
import {auth} from '@/lib/auth-client';

export default async function RootLayout({children}) {
  const session = await auth.getSession();

  return (
    <html>
      <body>
        {/* Only show One Tap if user is NOT logged in */}
        {!session && <GoogleOneTap />}

        {children}
      </body>
    </html>
  );
}
```

#### 4. Backend: Handle One Tap Credential

```typescript
// backend/src/api/auth/google-one-tap.ts

import {OAuth2Client} from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  const {credential} = await req.json();

  // Verify the Google credential
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    return Response.json({error: 'Invalid credential'}, {status: 400});
  }

  // Find or create user
  let user = await db.users.findUnique({
    where: {email: payload.email},
  });

  if (!user) {
    user = await db.users.create({
      data: {
        email: payload.email!,
        name: payload.name!,
        avatar_url: payload.picture,
      },
    });
  }

  // Create session with Better Auth
  const session = await auth.createSession({userId: user.id});

  return Response.json({
    success: true,
    session,
  });
}
```

### User Experience Flow

**First Visit (Not Logged In):**
```
1. User lands on earninglens.com
2. Google One Tap popup appears in corner
   ┌──────────────────────────────┐
   │ Sign in with Google          │
   │                              │
   │ [john@gmail.com]       [→]  │
   │                              │
   │ Continue as John             │
   └──────────────────────────────┘
3. User clicks "Continue as John"
4. Instantly signed in (no redirect)
5. Popup disappears
```

**Subsequent Visits:**
```
1. User returns to earninglens.com
2. If auto_select: true, automatically signed in
3. No popup shown (seamless)
```

**When User Hits Paywall:**
```
User at 50% video progress → Login required

If already signed in via One Tap:
  → Show upgrade to Pro prompt

If NOT signed in:
  → Show One Tap popup again (contextual)
  → "Sign in to continue watching"
```

### Configuration Options

```typescript
window.google.accounts.id.initialize({
  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

  // Auto-select user if they previously signed in
  auto_select: true,

  // Don't close on outside click (less annoying)
  cancel_on_tap_outside: false,

  // Show on specific pages only
  context: 'signin', // or 'signup', 'use'

  // Customize prompt
  prompt_parent_id: 'g_id_onload',

  // Styling
  theme: 'outline', // or 'filled_blue', 'filled_black'
  size: 'large', // or 'medium', 'small'
});
```

### Best Practices

**1. Don't Show Too Early**
```typescript
// Wait until user scrolls or interacts
useEffect(() => {
  const showOneTap = () => {
    window.google.accounts.id.prompt();
  };

  // Show after 3 seconds OR on scroll
  const timer = setTimeout(showOneTap, 3000);
  const handleScroll = () => {
    showOneTap();
    window.removeEventListener('scroll', handleScroll);
  };

  window.addEventListener('scroll', handleScroll, {once: true});

  return () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

**2. Contextual Prompts**
```typescript
// Show at strategic moments
// - Before 50% video progress
// - Before clicking external link
// - Before downloading content

if (videoProgress > 0.4 && !user) {
  showGoogleOneTap();
}
```

**3. Respect User Dismissal**
```typescript
// Don't show again if user closes it
const dismissed = localStorage.getItem('oneTapDismissed');

if (!dismissed) {
  window.google.accounts.id.prompt((notification) => {
    if (notification.getDismissedReason() === 'credential_returned') {
      // User signed in
    } else {
      // User dismissed
      localStorage.setItem('oneTapDismissed', 'true');
    }
  });
}
```

### Environment Variables

```bash
# Google OAuth (for One Tap)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Backend
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

### Testing One Tap

**Chrome DevTools:**
```
1. Open DevTools → Application → Cookies
2. Delete all cookies for localhost:3000
3. Refresh page
4. One Tap should appear
```

**Test Auto-Select:**
```
1. Sign in once via One Tap
2. Sign out
3. Refresh page
4. Should auto-sign in (if auto_select: true)
```

---

## Best Practices

### Code Style
- Use TypeScript strict mode
- Validate all inputs with Zod
- Use TailwindCSS utility classes (avoid custom CSS)
- Component composition over configuration
- Server components by default (Next.js)

### Performance
- Use `OffthreadVideo` in Remotion (faster rendering)
- Optimize images (next/image)
- Lazy load charts and heavy components
- Cache YouTube API responses (60s TTL)
- Use React Server Components for static content

### Security
- Never expose API keys in client code
- Validate all API inputs with Zod
- Use Better Auth session management
- Implement CSRF protection
- Rate limit API endpoints

### Database
- Use indexes for all foreign keys
- Implement connection pooling (Neon handles this)
- Monitor query performance
- Use prepared statements (prevent SQL injection)
- Regular backups (Neon auto-backups)

---

## Troubleshooting

### Common Issues

**Neon Database Connection:**
```bash
# Check connection string format
postgresql://user:password@host/database?sslmode=require

# Test connection
psql $NEON_DATABASE_URL
```

**YouTube API Quota Exceeded:**
- Implement caching (60s for analytics)
- Batch operations where possible
- Use YouTube Analytics API (separate quota)
- Request quota increase from Google

**R2 Upload Failures:**
```bash
# Test rclone connection
rclone ls r2-public:videotobe-public

# Check credentials in rclone.conf
rclone config show r2-public
```

**Video Rendering Slow:**
- Ensure GPU is being used (`nvidia-smi`)
- Reduce `setConcurrency()` if overheating
- Optimize video assets (compress images)
- Use `OffthreadVideo` for video clips

---

## Next Steps

1. **Initialize Next.js project**
2. **Set up Neon database**
3. **Copy VideotoBe utilities**
4. **Configure Better Auth + Stripe**
5. **Create first Remotion composition**
6. **Render and upload first video**
7. **Deploy landing page**
8. **Launch admin dashboard**
9. **Scale to 100 videos**

See `PRD.md` for detailed phase-by-phase roadmap.

---

**Last Updated:** November 3, 2025
**Owner:** Meera
**Status:** Ready for Development
- use postgresql drizzle orm - avoid using neon related packages.
- To download youtube video source .venv/bin/activate & python scripts/download-youtube.py <video-id>
- content on web site should be SEO optimized - Display headline, intro paragraph, meta description
Show enough content for SEO indexing
Add sign-in some point in time to encourage user- sign. Blurr some part of webpage.