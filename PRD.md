# EarningLens - Product Requirements Document (PRD)

## Executive Summary

**Product:** EarningLens
**Vision:** Transform earnings call audio into visually-enhanced, data-rich YouTube videos with an interactive web platform
**Goal:** Build a monetizable SaaS platform via YouTube channel + website subscriptions
**Timeline:** MVP in 1-2 days, 100 videos in 2 weeks, full platform in 4-6 weeks

---

## Recent Updates (November 2025)

### 1. Updated Pricing Model
- **Pro Tier:** $29.99 per seat/month (updated from $29/month)
- **Team Tier:** $29.99 per seat/month (billed per seat, not flat $99/month)
- **Free Tier:** Limited to 3 videos total (not per month) before paywall

### 2. New Custom Video Request Service
Added revenue stream for custom video production:
- **Standard Service ($299):** 2 revisions, 5-7 day delivery
- **Premium Service ($699):** Unlimited revisions, 3-5 day delivery
- Users can upload video, provide YouTube URL, or request AI-generated content
- Potential $10K+/month additional revenue at scale

### 3. Entity Relationship Mapping (Key Differentiator)
Built-in knowledge graph that surfaces cross-company relationships:
- Track product mentions across companies (e.g., "Vision Pro" in Apple + Meta earnings)
- Cross-reference SEC filings, earnings calls, and company websites
- Show competitive dynamics and industry trends
- **This is our competitive moat vs. YouTube**

### 4. Revenue Model Update
**Month 12 Target: $26,500/month**
- YouTube ads: $1,500/month
- Subscriptions: $15,000 MRR (500 seats × $29.99)
- Custom videos: $10,000/month (20 requests/month)

---

## Product Vision

### The Problem
- Earnings calls are audio-only and difficult to consume
- Lack of visual context (charts, graphs, financial data)
- No easy way to explore referenced quarterly reports
- Poor discoverability and engagement

### The Solution
EarningLens creates:
1. **Visually-rich YouTube videos** with:
   - Transcripts overlaid on video
   - Charts, graphs, and dashboards
   - Supplemental financial data
   - Dynamic visuals that sync with audio

2. **Interactive web platform** with:
   - Embedded videos with clickable timestamps
   - Links that update as video plays
   - Quarterly report references
   - Personalized recommendations
   - Analytics dashboard

### Monetization Strategy

**YOUTUBE FIRST!**

1. **Phase 1 (Weeks 1-6): YouTube Monetization**
   - Hit 1000 subscribers
   - Hit 4000 watch hours
   - Enable YouTube ad revenue
   - **Focus:** Video quality, SEO, upload consistency

2. **Phase 2 (Month 2+): Website Traffic**
   - Drive YouTube viewers to website
   - Build email list
   - Establish brand beyond YouTube

3. **Phase 3 (Month 3+): Website Subscriptions**
   - Launch freemium model
   - Offer premium features
   - Diversify revenue

**Why YouTube First:**
- ✅ Faster to monetize (YouTube pays you)
- ✅ Built-in distribution (YouTube algorithm)
- ✅ Validates content quality (watch time = good content)
- ✅ Builds audience before asking for subscriptions
- ✅ YouTube drives website traffic (not vice versa)

### First Impression: "WOW Factor"

**Goal:** User lands on site and thinks "Holy shit, there's so much here!"

**What They See Immediately:**
- **50+ earnings videos** already available (seed with Exa.ai data)
- **Live trending dashboard** showing what's hot right now
- **Interactive earnings grid** with real financial metrics
- **Auto-playing preview** of latest earnings call
- **Social proof** (X,XXX views, XXX hours watched)
- **Rich visualizations** (charts updating, stock tickers scrolling)
- **FinTwit vibe** (dark mode, data-heavy, minimal fluff)

**NOT:**
- Empty landing page
- "Coming soon" messages
- Generic marketing copy
- Boring static content

**Seed Data Source: Exa.ai**
- Fetch 50+ recent earnings call transcripts
- Get financial data for FAANG + top 50 companies
- Pull competitor comparisons
- Extract key metrics and highlights

---

## Technical Architecture

### Technology Stack

**Frontend:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Authentication:** Better Auth with organization/team support - Google One Tap
- **Payment:** Stripe (via Better Auth Stripe plugin)
- **UI Components:** shadcn/ui or custom

**Backend:**
- **Database:** Neon PostgreSQL (serverless)
- **Storage:** Cloudflare R2 (videos, assets)
- **Video Generation:** Remotion 4.0+ (programmatic videos)
- **APIs:**
  - YouTube Data API v3 (analytics, upload, metadata)
  - Rapid API (YouTube video download)
  - Stripe API (subscriptions)

**Infrastructure:**
- **Hosting:** Vercel (Next.js)
- **Video Rendering:** GPU machine (local) or Remotion Lambda (scale)
- **Monitoring:** Custom admin dashboard (not email-based)

### Code Reuse from VideotoBe Platform

**Location:** `~/videotobe/platform`

**Reusable Components:**
1. ✅ YouTube API integration (download, upload, analytics)
2. ✅ Rapid API YouTube downloader
3. ✅ Better Auth setup (org/team structure - we can upgrade to use betterauth organization/ team)
4. ✅ Stripe integration (Better Auth plugin)
5. ✅ Admin dashboard components
6. ✅ R2 upload utilities
7. ✅ Database schema patterns
8. ✅ Authentication flows ( Google one tap authentication)

**To Be Built Fresh:**
1. Remotion video compositions (earnings-specific)
2. Earnings data pipeline
3. SEO-optimized landing pages
4. Mobile-first admin interface
5. Personalized recommendation engine
6. Web-ingestion ( this is very web heavy and large database as multiple companies, multiple recordings, multiple research. Lot of web resources change - need to maintain a cached copy. )

---

## Core Features

### 1. Video Generation Pipeline

**Hybrid Workflow: Automated Prep + Manual Composition**

The pipeline is split into automated asset preparation (Steps 1-5) and manual creative work (Step 6):

**Steps 1-5: Automated Asset Preparation**
```bash
# Run on GPU machine (sushi)
python lens/process_earnings.py --url "https://youtube.com/watch?v=..." --to insights
```

This produces:
1. **Download** - YouTube video via RapidAPI
2. **Parse** - Auto-detect company, ticker, quarter
3. **Remove Silence** - Trim initial silence from video
4. **Transcribe** - Whisper GPU transcription → JSON, SRT, VTT, TXT
5. **Extract Insights** - LLM analysis → key metrics, highlights

**Output Structure:**
```
/var/earninglens/
└── PLTR/
    └── Q3-2025/
        ├── input/
        │   └── source.mp4              # Trimmed audio (silence removed)
        ├── transcripts/
        │   ├── transcript.json         # Full Whisper output
        │   ├── transcript.srt          # Captions
        │   ├── transcript.vtt          # WebVTT
        │   ├── transcript.txt          # Plain text
        │   ├── paragraphs.json         # LLM-friendly format
        │   └── insights.json           # Extracted insights
        ├── composition/                # Generated composition scaffold
        │   ├── props.json              # Auto-generated props
        │   └── assets/                 # Company logo, charts, etc.
        ├── take1/                      # Multiple render versions
        │   ├── final.mp4
        │   └── thumbnail.jpg
        └── take2/
```

