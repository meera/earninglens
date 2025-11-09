# EarningsHawk

**Transform earnings calls into visually-enhanced YouTube videos.**

## 🎯 **YOUTUBE FIRST!**

**Primary Goal:** Enable YouTube monetization (1000 subs + 4000 watch hours)

**Timeline:** 6-8 weeks

**Revenue:** $500-2,000/month from YouTube ads

**Website comes  along the way** 

---

## Quick Start

### Generate First Video (START HERE)

**⚠️ IMPORTANT:** We use **full earnings call audio** (30-60 min) with visual overlays, not summary videos.

**Full guide:** See [studio/AUDIO-VIDEO-GUIDE.md](studio/AUDIO-VIDEO-GUIDE.md)

```bash
# 1. Download earnings call audio (YouTube or Apple IR)
yt-dlp -f 'bestaudio[ext=m4a]' -o 'studio/public/audio/AAPL-Q4-2024.m4a' 'YOUTUBE_URL'

# 2. Create transcript with speaker timing (use your speaker diarization tech)
# Output: transcript with who spoke when

# 3. Download speaker photos (Tim Cook, Luca Maestri, etc.)
curl -o studio/public/speakers/tim-cook.jpg "APPLE_LEADERSHIP_URL"

# 4. Install dependencies
cd studio
npm install

# 5. Update data JSON with transcript and timing
# Edit: studio/data/AAPL-Q4-2024-FULL.json

# 6. Preview video (opens Remotion Studio)
npm start

# 7. Render full audio video (30-60 min)
npm run render:aapl:full
# Output: studio/out/AAPL-Q4-2024-full.mp4

# 8. Upload to R2
cd ..
node scripts/upload-to-r2.js --ticker=AAPL --quarter=Q4 --year=2024

# 9. Upload to YouTube (60-min enhanced earnings call)
open studio/out/AAPL-Q4-2024-full.mp4
```

### YouTube Growth Strategy
```bash
# Read the complete 6-week strategy
cat YOUTUBE-FIRST-STRATEGY.md
```

---

## Project Structure

```
earninglens/
├── web/               # User-facing website (earninglens.com)
├── api/               # Backend API server
├── dashboard/         # Admin interface (admin.earninglens.com)
├── studio/            # Video production (Remotion)
├── insights/          # Analytics & data pipeline
├── shared/            # Shared code (types, utils, database)
├── scripts/           # Automation scripts
└── docs/              # This documentation
```

---

## Documentation

### Core Documents

| Document | Purpose | Priority |
|----------|---------|----------|
| **[CLAUDE.md](CLAUDE.md)** | Governing principles & trust | ⚠️ **READ FIRST** |
| **[APPROACH-UPDATE.md](APPROACH-UPDATE.md)** | Key changes to video approach | 🚀 **READ SECOND** |
| **[studio/AUDIO-VIDEO-GUIDE.md](studio/AUDIO-VIDEO-GUIDE.md)** | Full audio video production | 🎬 **START HERE** |
| **[YOUTUBE-FIRST-STRATEGY.md](YOUTUBE-FIRST-STRATEGY.md)** | 6-week plan to hit monetization | 🔥 Strategy |
| **[YOUTUBE-SHORTS-STRATEGY.md](YOUTUBE-SHORTS-STRATEGY.md)** | Traffic driver with Shorts | 📱 Traffic |
| **[QUICKSTART.md](QUICKSTART.md)** | Summary video guide (50s) | 🎥 Alternative |
| **[PRD.md](PRD.md)** | Complete product requirements | 📋 Reference |
| **[TESTING-INFRASTRUCTURE.md](TESTING-INFRASTRUCTURE.md)** | Testing strategy | 🧪 Later |
| **[MONOREPO-STRUCTURE.md](MONOREPO-STRUCTURE.md)** | Project organization | 📁 Later |
| **README.md** | This file | 📖 Overview |

---

## MVP Strategy

### Phase 0: Launch Fast (Day 1)
```
1. Point to existing YouTube earnings videos (50 videos)
   ↓
2. Launch website with "WOW factor" (lots of content)
   ↓
3. Generate FIRST custom video (Apple Q4 2024)
   ↓
4. Replace 1 video per day
   ↓
5. All 50 videos custom by Month 1
```

