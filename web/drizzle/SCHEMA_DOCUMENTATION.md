# Database Schema Documentation

## Overview

MarketHawk uses PostgreSQL with the `markethawkeye` schema. The database schema is defined in TypeScript using Drizzle ORM.

**Primary Schema File**: `web/lib/db/schema.ts`

## Database Environments

### Local Development
- **Host**: 192.168.86.250
- **Port**: 54322
- **Database**: postgres
- **Schema**: markethawkeye
- **User**: postgres

### Production (Neon)
- **Connection**: via DATABASE_URL in .env.prod
- **Schema**: markethawkeye

## Tables

### Core Tables (Future Video Pipeline)

#### companies
Primary companies table tracking public companies we analyze.

**Columns**:
- `id` (PK): Company ID (e.g., comp_aapl_a1b2)
- `ticker`: Stock ticker (e.g., AAPL) - UNIQUE
- `data`: JSONB - Company metadata
- `created_at`, `updated_at`: Timestamps

**Indexes**: ticker

#### sources
Raw materials from the internet (audio, video, documents).

**Columns**:
- `id` (PK): Source ID
- `company_id` (FK): Reference to companies
- `type`: Source type (audio, video, document, transcript, sec_filing)
- `status`: Processing status (pending, downloading, downloaded, processing, ready, failed)
- `data`: JSONB - Source metadata
- `created_at`, `updated_at`: Timestamps

**Indexes**: company_id, type, status

#### artifacts
Generated content (charts, thumbnails, processed audio).

**Columns**:
- `id` (PK): Artifact ID
- `company_id` (FK): Reference to companies
- `type`: Artifact type (chart, thumbnail, audio_clip, transcript_processed, overlay)
- `status`: Generation status (generating, ready, failed)
- `data`: JSONB - Artifact metadata
- `created_at`, `updated_at`: Timestamps

**Indexes**: company_id, type, status

#### videos
Final rendered videos for earnings calls.

**Columns**:
- `id` (PK): Video ID
- `company_id` (FK): Reference to companies
- `slug`: URL slug (e.g., aapl-q4-2024) - UNIQUE
- `status`: Video status (draft, sources_gathering, rendering, uploading, published, failed)
- `quarter`: Fiscal quarter (Q1-Q4)
- `year`: Fiscal year
- `youtube_id`: YouTube video ID
- `data`: JSONB - Video metadata
- `created_at`, `published_at`, `updated_at`: Timestamps

**Indexes**: company_id, slug, status, youtube_id, (quarter, year)

### Analytics Tables

#### video_views
Track video views and watch time.

**Columns**:
- `id` (PK): View ID
- `video_id` (FK): Reference to videos
- `user_id`: Better Auth user ID (nullable for anonymous)
- `session_id`: Anonymous session tracking
- `data`: JSONB - View metadata (source, device, duration)
- `created_at`: Timestamp

**Indexes**: video_id, user_id, created_at

#### video_engagement
User interactions (play, pause, chart clicks, downloads).

**Columns**:
- `id` (PK): Engagement ID
- `video_id` (FK): Reference to videos
- `user_id`: Better Auth user ID (nullable)
- `event_type`: Event type (play, pause, chart_interact, download, paywall_hit)
- `data`: JSONB - Event-specific data
- `created_at`: Timestamp

**Indexes**: video_id, event_type, created_at

#### click_throughs
YouTube → Website conversion tracking.

**Columns**:
- `id` (PK): Click-through ID
- `video_id` (FK): Reference to videos
- `user_id`: Better Auth user ID (nullable)
- `data`: JSONB - Click metadata (destination, source, device)
- `created_at`: Timestamp

**Indexes**: video_id, created_at

### Marketing Tables

#### newsletter_subscribers
Email list for updates.

**Columns**:
- `id` (PK): Subscriber ID
- `email`: Email address - UNIQUE
- `subscribed_at`: Subscription timestamp
- `confirmed_at`: Email confirmation timestamp
- `unsubscribed_at`: Unsubscribe timestamp

**Indexes**: email

### Batch Processing Tables

#### earnings_calls ✅ MANUALLY CREATED
Batch processed earnings call audio files from YouTube.

**Status**: ✅ Created manually via SQL (2025-11-13)
**Migration File**: `web/drizzle/manual_migrations/001_earnings_calls.sql`