**Step 6: Manual Composition (Remotion Studio)**
```bash
# Open Remotion Studio
cd ~/earninglens
npm run remotion
```

**Creative Workflow:**
- Pipeline generates composition scaffold from template
- Each video gets custom composition file: `studio/src/compositions/PLTR_Q3_2025.tsx`
- Designer refines visuals, timing, charts, animations in Studio
- Preview and iterate until satisfied
- Render final video (take1, take2, etc.)

**Rationale for Manual Step:**
- Each earnings call is unique (different metrics, highlights, sentiment)
- Custom visual storytelling requires creative judgment
- Remotion Studio provides real-time preview and iteration
- Quality over speed in early phase (first 10-100 videos)
- Template evolves based on what works

**Step 7: Upload to YouTube**
```bash
# Automated upload once composition is rendered
python lens/process_earnings.py --url "..." --step upload
```

**Parallel Processing Support:**
Since Steps 1-5 are automated, you can process multiple videos simultaneously:
```bash
# Queue multiple videos for asset preparation
python lens/process_earnings.py --url "video1" --to insights &
python lens/process_earnings.py --url "video2" --to insights &
python lens/process_earnings.py --url "video3" --to insights &

# Then work on compositions one-by-one in Studio
```

**Future Optimization:**
- Phase 2: Standardized composition templates (reduce manual work)
- Phase 3: AI-generated compositions based on insights
- Phase 4: Fully automated pipeline for standard earnings calls

### 2. YouTube Integration

**YouTube Data API v3 - Full Integration:**

**Upload Features:**
- Automated video upload
- SEO-optimized metadata:
  - Title: "[Company] ([TICKER]) Q[X] [YEAR] Earnings Call - Visual Summary"
  - Description: Company overview, key metrics, website link
  - Tags: ticker, company name, earnings, investing, stocks, quarter
  - Custom thumbnails (company logo + key metric)
- Playlist organization (by industry, quarter, company)

**Analytics Features:**
- Real-time views count
- Watch time metrics
- Engagement (likes, comments, shares)
- Click-through rate on description links
- Traffic sources
- Audience demographics

**Download Features (Rapid API):**
- Download competitor earnings videos
- Extract audio for analysis
- Thumbnail extraction

### 3. Admin Dashboard (Mobile-First)

**Primary Monitor:** Admin interface ( available only for me)

**Dashboard URL:** `earninglens.com/admin`

**Key Metrics (One-Glance View):**

```
┌─────────────────────────────────────────┐
│  EarningLens Dashboard                  │
├─────────────────────────────────────────┤
│                                         │
│  📊 Top Videos (24h)                    │
│  ├─ AAPL Q4 2024    12.3K views  ↑15%  │
│  ├─ MSFT Q4 2024     8.7K views  ↑22%  │
│  └─ TSLA Q4 2024     6.2K views  ↑8%   │
│                                         │
│  🔗 Top Click-throughs                  │
│  ├─ AAPL → Website   342 clicks         │
│  ├─ MSFT → Website   218 clicks         │
│  └─ GOOGL → Website  187 clicks         │
│                                         │
│  📈 Today's Performance                 │
│  ├─ Total Views:     42.3K              │
│  ├─ Watch Time:      3,821 hours        │
│  ├─ New Subs:        +127               │
│  ├─ Website Visits:  1,247              │
│  └─ Conversions:     23 (1.8%)          │
│                                         │
│  💰 Revenue                             │
│  ├─ YouTube Ads:     $84.60             │
│  ├─ Subscriptions:   $142.00 (8 users)  │
│  └─ Total (30d):     $3,287.40          │
└─────────────────────────────────────────┘
```

**Features:**
- Real-time updates (polling every 30s)
- Mobile-responsive design
- Push notifications for milestones
- Video-to-website correlation tracking
- Comment monitoring
- Quick actions (publish, hide, edit metadata)

### 4. Authentication & User Management

**Better Auth Configuration:**

**Organization Structure:**
- **Free Tier (Not Logged In):**
  - Watch 50% of any video
  - View basic charts (no interactivity)
  - See 3 videos per session
  - **Prompt to login at 50% mark**

- **Free Tier (Logged In via Google One Tap):**
  - Watch 3 full videos total (not per month)
  - Basic chart interactions
  - Save videos to watchlist
  - Access quarterly report summaries
  - After 3 videos, must upgrade to continue

- **Pro Tier ($29.99 per seat/month):**
  - Unlimited video access
  - Full interactive charts (zoom, filter, export)
  - Download transcripts and reports
  - Email alerts for earnings dates
  - API access (100 requests/day)
  - Ad-free experience
  - Advanced search with entity relationship mapping

- **Team Tier ($29.99 per seat/month):**
  - All Pro features
  - Multiple team members (billed per seat)
  - Shared watchlists and notes
  - Custom alerts for specific companies
  - API access (1000 requests/day)
  - Priority support

### Implementation: 50% Video Watch Prompt

**Technical Flow:**
```typescript
// Track video progress
const [progress, setProgress] = useState(0);
const [hasPrompted, setHasPrompted] = useState(false);

// YouTube Player API
const onPlayerStateChange = (event) => {
  if (event.data === YT.PlayerState.PLAYING) {
    const interval = setInterval(() => {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const currentProgress = currentTime / duration;

      setProgress(currentProgress);

      // Trigger at 50%
      if (currentProgress >= 0.5 && !user && !hasPrompted) {
        pauseVideo();
        showGoogleOneTap({
          message: "Sign in to watch the full earnings call",
          context: "paywall"
        });
        setHasPrompted(true);
      }
    }, 1000);
  }
};
```

**User Experience:**
```
User watching Apple Q4 2024
  ↓
Video reaches 5:00 / 10:00 (50%)
  ↓
Video pauses automatically
  ↓
Overlay appears:
┌────────────────────────────────────┐
│  🔒 Sign in to continue            │
│                                    │
│  [Google One Tap Popup]            │
│                                    │
│  Or explore other videos:          │
│  → Microsoft Q4 2024               │
│  → Tesla Q4 2024                   │
└────────────────────────────────────┘
  ↓
User clicks "Continue as John"
  ↓
Instantly signed in
  ↓
Video resumes from 5:00
```

**Smart Variations:**
- If user already watched 3 videos → Show upgrade to Pro
- If user logged in but on free tier → Show video limit (X/3 this month)
- If user is Pro → No interruption

**Tracking:**
```sql
-- Log when users hit paywall
INSERT INTO video_engagement (
  video_id, user_id, event_type, metadata
) VALUES (
  $video_id, $user_id, 'paywall_triggered',
  '{"progress": 0.5, "action": "prompted_login"}'
);
```

**Better Auth Features to Enable:**
- Social login (Google, GitHub)
- Email/password
- Organization/team invites
- Role-based access control
- Session management
- API key generation (for programmatic access)

**Stripe Integration (Better Auth Plugin):**
- Subscription management
- Payment processing
- Invoicing
- Usage-based billing (future)
- Webhook handling (payment events)

### 5. Website Experience