**Why:** Prove concept before rendering 100 videos. Get feedback early.

---

## Tech Stack

### Frontend (web/)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** TailwindCSS
- **Auth:** Better Auth (Google One Tap)
- **Charts:** Chart.js (rendered from database data)
- **Deployment:** Vercel

### Backend (api/)
- **Runtime:** Node.js + Express/Fastify
- **Database:** Neon PostgreSQL (serverless)
- **Storage:** Cloudflare R2 (`earninglens` bucket)
- **APIs:** YouTube Data API, Exa.ai, Stripe
- **Deployment:** Railway or AWS ECS

### Video Production (studio/)
- **Framework:** Remotion 4.0+
- **Rendering:** GPU machine (local)
- **Format:** H.264 MP4, 1080p, 30fps
- **Deployment:** Background workers

### Admin (dashboard/)
- **Framework:** Next.js 14+
- **Purpose:** Mobile-first admin interface
- **Features:** Real-time analytics, video management
- **Deployment:** Vercel (admin.earninglens.com)

### Analytics (insights/)
- **Runtime:** Node.js background jobs
- **Purpose:** ETL, recommendations, YouTube sync
- **Scheduling:** Cron jobs
- **Deployment:** Railway workers

---

## Key Features

### 1. Google One Tap Authentication
**No explicit sign-in page** - Users authenticate as they browse

```tsx
// Auto-display on every page
<GoogleOneTap />

// User clicks once → instantly signed in
```

### 2. 50% Video Paywall
**Implementation:**
```typescript
if (videoProgress >= 0.5 && !user) {
  pauseVideo();
  showGoogleOneTap({
    message: "Sign in to continue watching"
  });
}
```

### 3. Data-Driven Charts
**Store chart DATA, not images:**
```sql
-- Database stores JSON
financial_data JSONB NOT NULL

-- Frontend renders interactive charts
<RevenueChart data={video.earnings_data} />
```

### 4. ISR Pre-rendering
**100+ video pages pre-rendered as static HTML:**
```typescript
export const revalidate = 3600; // Revalidate hourly

export async function generateStaticParams() {
  // Pre-render all video pages at build time
  return videos.map(v => ({slug: v.slug}));
}
```

---

## R2 Bucket Organization

**Bucket:** `earninglens` (separate from videotobe)

```
r2:earninglens/
├── AAPL/
│   ├── videos/
│   │   └── 2024-Q4-full.mp4
│   ├── audio/
│   │   └── 2024-Q4-full-call.m4a
│   ├── transcripts/
│   │   └── 2024-Q4.json
│   └── reports/
│       └── 2024-Q4-10Q.pdf
├── MSFT/
└── shared/
    └── logos/
```

**Key Principle:** Collocate by company (all AAPL assets under `AAPL/`)

---

## Data Seeding with Exa.ai

**Use Exa.ai to bootstrap 50+ videos:**

```typescript
const exa = new Exa(process.env.EXA_API_KEY);

// Find earnings transcript
const results = await exa.searchAndContents(
  `Apple Q4 2024 earnings call transcript`,
  {type: "auto", num_results: 1, text: true}
);

// Extract financial data
const financials = await exa.searchAndContents(
  `AAPL Q4 2024 revenue EPS earnings`,
  {
    highlights: {
      query: "revenue EPS guidance",
      highlights_per_url: 5
    }
  }
);
```

**Cost:** ~$2 for initial 50 companies (one-time)

---

## Monetization

### Free Tier (Not Logged In)
- Watch 50% of any video
- Basic charts (no interactivity)

### Free Tier (Logged In)
- Watch 3 full videos/month
- Basic chart interactions
- Save to watchlist

### Pro Tier ($29/month)
- Unlimited videos
- Full interactive charts
- Download transcripts
- API access (100 req/day)

### Team Tier ($99/month)
- All Pro features
- 10 team members
- Shared watchlists
- API access (1000 req/day)

---

## First Impression: "WOW Factor"

**Goal:** User thinks "Holy shit, there's so much here!"

