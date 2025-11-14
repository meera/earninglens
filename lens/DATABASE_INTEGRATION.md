# Database Integration - Batch Processing Pipeline

## Overview

The batch processing pipeline (Step 8: Update DB) inserts records into the `markethawkeye.earnings_calls` table after successfully processing each earnings call.

## Database Configuration

**Local Development Database**:
- Host: 192.168.86.250
- Port: 54322
- Database: postgres
- Schema: markethawkeye
- User: postgres
- Password: Set in PGPASSWORD environment variable

**Environment Variables** (`.env`):
```bash
DATABASE_URL="postgresql://postgres:postgres@192.168.86.250:54322/postgres"
PGPASSWORD="postgres"  # Required for psql subprocess calls
```

## Table Schema

**Table**: `markethawkeye.earnings_calls`

**Columns**:
- `id` (PK): Auto-generated (ec_timestamp_random)
- `cik_str`: SEC Central Index Key (from fuzzy match)
- `symbol`: Stock ticker (e.g., NVDA)
- `quarter`: Fiscal quarter (Q1, Q2, Q3, Q4)
- `year`: Fiscal year
- `audio_url`: Public R2 URL to audio.mp3
- `youtube_id`: Source YouTube video ID
- `metadata`: JSONB - All pipeline data
- `created_at`, `updated_at`: Timestamps

**Indexes**:
- idx_earnings_calls_symbol
- idx_earnings_calls_quarter_year
- idx_earnings_calls_unique (cik_str, quarter, year)

**TypeScript Schema**: `web/lib/db/schema.ts`

## Data Flow

### Step 8: Update DB (batch_processor.py)

```python
def update_db(self, job: Dict) -> bool:
    """
    Update PostgreSQL database with earnings call metadata

    Inserts record into markethawkeye.earnings_calls table
    """
    # Extract data from job
    company_match = job['company_match']
    insights = job['insights']
    r2_upload = job['r2_upload']
    audio_file = job['audio_file']

    # Prepare metadata JSONB
    metadata = {
        'company_name': company_match['name'],
        'company_slug': company_match['slug'],
        'is_earnings_call': insights['is_earnings_call'],
        'speakers': insights.get('speakers', []),
        'financial_metrics': insights.get('financial_metrics', []),
        'highlights': insights.get('highlights', []),
        'job_id': job['job_id'],
        'batch_name': self.batch_name,
        'pipeline_version': self.version,
        'r2_path': r2_upload['path'],
        'public_url': r2_upload['public_url'],
        'source_youtube_url': f"https://youtube.com/watch?v={job['youtube_id']}",
        'source_youtube_title': job.get('youtube_metadata', {}).get('title', ''),
        'duration_seconds': audio_file.get('duration_seconds'),
        'file_size_mb': audio_file['size_mb'],
    }

    # Execute INSERT via psql
    psql_command = f"""
    INSERT INTO markethawkeye.earnings_calls
    (cik_str, symbol, quarter, year, audio_url, youtube_id, metadata)
    VALUES (
        '{company_match['cik_str']}',
        '{company_match['symbol']}',
        '{insights['quarter']}',
        {insights['year']},
        '{r2_upload['public_url']}',
        '{job['youtube_id']}',
        '{json.dumps(metadata)}'::jsonb
    );
    """
```

### Metadata Structure

The `metadata` JSONB column contains all pipeline processing results:

```json
{
  "company_name": "NVIDIA CORP",
  "company_slug": "nvidia",
  "is_earnings_call": true,

  "speakers": [
    {
      "name": "Jensen Huang",
      "role": "CEO",
      "word_count": 5234
    }
  ],

  "financial_metrics": [
    {
      "metric": "Revenue",
      "value": "$18.1 billion",
      "context": "Record quarterly revenue...",
      "timestamp_seconds": 145.5
    }
  ],

  "highlights": [
    {
      "text": "Data center revenue grew 427% year-over-year",
      "timestamp_seconds": 234.2
    }
  ],

  "job_id": "xw6oCFYNz8c_a328",
  "batch_name": "nov-13-2025-test",
  "pipeline_version": "v1",

  "r2_path": "nvidia/Q3-2025/nov-13-2025-test-xw6oCFYNz8c_a328/audio.mp3",
  "public_url": "https://a8e524fbf66f8c16fe95c513c6ef5dac.r2.cloudflarestorage.com/markeyhawkeye/nvidia/Q3-2025/nov-13-2025-test-xw6oCFYNz8c_a328/audio.mp3",

  "source_youtube_url": "https://youtube.com/watch?v=xw6oCFYNz8c",
  "source_youtube_title": "$NVDA NVIDIA Q3 2025 Earnings Conference Call",

  "duration_seconds": 3465,
  "file_size_mb": 52.87
}
```