**Landing Page (Show, Don't Tell):**

**Design Philosophy:**
- Minimal text, maximum data
- Interactive earnings dashboard
- Live video previews
- Data visualization front and center

**Layout:**
```
┌────────────────────────────────────────────┐
│  [Logo] EarningLens          [Login]       │
├────────────────────────────────────────────┤
│                                            │
│   Latest Earnings (Interactive Grid)      │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│   │AAPL │ │MSFT │ │GOOGL│ │TSLA │        │
│   │📊   │ │📊   │ │📊   │ │📊   │        │
│   │+12% │ │+8%  │ │+15% │ │-3%  │        │
│   └─────┘ └─────┘ └─────┘ └─────┘        │
│                                            │
│   [Embedded Video Preview - Auto-play]    │
│   ▶ Apple Q4 2024 Earnings                │
│                                            │
│   📊 Live Dashboard                        │
│   Revenue: $X.XX B  |  EPS: $X.XX         │
│   [Interactive Chart]                      │
│                                            │
│   👇 Scroll to explore more...            │
└────────────────────────────────────────────┘
```

**Free User Experience:**
- Watch 50% of video → prompt to login
- See partial charts → login for full data
- Click quarterly report link → login required

**Logged-in User Experience:**
- Full video access
- Interactive charts (zoom, filter, compare)
- Clickable timestamps
- Save to watchlist
- Download transcripts

**Premium User Experience:**
- All of above +
- Download videos
- API access
- Early access to new earnings
- Custom alerts

### 6. Custom Video Request Service

**Purpose:** Allow users to request custom earnings videos for companies not yet covered or for custom analysis

**Pricing Tiers:**

1. **Standard Service ($299)**
   - Custom earnings video for any company/quarter
   - Includes 2 revision rounds
   - 5-7 business day delivery
   - Professional video with charts, transcripts, and analysis
   - Delivered via private YouTube link + website access

2. **Premium Service ($699)**
   - All Standard features
   - Unlimited revisions until satisfied
   - 3-5 business day delivery
   - Priority support
   - Custom chart requests
   - Additional data analysis

**Request Form Fields:**

```typescript
interface VideoRequestForm {
  // Basic Info
  company: string;          // Company name
  ticker: string;           // Stock ticker (optional)
  quarter: string;          // Q1, Q2, Q3, Q4
  year: number;             // Year

  // Video Source (pick one)
  sourceType: 'upload' | 'youtube_url' | 'ai_generated';
  uploadedFile?: File;      // If user uploads audio/video
  youtubeUrl?: string;      // If user provides YouTube link

  // AI-Generated Options (if sourceType = 'ai_generated')
  aiInstructions?: string;  // Custom instructions for AI-generated video
  dataPoints?: string[];    // Specific metrics to highlight

  // Service Level
  serviceLevel: 'standard' | 'premium'; // $299 or $699

  // Additional Requirements
  specialRequests?: string; // Custom charts, specific analysis, etc.
  deliveryDate?: Date;      // Requested delivery date (if urgent)
}
```

**User Flow:**

```
User clicks "Request Custom Video"
  ↓
Fill out form:
  1. Enter company details (name, ticker, quarter, year)
  2. Choose source:
     - Upload audio/video file
     - Provide YouTube URL
     - Request AI-generated video
  3. Select service level:
     - Standard ($299, 2 revisions)
     - Premium ($699, unlimited revisions)
  4. Add special requests (optional)
  ↓
Payment via Stripe ($299 or $699)
  ↓
Video enters production queue
  ↓
User receives:
  - Confirmation email with timeline
  - Progress updates
  - Draft video for review
  - Final video + website access
```

**Implementation:**

```typescript
// app/request-video/page.tsx

export default function RequestVideoPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Request Custom Video</h1>

      <form>
        {/* Company Details */}
        <section>
          <h2>Company Information</h2>
          <input name="company" placeholder="Company Name" />
          <input name="ticker" placeholder="Ticker (e.g., AAPL)" />
          <select name="quarter">
            <option>Q1</option>
            <option>Q2</option>
            <option>Q3</option>
            <option>Q4</option>
          </select>
          <input type="number" name="year" placeholder="2024" />
        </section>

        {/* Video Source */}
        <section>
          <h2>Video Source</h2>
          <div>
            <input type="radio" name="sourceType" value="upload" />
            <label>Upload Audio/Video File</label>
            <input type="file" accept="audio/*,video/*" />
          </div>

          <div>
            <input type="radio" name="sourceType" value="youtube_url" />
            <label>Provide YouTube URL</label>
            <input type="url" placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div>
            <input type="radio" name="sourceType" value="ai_generated" />
            <label>AI-Generated Video ($299/$699)</label>
            <textarea placeholder="Describe what you want in the video..." />
          </div>
        </section>

        {/* Service Level */}
        <section>
          <h2>Service Level</h2>
          <div className="border rounded p-4">
            <input type="radio" name="serviceLevel" value="standard" />
            <strong>Standard - $299</strong>
            <p>Includes 2 revision rounds, 5-7 day delivery</p>
          </div>

          <div className="border rounded p-4">
            <input type="radio" name="serviceLevel" value="premium" />
            <strong>Premium - $699</strong>
            <p>Unlimited revisions, 3-5 day delivery, priority support</p>
          </div>
        </section>

        <button type="submit">
          Proceed to Payment
        </button>
      </form>
    </div>
  );
}
```

**Database Schema:**

```sql
CREATE TABLE video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),

  -- Request details
  company VARCHAR(255) NOT NULL,
  ticker VARCHAR(10),
  quarter VARCHAR(10),
  year INTEGER,

  -- Source
  source_type VARCHAR(50), -- upload, youtube_url, ai_generated
  uploaded_file_url TEXT,
  youtube_url TEXT,
  ai_instructions TEXT,

  -- Service
  service_level VARCHAR(50), -- standard, premium
  amount_paid DECIMAL(10, 2), -- 299.00 or 699.00
  stripe_payment_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, review, completed
  current_revision INTEGER DEFAULT 0,
  max_revisions INTEGER, -- 2 for standard, NULL for premium

  -- Delivery
  draft_video_url TEXT,
  final_video_url TEXT,
  website_url TEXT,
  delivered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Entity Relationship Mapping (Key Differentiator)

**What Sets EarningLens Apart from YouTube:**

While YouTube shows individual earnings call videos, EarningLens creates an **intelligent knowledge graph** that surfaces hidden relationships across companies, products, competitors, and market trends.

**The Core Value:**

> "If Product 1 is mentioned in your earnings call or SEC filing, and it's also mentioned by a competitor, we surface that relationship instantly."

**How It Works:**

```
Apple mentions "Vision Pro" in Q4 2024 earnings
  ↓
EarningLens Knowledge Graph:
  - Vision Pro appears in Apple SEC 10-Q
  - Vision Pro mentioned in Meta earnings (competing with Quest 3)
  - Vision Pro discussed on apple.com/vision
  - Related searches: "AR headsets", "spatial computing"
  ↓
User watching Apple video sees:
  ┌──────────────────────────────────────┐
  │ 🔗 Related Mentions                  │
  │                                      │
  │ "Vision Pro" also mentioned in:      │
  │ → Meta Q4 2024 (competitor)          │
  │ → Apple 10-Q Filing (SEC)            │
  │ → CES 2024 Coverage                  │
  │                                      │
  │ Related Products:                    │
  │ → Meta Quest 3                       │
  │ → Microsoft HoloLens                 │
  └──────────────────────────────────────┘
```

**Data Sources for Entity Extraction:**

1. **Earnings Call Transcripts**
   - Extract product names, metrics, initiatives
   - Identify mentions of competitors
   - Track sentiment (positive, negative, neutral)

2. **SEC Filings (10-K, 10-Q, 8-K)**
   - Official product disclosures
   - Risk factors mentioning competitors
   - Financial data tied to products/segments

3. **Company Websites**
   - Investor relations pages
   - Product pages
   - Press releases

4. **Competitor Cross-References**
   - Track when Company A mentions Company B
   - Identify market overlap
   - Surface competitive dynamics

**Example Use Cases:**

**Use Case 1: Product Competition**
```
User searches: "iPhone"
  ↓
Results:
  - Apple Q4 2024: "iPhone revenue up 6%"
  - Samsung earnings: "Galaxy competing with iPhone"
  - Alphabet earnings: "Pixel gaining share"

Cross-references:
  - SEC filing: Apple mentions "increased competition"
  - Samsung website: "Galaxy S24 vs iPhone 15"
```

**Use Case 2: Industry Trends**
```
User searches: "cloud revenue"
  ↓
Results:
  - Microsoft: Azure up 30%
  - Amazon: AWS up 19%
  - Google: Cloud up 28%

Pattern detected:
  "All major cloud providers growing 20%+ YoY"
  Suggested: "Cloud computing trend analysis"
```

**Use Case 3: Supply Chain**
```
User watching NVIDIA Q4 2024
  ↓
Entity detected: "TSMC" (chip manufacturer)
  ↓
Related mentions:
  - AMD earnings: "TSMC partnership"
  - TSMC earnings: "GPU demand strong"
  - Apple earnings: "TSMC capacity concerns"
```

**Technical Implementation:**

```typescript
// Database Schema for Entity Relationships

CREATE TABLE entities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL, -- "iPhone", "Vision Pro", "AWS"
  type VARCHAR(50), -- product, company, technology, market
  canonical_name VARCHAR(255), -- Normalized name
  aliases JSONB, -- ["iPhone 15", "iPhone Pro", "AAPL iPhone"]
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_mentions (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  source_type VARCHAR(50), -- earnings_call, sec_filing, website
  source_id UUID, -- video_id, filing_id, etc.
  company_id UUID REFERENCES companies(id),

  -- Context
  mention_text TEXT, -- Surrounding text
  sentiment VARCHAR(20), -- positive, negative, neutral
  context_type VARCHAR(50), -- revenue, product_launch, risk_factor

  -- Metadata
  timestamp TIMESTAMP, -- When mentioned in video
  page_number INTEGER, -- For SEC filings
  url TEXT, -- Source URL

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY,
  entity_a_id UUID REFERENCES entities(id),
  entity_b_id UUID REFERENCES entities(id),
  relationship_type VARCHAR(50), -- competitor, supplier, partner
  confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- Evidence
  evidence JSONB, -- Links to mentions, filings, etc.

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_a_id, entity_b_id, relationship_type)
);
```

**Search API:**

```typescript
// API endpoint for entity search
// GET /api/search?q=iPhone&type=entity

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const query = searchParams.get('q');

  // 1. Find entity
  const entity = await db.entities.findFirst({
    where: {
      OR: [
        {name: {contains: query, mode: 'insensitive'}},
        {aliases: {array_contains: query}},
      ],
    },
  });

  if (!entity) {
    return Response.json({error: 'Entity not found'}, {status: 404});
  }

  // 2. Get all mentions across sources
  const mentions = await db.entity_mentions.findMany({
    where: {entity_id: entity.id},
    include: {
      video: true,
      company: true,
    },
    orderBy: {created_at: 'desc'},
  });

  // 3. Get related entities
  const relationships = await db.entity_relationships.findMany({
    where: {
      OR: [
        {entity_a_id: entity.id},
        {entity_b_id: entity.id},
      ],
    },
    include: {
      entity_a: true,
      entity_b: true,
    },
  });

  // 4. Group by company
  const byCompany = mentions.reduce((acc, mention) => {
    const key = mention.company.ticker;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mention);
    return acc;
  }, {});

  return Response.json({
    entity,
    mentions: {
      total: mentions.length,
      byCompany,
      bySource: {
        earnings_calls: mentions.filter(m => m.source_type === 'earnings_call').length,
        sec_filings: mentions.filter(m => m.source_type === 'sec_filing').length,
        websites: mentions.filter(m => m.source_type === 'website').length,
      },
    },
    relationships: relationships.map(r => ({
      type: r.relationship_type,
      entity: r.entity_a_id === entity.id ? r.entity_b : r.entity_a,
      confidence: r.confidence,
    })),
  });
}
```

**UI Component: Entity Relationship Widget**

```tsx
// components/EntityRelationships.tsx