**What They See:**
```
┌────────────────────────────────────────┐
│  Latest Earnings                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ AAPL │ │ MSFT │ │GOOGL│ │ TSLA │ │
│  │ +12% │ │ +8%  │ │+15% │ │ -3%  │ │
│  │89.5B │ │62.0B │ │86.3B│ │25.2B │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                                        │
│  🔥 Trending Now                       │
│  📊 50+ earnings calls analyzed        │
│  👁️  125,000 total views               │
└────────────────────────────────────────┘
```

**NOT:**
- Empty landing page
- "Coming soon" messages
- Generic marketing copy

---

## Testing

**Run before every deploy:**
```bash
# Full test suite
npm run test:all

# Change report (what's affected?)
npm run change-report

# Pre-deploy checks
npm run pre-deploy
```

**What You'll Know:**
- ✅ Which files changed
- ✅ Which video pages affected
- ✅ Test coverage (unit, integration, E2E)
- ✅ Visual changes (screenshot diffs)
- ✅ Performance metrics
- ✅ Data integrity validation

---

## Deployment

### Separate Deployments
```
web/        → Vercel (earninglens.com)
dashboard/  → Vercel (admin.earninglens.com)
api/        → Railway (api.earninglens.com)
studio/     → GPU machine (local rendering)
insights/   → Railway (background workers)
```

### CI/CD
```yaml
# GitHub Actions
on: push
jobs:
  test → build → deploy (only if tests pass)
```

---

## Timeline (YouTube-First)

### Day 1 (Today)
- [x] Documentation complete
- [x] Video pipeline built (Remotion + R2 + scripts)
- [x] Full audio video composition created
- [ ] Download Apple Q4 2024 earnings call audio
- [ ] Create transcript with speaker timing
- [ ] Render FIRST full video (Apple Q4 2024) ← **DO THIS NOW**
- [ ] Upload to YouTube
- [ ] Create YouTube channel description

### Week 1: Foundation (3 videos)
- [ ] Upload Monday: AAPL
- [ ] Upload Wednesday: MSFT
- [ ] Upload Friday: GOOGL
- [ ] Nail thumbnail design
- [ ] Perfect video template

### Week 2: Ramp Up (5 videos)
- [ ] Upload Mon-Fri: AMZN, META, NVDA, TSLA, NFLX
- [ ] Share on X/Twitter daily
- [ ] Post in r/stocks, r/investing
- **Goal:** 50-100 subscribers

### Weeks 3-4: Scale (7 videos/week)
- [ ] Cover top banks, consumer, healthcare
- [ ] Daily X/Twitter engagement
- [ ] LinkedIn posts
- **Goal:** 300-500 subscribers

### Weeks 5-6: Push for Monetization (10 videos/week)
- [ ] Aggressive upload schedule
- [ ] Daily promotion
- [ ] Engage with FinTwit
- **Goal:** 1,000 subscribers ✅

### Week 8: Monetization Enabled
- [ ] Hit 4,000 watch hours ✅
- [ ] Enable YouTube Partner Program
- [ ] Connect AdSense
- **Revenue:** $500-2,000/month

### Month 3+: Website (Optional)
- [ ] Simple landing page (portfolio)
- [ ] Email capture
- [ ] Later: Add subscriptions

---

## Environment Variables

```bash
# Database
NEON_DATABASE_URL="postgresql://..."

# Google OAuth (One Tap)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# YouTube API
YOUTUBE_API_KEY="xxx"
YOUTUBE_CLIENT_ID="xxx"
YOUTUBE_CLIENT_SECRET="xxx"

# Cloudflare R2
R2_BUCKET_NAME="earninglens"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"

# Exa.ai
EXA_API_KEY="xxx"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

---

## Next Steps

**1. Start Here:**
```bash
# Read the first video guide
cat FIRST-VIDEO-GUIDE.md

# Or jump straight to rendering
cd studio
npm run render -- --ticker=AAPL --quarter=Q4 --year=2024
```

**2. Join Community:**
- Share on FinTwit (target audience)
- Get feedback from financial Twitter users
- Iterate based on engagement

**3. Scale:**
- 1 video per day
- Replace all 50 videos in a month
- Hit 1000 YouTube subscribers

---

**Built with:** Next.js, Remotion, Neon, Cloudflare R2, Better Auth, Stripe

**License:** Proprietary

**Contact:** [Your contact info]