## Querying Data

### Using psql (CLI)

```bash
# Get all earnings calls
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "SELECT symbol, quarter, year, audio_url FROM markethawkeye.earnings_calls ORDER BY created_at DESC;"

# Get earnings calls for specific batch
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM markethawkeye.earnings_calls WHERE metadata->>'batch_name' = 'nov-13-2025-test';"

# Get earnings calls with financial metrics
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "SELECT symbol, quarter, year, jsonb_array_length(metadata->'financial_metrics') as metric_count FROM markethawkeye.earnings_calls;"
```

### Using TypeScript (Next.js App)

```typescript
import { db } from '@/lib/db';
import { earningsCalls } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Get all earnings calls for NVDA
const nvdaCalls = await db.select()
  .from(earningsCalls)
  .where(eq(earningsCalls.symbol, 'NVDA'))
  .orderBy(earningsCalls.year, earningsCalls.quarter);

// Get Q3 2025 earnings calls
const q3Calls = await db.select()
  .from(earningsCalls)
  .where(and(
    eq(earningsCalls.quarter, 'Q3'),
    eq(earningsCalls.year, 2025)
  ));

// Access metadata JSONB
const call = await db.query.earningsCalls.findFirst({
  where: eq(earningsCalls.symbol, 'NVDA')
});

console.log(call.metadata.company_name); // "NVIDIA CORP"
console.log(call.metadata.financial_metrics); // Array of metrics
console.log(call.metadata.speakers); // Array of speakers
```

## Production Deployment

### Sync Local → Production (Neon)

**Option 1: pg_dump + psql** (Recommended for initial sync)

```bash
# Dump earnings_calls table from local
PGPASSWORD=postgres pg_dump \
  -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -t markethawkeye.earnings_calls \
  --data-only \
  --column-inserts \
  > earnings_calls_dump.sql

# Load into production (Neon)
psql $NEON_DATABASE_URL < earnings_calls_dump.sql
```

**Option 2: Incremental Sync** (Future automation)

```python
# Sync only new records (where created_at > last_sync)
# TODO: Implement incremental sync script
```

### Verify Production Data

```bash
# Check count matches
psql $NEON_DATABASE_URL -c "SELECT COUNT(*) FROM markethawkeye.earnings_calls;"

# Check recent records
psql $NEON_DATABASE_URL -c "SELECT symbol, quarter, year FROM markethawkeye.earnings_calls ORDER BY created_at DESC LIMIT 10;"
```

## Error Handling

### Common Issues

1. **Password prompt during batch processing**
   - **Cause**: PGPASSWORD not set in environment
   - **Fix**: Add `PGPASSWORD="postgres"` to `.env`

2. **Table doesn't exist**
   - **Cause**: Manual migration not applied
   - **Fix**: Run `web/drizzle/manual_migrations/001_earnings_calls.sql`

3. **Duplicate key violation**
   - **Cause**: Same company/quarter/year already exists
   - **Fix**: Pipeline handles duplicates, check for existing records

4. **JSONB syntax errors**
   - **Cause**: Invalid JSON in metadata
   - **Fix**: Validate JSON before INSERT, use `json.dumps()`

### Debugging

```bash
# Check if table exists
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "\dt markethawkeye.*"

# Check table schema
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "\d markethawkeye.earnings_calls"

# Check recent inserts
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres \
  -c "SELECT id, symbol, quarter, year, created_at FROM markethawkeye.earnings_calls ORDER BY created_at DESC LIMIT 5;"
```

## Future Enhancements

- [ ] Incremental sync script (local → production)
- [ ] Database update retry logic with exponential backoff
- [ ] Batch INSERT for multiple records (performance optimization)
- [ ] Database health checks before processing
- [ ] Automated production sync on batch completion
- [ ] Database migration from manual SQL to drizzle-kit