export function EntityRelationships({entityName}: {entityName: string}) {
  const {data} = useSWR(`/api/search?q=${entityName}&type=entity`);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold text-lg mb-4">
        "{data.entity.name}" mentioned across:
      </h3>

      {/* By Company */}
      <div className="space-y-2">
        {Object.entries(data.mentions.byCompany).map(([ticker, mentions]) => (
          <div key={ticker} className="flex items-center justify-between">
            <span>{ticker}</span>
            <span className="text-sm text-gray-500">{mentions.length} mentions</span>
          </div>
        ))}
      </div>

      {/* Related Entities */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Related:</h4>
        {data.relationships.map(rel => (
          <Link
            key={rel.entity.id}
            href={`/search?q=${rel.entity.name}`}
            className="block text-blue-600 hover:underline"
          >
            {rel.entity.name} ({rel.type})
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Example in Video Page:**

```tsx
// app/[company]/[videoSlug]/page.tsx

export default async function VideoPage({params}) {
  const video = await getVideo(params.videoSlug);

  // Extract entities mentioned in this video
  const entities = await db.entity_mentions.findMany({
    where: {
      source_type: 'earnings_call',
      source_id: video.id,
    },
    include: {entity: true},
  });

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Video Player */}
      <div className="col-span-2">
        <YouTubePlayer videoId={video.youtube_id} />
      </div>

      {/* Entity Relationships Sidebar */}
      <div className="col-span-1">
        <h3 className="font-bold mb-4">Key Topics</h3>
        {entities.map(mention => (
          <EntityRelationships
            key={mention.entity.id}
            entityName={mention.entity.name}
          />
        ))}
      </div>
    </div>
  );
}
```

**Competitive Advantage:**

| Feature | YouTube | EarningLens |
|---------|---------|-------------|
| Watch earnings videos | ✅ | ✅ |
| Search by company | ✅ | ✅ |
| Search by product/topic | ❌ | ✅ |
| Cross-company comparisons | ❌ | ✅ |
| SEC filing integration | ❌ | ✅ |
| Competitor tracking | ❌ | ✅ |
| Entity relationships | ❌ | ✅ |
| Knowledge graph | ❌ | ✅ |

**This is the "unfair advantage" that makes EarningLens more than just a video platform.**

### 8. Personalization & Recommendations

**Recommendation Engine:**

**Data Inputs:**
- Watch history
- Engagement (likes, saves, shares)
- Industry preferences
- Company follows
- Time spent on specific charts

**Recommendation Types:**
1. "Related Earnings" (same industry)
2. "Companies You Might Like" (similar performance)
3. "Trending Now" (high engagement)
4. "Upcoming Earnings" (calendar-based)

**UI Placement:**
- Sidebar on video page
- Email digest (weekly)
- Homepage hero section
- Mobile app notifications (future)

### 7. SEO Strategy

**YouTube SEO:**
- Keyword-rich titles (company name, ticker, quarter, year)
- Detailed descriptions (300+ words)
- Tags: primary (AAPL, Apple, earnings) + secondary (investing, stocks, finance)
- Custom thumbnails (A/B tested)
- Playlists (industry, quarter)
- End screens (drive to website)

**Website SEO:**
- Dynamic meta tags per video
- Schema.org structured data (VideoObject, Corporation)
- Internal linking (company pages, industry pages)
- Blog content (earnings recaps, analysis)
- Backlink strategy (finance forums, Reddit)

**Content Strategy:**
- Initially: All videos public (maximize YouTube reach)
- Later: Premium videos (exclusive early access)

### 8. Logging & Analytics

**User Activity Tracking:**

**Events to Log:**
- Page views (video, company, industry)
- Video plays (start, 25%, 50%, 75%, 100%)
- Click-throughs (YouTube description → website)
- Chart interactions (zoom, filter, hover)
- Quarterly report downloads
- Account creation
- Subscription purchases
- Referral sources

**Database Schema (Simplified):**
```sql
-- Users
users (id, email, name, created_at, tier)

-- Organizations
organizations (id, name, tier, created_at)
organization_members (org_id, user_id, role)

-- Videos
videos (id, youtube_id, company_id, quarter, year, views, watch_time)

-- Analytics
video_views (id, video_id, user_id, timestamp, source)
video_engagement (id, video_id, user_id, event_type, timestamp, metadata)
click_throughs (id, video_id, user_id, destination, timestamp)

-- Subscriptions
subscriptions (id, user_id, org_id, stripe_subscription_id, status, plan)
```

**Admin Dashboard Queries:**
```sql
-- Top videos by views (24h)
SELECT v.title, COUNT(*) as views
FROM video_views vv
JOIN videos v ON vv.video_id = v.id
WHERE vv.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY v.id
ORDER BY views DESC
LIMIT 10;

-- Click-through correlation
SELECT v.title,
       COUNT(vv.id) as video_views,
       COUNT(ct.id) as click_throughs,
       (COUNT(ct.id)::float / COUNT(vv.id)) * 100 as ctr
FROM videos v
LEFT JOIN video_views vv ON v.id = vv.video_id
LEFT JOIN click_throughs ct ON v.id = ct.video_id
GROUP BY v.id;
```

---

## Database Schema (Neon PostgreSQL)

### Core Tables

```sql
-- Users (managed by Better Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  tier VARCHAR(50) DEFAULT 'free', -- free, pro, team
  created_at TIMESTAMP DEFAULT NOW(),
  stripe_customer_id VARCHAR(255)
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ticker VARCHAR(10) UNIQUE NOT NULL,
  industry VARCHAR(100),
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  youtube_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  quarter VARCHAR(10), -- Q1, Q2, Q3, Q4
  year INTEGER,
  duration INTEGER, -- seconds
  thumbnail_url TEXT,
  r2_url TEXT, -- Cloudflare R2 backup
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, unlisted
  views_count INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Video Analytics
CREATE TABLE video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255), -- for anonymous users
  source VARCHAR(100), -- youtube, website, embed
  referrer TEXT,
  device VARCHAR(50), -- mobile, desktop, tablet
  country VARCHAR(2), -- country code
  timestamp TIMESTAMP DEFAULT NOW(),
  watch_duration INTEGER -- seconds watched
);

CREATE TABLE video_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50), -- play, pause, complete, chart_interact, download
  metadata JSONB, -- additional event data
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE click_throughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  destination VARCHAR(255), -- website, quarterly_report, etc.
  source VARCHAR(50), -- youtube_description, video_link, etc.
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Subscriptions (managed by Stripe + Better Auth)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50), -- pro, team
  status VARCHAR(50), -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Earnings Data
CREATE TABLE earnings_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  quarter VARCHAR(10),
  year INTEGER,
  revenue DECIMAL(15, 2),
  eps DECIMAL(10, 4),
  guidance TEXT,
  highlights JSONB, -- key metrics as JSON
  transcript_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_timestamp ON video_views(timestamp);
CREATE INDEX idx_video_engagement_video_id ON video_engagement(video_id);
CREATE INDEX idx_click_throughs_video_id ON click_throughs(video_id);
CREATE INDEX idx_videos_company_id ON videos(company_id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
```

---

## Development Phases

### Phase 0: Foundation (Day 1)

**Goal:** Set up core infrastructure

**Tasks:**
1. Initialize Next.js project with TypeScript + TailwindCSS
2. Set up Neon database
3. Configure Better Auth with Stripe plugin
4. Set up Cloudflare R2 bucket
5. Copy reusable code from VideotoBe platform:
   - YouTube API utilities
   - R2 upload functions
   - Admin dashboard components
6. Create basic database schema
7. Set up environment variables

**Deliverables:**
- Next.js app running locally
- Database connected
- Auth working (login/logout)
- R2 upload working

### Phase 1: MVP (Days 2-3)

**Goal:** Generate first 10 videos and publish to YouTube

**Tasks:**
1. Create base Remotion composition for earnings videos
2. Manual pipeline:
   - Input: Audio file + transcript + company data
   - Output: Rendered video
3. Render 10 videos on GPU machine
4. Upload to R2
5. Manually upload to YouTube with optimized metadata
6. Create basic landing page (embedded YouTube videos)
7. Deploy to Vercel

**Deliverables:**
- 10 YouTube videos published
- Landing page live at earninglens.com
- YouTube channel created
- Basic admin dashboard (views only)

### Phase 2: Automation (Week 1)

**Goal:** Scale to 100 videos

**Tasks:**
1. Create batch rendering script for Remotion
2. YouTube API auto-upload
3. Metadata optimization pipeline
4. Thumbnail generation (automated)
5. Enhanced admin dashboard:
   - Real-time YouTube analytics
   - Click-through tracking
   - Mobile-responsive design
6. SEO optimization (website + YouTube)
7. Upload schedule (gradual: 3-5-7-10-15 videos/day)

**Deliverables:**
- 100 videos on YouTube
- Automated upload pipeline
- Full admin dashboard
- SEO-optimized pages

### Phase 3: Interactive Platform (Weeks 2-3)

**Goal:** Launch freemium web platform

**Tasks:**
1. Build video pages with:
   - Embedded YouTube player
   - Transcript display
   - Interactive charts
   - Quarterly report links
2. Implement free tier restrictions:
   - 50% video limit
   - Login prompts
   - Partial chart access
3. Stripe subscription flow
4. User dashboard
5. Recommendation engine (basic)
6. Email notifications (earnings dates)

**Deliverables:**
- Full web platform live
- Subscription payments working
- Free + Pro tiers functional
- User accounts and profiles

### Phase 4: Growth & Optimization (Weeks 4-6)

**Goal:** Monetization and scale

**Tasks:**
1. YouTube channel monetization (1000 subs + 4000 hours)
2. Advanced analytics:
   - Cohort analysis
   - Retention metrics
   - Conversion funnels
3. Personalization engine
4. API for developers (premium feature)
5. Mobile app (PWA)
6. Content marketing:
   - Blog posts
   - Social media
   - Email newsletters

**Deliverables:**
- YouTube monetization enabled
- First paying subscribers
- Advanced analytics dashboard
- Growth marketing campaigns

---

## Technical Implementation Details

### Remotion Video Composition Structure

```typescript
// src/remotion/EarningsVideo/index.tsx

import {AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const earningsVideoSchema = z.object({
  company: z.string(),
  ticker: z.string(),
  quarter: z.string(),
  year: z.number(),
  audioUrl: z.string(),
  logoUrl: z.string(),
  transcript: z.array(z.object({
    text: z.string(),
    startTime: z.number(),
    endTime: z.number(),
  })),
  charts: z.array(z.object({
    type: z.enum(['revenue', 'eps', 'guidance']),
    imageUrl: z.string(),
    startTime: z.number(),
    duration: z.number(),
  })),
});

type EarningsVideoProps = z.infer<typeof earningsVideoSchema>;

export const EarningsVideo: React.FC<EarningsVideoProps> = ({
  company,
  ticker,
  quarter,
  year,
  audioUrl,
  logoUrl,
  transcript,
  charts,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentTime = frame / fps;

  // Find current transcript segment
  const currentTranscript = transcript.find(
    (t) => currentTime >= t.startTime && currentTime < t.endTime
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#0f0f0f'}}>
      {/* Background gradient */}
      <AbsoluteFill style={{background: 'linear-gradient(135deg, #1e3a8a 0%, #0f0f0f 100%)'}} />

      {/* Company logo */}
      <Sequence from={0}>
        <div style={{position: 'absolute', top: 40, left: 40}}>
          <Img src={logoUrl} style={{width: 120, height: 120, borderRadius: 20}} />
        </div>
      </Sequence>

      {/* Title card */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center', color: 'white'}}>
            <h1 style={{fontSize: 72, fontWeight: 'bold', marginBottom: 20}}>
              {company} ({ticker})
            </h1>
            <h2 style={{fontSize: 48, color: '#94a3b8'}}>
              {quarter} {year} Earnings Call
            </h2>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Charts */}
      {charts.map((chart, index) => (
        <Sequence
          key={index}
          from={chart.startTime * fps}
          durationInFrames={chart.duration * fps}
        >
          <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={chart.imageUrl} style={{maxWidth: '80%', maxHeight: '80%'}} />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* Transcript overlay */}
      {currentTranscript && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px 40px',
            color: 'white',
            fontSize: 32,
            lineHeight: 1.5,
          }}
        >
          {currentTranscript.text}
        </div>
      )}

      {/* Audio */}
      <Audio src={audioUrl} />
    </AbsoluteFill>
  );
};
```

### YouTube API Integration

```typescript
// src/lib/youtube.ts

import {google} from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export async function uploadVideo({
  filePath,
  title,
  description,
  tags,
  thumbnailPath,
}: {
  filePath: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailPath?: string;
}) {
  // Upload video
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: '28', // Science & Technology
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  const videoId = response.data.id;

  // Upload custom thumbnail
  if (thumbnailPath) {
    await youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
  }

  return {videoId, url: `https://youtube.com/watch?v=${videoId}`};
}

export async function getVideoAnalytics(videoId: string) {
  const response = await youtube.videos.list({
    part: ['statistics', 'contentDetails'],
    id: [videoId],
  });

  const video = response.data.items?.[0];

  return {
    views: parseInt(video?.statistics?.viewCount || '0'),
    likes: parseInt(video?.statistics?.likeCount || '0'),
    comments: parseInt(video?.statistics?.commentCount || '0'),
    duration: video?.contentDetails?.duration,
  };
}

export async function getChannelAnalytics() {
  const response = await youtube.channels.list({
    part: ['statistics'],
    mine: true,
  });

  const channel = response.data.items?.[0];

  return {
    subscribers: parseInt(channel?.statistics?.subscriberCount || '0'),
    totalViews: parseInt(channel?.statistics?.viewCount || '0'),
    totalVideos: parseInt(channel?.statistics?.videoCount || '0'),
  };
}
```

### Admin Dashboard API Route

```typescript
// src/app/api/admin/stats/route.ts

import {db} from '@/lib/db';
import {getChannelAnalytics} from '@/lib/youtube';

export async function GET(request: Request) {
  // Get top videos (24h)
  const topVideos = await db.query(`
    SELECT
      v.id,
      v.title,
      v.youtube_id,
      COUNT(vv.id) as views,
      SUM(vv.watch_duration) / 3600 as watch_hours
    FROM videos v
    LEFT JOIN video_views vv ON v.id = vv.video_id
    WHERE vv.timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY v.id
    ORDER BY views DESC
    LIMIT 10
  `);

  // Get click-through stats
  const clickThroughs = await db.query(`
    SELECT
      v.title,
      COUNT(DISTINCT vv.id) as video_views,
      COUNT(DISTINCT ct.id) as clicks,
      (COUNT(DISTINCT ct.id)::float / NULLIF(COUNT(DISTINCT vv.id), 0)) * 100 as ctr
    FROM videos v
    LEFT JOIN video_views vv ON v.id = vv.video_id
    LEFT JOIN click_throughs ct ON v.id = ct.video_id
    WHERE vv.timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY v.id
    ORDER BY clicks DESC
    LIMIT 10
  `);

  // Get YouTube channel stats
  const channelStats = await getChannelAnalytics();

  // Get subscription revenue
  const revenue = await db.query(`
    SELECT
      SUM(CASE WHEN plan = 'pro' THEN 29 ELSE 99 END) as monthly_recurring,
      COUNT(*) as active_subscriptions
    FROM subscriptions
    WHERE status = 'active'
  `);

  return Response.json({
    topVideos: topVideos.rows,
    clickThroughs: clickThroughs.rows,
    channelStats,
    revenue: revenue.rows[0],
    timestamp: new Date().toISOString(),
  });
}
```

---

## Key Metrics & Success Criteria

### YouTube Metrics (Phase 1-2)
- ✅ 100 videos published (Week 2)
- ✅ 1,000 subscribers (Week 4)
- ✅ 4,000 watch hours (Week 6)
- ✅ Monetization enabled (Week 6)
- Target: $500/month ad revenue by Month 3

### Website Metrics (Phase 3-4)
- ✅ 10,000 monthly visitors (Month 2)
- ✅ 5% conversion rate (free → paid)
- ✅ $1,000 MRR from subscriptions (Month 3)
- ✅ $5,000 MRR from subscriptions (Month 6)
- Target: 100 paying subscribers by Month 6 (~$3,000 MRR at $29.99/seat)

### Custom Video Revenue (Phase 4+)
- ✅ 5 custom video requests/month (Month 4)
- Target revenue: $1,500-3,500/month from custom videos
  - Standard ($299): 3-4 requests/month
  - Premium ($699): 1-2 requests/month
- Potential scaling: 20 requests/month = $6,000-14,000/month additional revenue

### Combined Revenue Targets
**Month 3:**
- YouTube ads: $200/month
- Subscriptions: $1,000 MRR
- **Total:** $1,200/month

**Month 6:**
- YouTube ads: $500/month
- Subscriptions: $5,000 MRR
- Custom videos: $2,000/month
- **Total:** $7,500/month

**Month 12:**
- YouTube ads: $1,500/month
- Subscriptions: $15,000 MRR (500 seats × $29.99)
- Custom videos: $10,000/month
- **Total:** $26,500/month

### Engagement Metrics
- Average watch time: >5 minutes (target: 8 minutes)
- Click-through rate (YouTube → website): >3%
- User retention: >40% (month 2)
- NPS score: >50

---

## Risk Mitigation

### Technical Risks
- **Neon database costs:** Monitor usage, implement caching, optimize queries
- **YouTube API quotas:** Use batch operations, implement rate limiting
- **Video rendering costs:** Use GPU machine for MVP, scale to Lambda only if needed
- **R2 bandwidth:** Use CDN caching, optimize video sizes

### Business Risks
- **YouTube algorithm changes:** Diversify traffic sources (SEO, social, email)
- **Low watch time:** A/B test video formats, improve thumbnails, optimize length
- **Low conversion rate:** Improve free tier value, add testimonials, optimize pricing
- **Competition:** Focus on unique value (data visualization, personalization)

### Operational Risks
- **Content pipeline bottleneck:** Automate earnings data collection
- **Manual upload burden:** Prioritize YouTube API auto-upload
- **Customer support load:** Build comprehensive FAQ, video tutorials
- **Scaling challenges:** Start with managed services (Vercel, Neon, R2)

---

## Seed Data Strategy: Using Exa.ai

### What is Exa.ai?

Exa.ai is a neural search API that finds high-quality, structured content across the web. Unlike Google, it's optimized for programmatic data extraction.

**Perfect for EarningLens:**
- Find earnings call transcripts
- Extract financial data from SEC filings
- Discover competitor information
- Pull industry insights and trends

### Initial Seed: 50+ Companies

**Target Companies (FAANG + Top 50):**
```typescript
const seedCompanies = [
  // Tech Giants
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',

  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS',

  // Consumer
  'WMT', 'COST', 'HD', 'NKE', 'SBUX',

  // Healthcare
  'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO',

  // ... 50+ total
];
```

### Exa.ai Queries

```typescript
// 1. Find earnings call transcripts
const transcriptResults = await exa.searchAndContents(
  `${company} Q4 2024 earnings call transcript`,
  {
    type: "auto",
    num_results: 3,
    text: {max_characters: 10000},
    highlights: {
      num_sentences: 5,
      highlights_per_url: 3
    }
  }
);

// 2. Find financial data
const financialResults = await exa.searchAndContents(
  `${company} Q4 2024 revenue EPS earnings SEC filing 10-Q`,
  {
    type: "auto",
    num_results: 5,
    text: true
  }
);

// 3. Find competitor analysis
const competitorResults = await exa.findSimilar(
  `https://investor.apple.com/earnings/`,
  {
    num_results: 10,
    exclude_source_domain: true
  }
);
```

### Data Extraction Pipeline

```typescript
// scripts/seed-with-exa.ts

import Exa from 'exa-js';
import {db} from '../shared/database';

const exa = new Exa(process.env.EXA_API_KEY);

async function seedCompany(ticker: string, name: string) {
  console.log(`Seeding ${ticker}...`);

  // 1. Find earnings transcript
  const transcriptSearch = await exa.searchAndContents(
    `${name} ${ticker} Q4 2024 earnings call transcript`,
    {type: "auto", num_results: 1, text: true}
  );

  const transcript = transcriptSearch.results[0]?.text;

  // 2. Extract financial metrics using Exa's neural parsing
  const financialSearch = await exa.searchAndContents(
    `${ticker} Q4 2024 quarterly results revenue net income EPS guidance`,
    {
      type: "auto",
      num_results: 3,
      text: {max_characters: 5000},
      highlights: {
        query: "revenue EPS net income guidance",
        highlights_per_url: 5
      }
    }
  );

  // Parse highlights to extract numbers
  const financialData = parseFinancialHighlights(financialSearch.results);

  // 3. Find SEC filings
  const secFilings = await exa.searchAndContents(
    `${ticker} 10-Q Q4 2024 SEC EDGAR`,
    {type: "auto", num_results: 2}
  );

  // 4. Save to database
  await db.companies.upsert({
    where: {ticker},
    update: {},
    create: {ticker, name, industry: 'Technology'},
  });

  await db.videos.create({
    data: {
      company: {connect: {ticker}},
      slug: `${ticker.toLowerCase()}-q4-2024`,
      title: `${name} (${ticker}) Q4 2024 Earnings Call`,
      quarter: 'Q4',
      year: 2024,
      youtube_id: 'placeholder', // Will be replaced after rendering
      status: 'draft',
    },
  });

  await db.earnings_data.create({
    data: {
      video: {connect: {slug: `${ticker.toLowerCase()}-q4-2024`}},
      financial_data: financialData,
    },
  });

  await db.transcripts.create({
    data: {
      video: {connect: {slug: `${ticker.toLowerCase()}-q4-2024`}},
      full_text: transcript,
    },
  });

  console.log(`✅ ${ticker} seeded`);
}

// Run for all companies
for (const {ticker, name} of seedCompanies) {
  await seedCompany(ticker, name);
}
```

### Helper: Parse Financial Data

```typescript
function parseFinancialHighlights(results: ExaSearchResult[]) {
  const highlights = results.flatMap(r => r.highlights || []);

  // Use regex to extract financial metrics
  const revenueMatch = highlights.join(' ').match(/revenue[^\d]*([\d.]+)\s*(billion|million)/i);
  const epsMatch = highlights.join(' ').match(/EPS[^\d]*([\d.]+)/i);
  const guidanceMatch = highlights.join(' ').match(/guidance[^\d]*([\d.]+)[^\d]+([\d.]+)/i);

  return {
    revenue: {
      current: parseFinancialValue(revenueMatch),
      // ... more parsing
    },
    eps: {
      current: parseFloat(epsMatch?.[1] || '0'),
    },
    guidance: {
      revenue_low: parseFloat(guidanceMatch?.[1] || '0'),
      revenue_high: parseFloat(guidanceMatch?.[2] || '0'),
    },
  };
}
```

### Seed Data Quality Goals

**After Exa.ai seeding, you should have:**
- ✅ 50+ companies in database
- ✅ 50+ video placeholders (ready for Remotion rendering)
- ✅ Transcripts for each earnings call
- ✅ Financial data (revenue, EPS, guidance)
- ✅ SEC filing links
- ✅ Competitor relationships pre-populated

**Landing Page Impact:**
```
User visits earninglens.com

Sees immediately:
┌────────────────────────────────────────┐
│  Latest Earnings                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ AAPL │ │ MSFT │ │GOOGL│ │ TSLA │ │
│  │ +12% │ │ +8%  │ │+15% │ │ -3%  │ │
│  │89.5B │ │62.0B │ │86.3B│ │25.2B │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                                        │
│  🔥 Trending Now                       │
│  1. Apple beats estimates by 12%      │
│  2. Tesla misses on guidance          │
│  3. Microsoft cloud revenue surges    │
│                                        │
│  📊 50+ earnings calls analyzed        │
│  👁️  125,000 total views               │
│  ⏱️  8,432 hours watched               │
└────────────────────────────────────────┘

"Wow, there's SO much here already!"
```

### Exa.ai API Costs

**Pricing:**
- $10/month: 1,000 searches
- $50/month: 10,000 searches

**For initial seed (50 companies):**
- 50 companies × 4 queries each = 200 searches
- **Cost:** ~$2 (one-time)

**Ongoing (100 companies/quarter):**
- 100 companies × 4 queries = 400 searches/quarter
- **Cost:** ~$4/quarter

**Worth it for instant content library!**

---

## Next Steps

### Phase 0: MVP Strategy (Lean Start)

**Smart Approach:** Launch fast, replace gradually

```
Day 1: Point to existing YouTube earnings videos
  ↓
Day 2-3: Generate FIRST custom video
  ↓
Week 1: Replace 5 videos
  ↓
Week 2: Replace 10 more
  ↓
Month 1: All 50 videos custom
```

**Why This Works:**
- ✅ Launch site TODAY with 50 videos (existing YouTube content)
- ✅ Prove concept before rendering 100 videos
- ✅ Get user feedback early
- ✅ Iterate on video template based on real engagement
- ✅ "WOW factor" on day 1 (lots of content)

### Phase 0.1: Seed with Existing YouTube Videos (Day 1 - 4 hours)

**Use Exa.ai to find existing earnings call videos:**

```typescript
// scripts/seed-existing-videos.ts

const companies = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'];

for (const ticker of companies) {
  // Find existing YouTube earnings video
  const results = await exa.searchAndContents(
    `${ticker} Q3 2024 earnings call YouTube`,
    {
      type: "auto",
      num_results: 1,
      include_domains: ["youtube.com"]
    }
  );

  const youtubeUrl = results.results[0]?.url;
  const youtubeId = extractYouTubeId(youtubeUrl); // e.g., "dQw4w9WgXcQ"

  // Save to database with existing YouTube ID
  await db.videos.create({
    data: {
      company: {connect: {ticker}},
      youtube_id: youtubeId, // Point to existing video
      title: `${ticker} Q3 2024 Earnings Call`,
      quarter: 'Q3',
      year: 2024,
      status: 'published', // Already live on YouTube
      is_custom: false, // Mark as placeholder
    },
  });
}
```

**Result:** 50 videos available on site in 4 hours (all pointing to existing YouTube content)

### Phase 0.2: Generate FIRST Custom Video (Days 2-3)

**Target: Recent Earnings (Late Oct/Early Nov 2024)**

**Recommended First Video:**
- **Company:** Apple (AAPL)
- **Quarter:** Q4 2024 (FY 2024)
- **Date:** November 1, 2024
- **Why:** Highest interest, recent, lots of data available

**Alternative Options (if Apple difficult):**
- Microsoft Q1 FY2025 (Oct 30, 2024)
- Alphabet Q3 2024 (Oct 29, 2024)
- Amazon Q3 2024 (Oct 31, 2024)
- Meta Q3 2024 (Oct 30, 2024)

**Steps:**
```bash
# 1. Get earnings data via Exa.ai
npm run seed:company -- AAPL Q4 2024

# 2. Create Remotion composition
# - Add transcript
# - Add revenue/EPS charts
# - Add audio narration

# 3. Render on GPU machine
npm run render -- --ticker=AAPL --quarter=Q4 --year=2024

# 4. Upload to R2
rclone copy out/AAPL-Q4-2024.mp4 earninglens:AAPL/videos/

# 5. Upload to YouTube
npm run youtube:upload -- --video=AAPL-Q4-2024

# 6. Update database
UPDATE videos SET youtube_id = 'NEW_ID', is_custom = true WHERE slug = 'aapl-q4-2024';
```

### Phase 0.3: Iterate & Replace (Week 1)

**Replace 1 video per day:**
- Day 1: AAPL (custom video)
- Day 2: MSFT
- Day 3: GOOGL
- Day 4: AMZN
- Day 5: META

**Track in database:**
```sql
SELECT ticker, is_custom, youtube_id FROM videos;

-- Result:
-- AAPL | true  | new_custom_id
-- MSFT | false | existing_youtube_id  ← Next to replace
-- GOOGL| false | existing_youtube_id
```

### Phase 1: Foundation (Days 1-2)
1. **Set up monorepo** (web, api, dashboard, studio, insights)
2. **Initialize databases** (Neon PostgreSQL)
3. **Configure Better Auth** (Google One Tap)
4. **Set up R2 bucket** (`earninglens`)
5. **Seed with existing YouTube videos** (50 videos in 4 hours)

### Phase 2: First Custom Video (Days 2-3)
1. **Set up Exa.ai** (get earnings data for AAPL Q4 2024)
2. **Create Remotion template** (earnings video composition)
3. **Render first video** (Apple Q4 2024)
4. **Upload to R2 + YouTube**
5. **Replace placeholder** in database

### Phase 3: Launch Website (Day 5-7) - SIMPLE VERSION

**Purpose:** Showcase YouTube content, NOT a full SaaS yet

1. **Build simple landing page**
   - Grid of YouTube videos (embedded)
   - Links to YouTube channel
   - NO login, NO paywall (for now)
   - Just a portfolio of your work

2. **Deploy to Vercel**
   - Static Next.js site
   - SEO optimized (drive search traffic to YouTube)

**Goal:** Simple website that makes YouTube channel look professional

### Phase 4: YouTube Growth (Weeks 2-6) - PRIMARY FOCUS

**Goal:** Hit YouTube monetization thresholds

**Strategy:**
1. **Upload consistency**
   - 3-5 videos/week (gradual ramp)
   - Week 1: 3 videos
   - Week 2: 5 videos
   - Week 3-4: 7 videos/week
   - Week 5-6: 10 videos/week

2. **YouTube SEO optimization**
   - Keyword-rich titles
   - Detailed descriptions (300+ words)
   - Custom thumbnails (A/B test)
   - Strategic tags
   - End screens (drive to channel)

3. **Engagement tactics**
   - Comment on FinTwit posts during earnings calls
   - Share videos in relevant subreddits (r/investing, r/stocks)
   - Post on X/Twitter with earnings insights
   - Engage with viewers in comments

4. **Track metrics**
   - Daily: Views, watch time, subscribers
   - Weekly: Retention rate, click-through rate
   - Monthly: Progress toward 1000/4000 thresholds

**Milestones:**
- Week 2: 100 subscribers
- Week 4: 500 subscribers
- Week 6: 1000 subscribers ✅ (monetization eligible)
- Week 8: 4000 watch hours ✅ (monetization enabled)

### Phase 5: Scale Videos (Weeks 6-12)

**Once monetization enabled:**
1. **Scale to 100+ videos**
   - Automate more of the pipeline
   - Batch render 10 videos at a time
   - Cover all major earnings (FAANG+)

2. **Improve video quality**
   - Better charts (based on engagement data)
   - Shorter videos (8-10 min sweet spot)
   - Add chapters/timestamps
   - Improve thumbnails

3. **Build community**
   - Live watch parties during earnings calls (future)
   - Community posts
   - Polls and engagement

### Phase 6: Website Subscriptions (Month 3+) - LATER

**Only after YouTube is successful:**
1. Add login (Google One Tap)
2. Add premium features (interactive charts, downloads)
3. Launch freemium model
4. Stripe subscriptions

**But YouTube remains primary revenue source!**

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Owner:** Meera
**Status:** Ready for Development