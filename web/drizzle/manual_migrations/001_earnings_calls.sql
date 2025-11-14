-- Manual Migration: Earnings Calls Table
-- Created: 2025-11-13
-- Reason: drizzle-kit migration failed due to version mismatch
-- Applied to: PostgreSQL 192.168.86.250:54322

-- Create earnings_calls table
CREATE TABLE IF NOT EXISTS markethawkeye.earnings_calls (
  id VARCHAR(255) PRIMARY KEY DEFAULT (
    'ec_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9)
  ),
  cik_str VARCHAR(20) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  quarter VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  audio_url VARCHAR(512),
  youtube_id VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_earnings_calls_symbol ON markethawkeye.earnings_calls(symbol);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_quarter_year ON markethawkeye.earnings_calls(quarter, year);
CREATE INDEX IF NOT EXISTS idx_earnings_calls_unique ON markethawkeye.earnings_calls(cik_str, quarter, year);

-- Comments
COMMENT ON TABLE markethawkeye.earnings_calls IS 'Batch processed earnings call audio files from YouTube';
COMMENT ON COLUMN markethawkeye.earnings_calls.cik_str IS 'SEC Central Index Key';
COMMENT ON COLUMN markethawkeye.earnings_calls.symbol IS 'Stock ticker (e.g., NVDA)';
COMMENT ON COLUMN markethawkeye.earnings_calls.quarter IS 'Fiscal quarter (Q1, Q2, Q3, Q4)';
COMMENT ON COLUMN markethawkeye.earnings_calls.year IS 'Fiscal year';
COMMENT ON COLUMN markethawkeye.earnings_calls.audio_url IS 'Public R2 URL to audio file';
COMMENT ON COLUMN markethawkeye.earnings_calls.youtube_id IS 'Source YouTube video ID';
COMMENT ON COLUMN markethawkeye.earnings_calls.metadata IS 'Flexible metadata from batch processing pipeline (JSONB)';

-- Metadata JSONB structure example:
-- {
--   "company_name": "NVIDIA CORP",
--   "company_slug": "nvidia",
--   "is_earnings_call": true,
--   "speakers": [...],
--   "financial_metrics": [...],
--   "highlights": [...],
--   "job_id": "xw6oCFYNz8c_a328",
--   "batch_name": "nov-13-2025-test",
--   "pipeline_version": "v1",
--   "r2_path": "nvidia/Q3-2025/nov-13-2025-test-xw6oCFYNz8c_a328/audio.mp3",
--   "public_url": "https://...",
--   "source_youtube_url": "https://youtube.com/watch?v=...",
--   "source_youtube_title": "...",
--   "duration_seconds": 3465,
--   "file_size_mb": 52.87
-- }

-- Query examples:
--
-- -- Get all earnings calls for NVDA
-- SELECT * FROM markethawkeye.earnings_calls WHERE symbol = 'NVDA';
--
-- -- Get Q3 2025 earnings calls
-- SELECT * FROM markethawkeye.earnings_calls WHERE quarter = 'Q3' AND year = 2025;
--
-- -- Get earnings calls with specific metadata
-- SELECT * FROM markethawkeye.earnings_calls
-- WHERE metadata->>'pipeline_version' = 'v1'
-- ORDER BY created_at DESC;
--
-- -- Get earnings calls for a batch
-- SELECT * FROM markethawkeye.earnings_calls
-- WHERE metadata->>'batch_name' = 'nov-13-2025-test';