**Columns**:
- `id` (PK): Earnings call ID (auto-generated: ec_timestamp_random)
- `cik_str`: SEC Central Index Key (NOT NULL)
- `symbol`: Stock ticker (e.g., NVDA) (NOT NULL)
- `quarter`: Fiscal quarter (Q1, Q2, Q3, Q4) (NOT NULL)
- `year`: Fiscal year (NOT NULL)
- `audio_url`: Public R2 URL to audio file
- `youtube_id`: Source YouTube video ID
- `metadata`: JSONB - Flexible metadata from pipeline
- `created_at`, `updated_at`: Timestamps

**Indexes**:
- symbol
- (quarter, year)
- (cik_str, quarter, year) - UNIQUE constraint

**Metadata JSONB Structure**:
```json
{
  "company_name": "NVIDIA CORP",
  "company_slug": "nvidia",
  "is_earnings_call": true,
  "speakers": [...],
  "financial_metrics": [...],
  "highlights": [...],
  "job_id": "xw6oCFYNz8c_a328",
  "batch_name": "nov-13-2025-test",
  "pipeline_version": "v1",
  "r2_path": "nvidia/Q3-2025/nov-13-2025-test-xw6oCFYNz8c_a328/audio.mp3",
  "public_url": "https://...",
  "source_youtube_url": "https://youtube.com/watch?v=...",
  "source_youtube_title": "...",
  "duration_seconds": 3465,
  "file_size_mb": 52.87
}
```

**Populated By**: `lens/batch_processor.py` (step 8: update_db)

**Query Examples**:
```sql
-- Get all earnings calls for NVDA
SELECT * FROM markethawkeye.earnings_calls WHERE symbol = 'NVDA';

-- Get Q3 2025 earnings calls
SELECT * FROM markethawkeye.earnings_calls WHERE quarter = 'Q3' AND year = 2025;

-- Get earnings calls with specific metadata
SELECT * FROM markethawkeye.earnings_calls
WHERE metadata->>'pipeline_version' = 'v1'
ORDER BY created_at DESC;

-- Get earnings calls for a batch
SELECT * FROM markethawkeye.earnings_calls
WHERE metadata->>'batch_name' = 'nov-13-2025-test';
```

## TypeScript Types

All tables have corresponding TypeScript types exported from `schema.ts`:

```typescript
import { EarningsCall, NewEarningsCall } from '@/lib/db/schema';

// SELECT query result
const call: EarningsCall = await db.query.earningsCalls.findFirst({...});

// INSERT data
const newCall: NewEarningsCall = {
  cikStr: '1045810',
  symbol: 'NVDA',
  quarter: 'Q3',
  year: 2025,
  audioUrl: 'https://...',
  youtubeId: 'xw6oCFYNz8c',
  metadata: {...}
};
```

## Manual Migrations

Due to drizzle-kit version mismatch, some tables were created manually via SQL.

**Manual Migration Directory**: `web/drizzle/manual_migrations/`

### Applied Migrations:
1. ✅ **001_earnings_calls.sql** - Created 2025-11-13

See `web/drizzle/manual_migrations/README.md` for details.

## Schema Maintenance

### Adding New Tables

1. **Update TypeScript schema**: Edit `web/lib/db/schema.ts`
2. **Generate migration**: `npm run db:generate` (if drizzle-kit is working)
3. **Apply migration**: `npm run db:migrate`
4. **Or manual SQL**: Create SQL file in `manual_migrations/`, apply with psql
5. **Document**: Update this file and manual_migrations/README.md

### Verifying Schema Sync

```bash
# Check TypeScript schema matches database
cd web
npx drizzle-kit introspect

# Check specific table
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "\d markethawkeye.earnings_calls"
```

## Production Deployment

When deploying schema changes to production (Neon):

1. **Test locally first**: Apply to local database at 192.168.86.250:54322
2. **Backup production**: Create snapshot in Neon dashboard
3. **Apply migration**: Run SQL or drizzle migration
4. **Verify**: Check tables and indexes exist
5. **Document**: Update this file with production deployment date

## Troubleshooting

### Drizzle Migration Fails
- Check drizzle-orm and drizzle-kit versions match
- Use manual SQL migration as fallback
- Document in `manual_migrations/`

### Schema Mismatch
- Compare TypeScript schema.ts with actual database
- Use `\d table_name` in psql to inspect tables
- Use drizzle-kit introspect to generate schema from database

### Connection Issues
- Verify DATABASE_URL in .env
- Check PostgreSQL is running: `pg_isready -h 192.168.86.250 -p 54322`
- Check network access to database server
