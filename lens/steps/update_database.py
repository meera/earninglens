"""
Update Database - Insert/update earnings_calls table
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

# Load environment variables (auto-loads .env or .env.production based on DEV_MODE)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from env_loader import get_database_url


def update_database(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update PostgreSQL database with earnings call record

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with database operation status
    """
    # Get confirmed metadata
    confirmed_meta = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})
    company = job_data.get('company', {})

    ticker = confirmed_meta.get('ticker') or company.get('ticker')
    company_name = confirmed_meta.get('company') or company.get('company')
    quarter = confirmed_meta.get('quarter') or company.get('quarter')
    year = confirmed_meta.get('year') or company.get('year')
    job_id = job_data.get('job_id')

    # Get CIK from company database match (if available)
    company_match = job_data.get('company_match', {})
    cik_str = company_match.get('cik_str', '')

    # Get media URL from R2 upload step
    upload_r2_result = job_data.get('processing', {}).get('upload_r2', {})
    media_url = upload_r2_result.get('media_url', '')

    # Get artifacts from upload_artifacts step
    upload_artifacts_result = job_data.get('processing', {}).get('upload_artifacts', {})
    artifacts = upload_artifacts_result.get('artifacts', {})

    # Generate record ID: {TICKER}-{QUARTER}-{YEAR}-{JOB_ID_SUFFIX}
    # Use last 4 chars of job_id for uniqueness
    job_suffix = job_id.split('_')[-1] if '_' in job_id else job_id[-4:]
    record_id = f"{ticker}-{quarter}-{year}-{job_suffix}"

    if not all([ticker, quarter, year]):
        raise ValueError(
            f"Missing required fields: ticker={ticker}, quarter={quarter}, year={year}"
        )

    print(f"💾 Updating database: {record_id}")
    print(f"   CIK: {cik_str or '(none)'}")
    print(f"   Symbol: {ticker}")
    print(f"   Quarter: {quarter}")
    print(f"   Year: {year}")
    print(f"   Media URL: {media_url or '(none)'}")

    # Build metadata JSON
    metadata = {
        'job_id': job_id,
        'company_name': company_name,
        'source': job_data.get('input', {}).get('type', 'unknown'),
        'processed_at': datetime.now().isoformat(),
    }

    # Add YouTube ID if available
    youtube_upload_result = job_data.get('processing', {}).get('upload_youtube', {})
    if youtube_upload_result and youtube_upload_result.get('youtube_id'):
        metadata['youtube_id'] = youtube_upload_result['youtube_id']

    # Load insights from insights.raw.json
    insights = {}
    insights_file = job_data.get('processing', {}).get('extract_insights', {}).get('insights_file')
    if insights_file and Path(insights_file).exists():
        import json
        with open(insights_file, 'r') as f:
            insights_data = json.load(f)
            insights = insights_data.get('insights', {})

    # Build transcripts object (URLs to transcript files in R2)
    transcripts = {}
    if artifacts:
        if 'transcript' in artifacts:
            transcripts['transcript_url'] = artifacts['transcript'].get('r2_url')
        if 'paragraphs' in artifacts:
            transcripts['paragraphs_url'] = artifacts['paragraphs'].get('r2_url')

    # Build SQL INSERT statement
    # First mark any existing records as not latest
    update_latest_sql = f"""
UPDATE markethawkeye.earnings_calls
SET is_latest = false
WHERE symbol = '{ticker}'
  AND quarter = '{quarter}'
  AND year = {year};
"""

    # Build SQL with proper JSON escaping
    # Use dollar-quoted strings for JSON to avoid escaping issues
    insert_sql = f"""
INSERT INTO markethawkeye.earnings_calls (
    id, cik_str, symbol, quarter, year,
    media_url, is_latest, metadata, artifacts,
    insights, transcripts,
    created_at, updated_at
) VALUES (
    '{record_id}',
    '{cik_str}',
    '{ticker}',
    '{quarter}',
    {year},
    '{media_url}',
    true,
    $metadata${json.dumps(metadata)}$metadata$::jsonb,
    $artifacts${json.dumps(artifacts)}$artifacts$::jsonb,
    $insights${json.dumps(insights)}$insights$::jsonb,
    $transcripts${json.dumps(transcripts)}$transcripts$::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET
    media_url = EXCLUDED.media_url,
    is_latest = EXCLUDED.is_latest,
    metadata = EXCLUDED.metadata,
    artifacts = EXCLUDED.artifacts,
    insights = EXCLUDED.insights,
    transcripts = EXCLUDED.transcripts,
    updated_at = NOW();
"""

    # Get database URL from environment
    database_url = get_database_url()

    # Execute SQL via psql
    full_sql = update_latest_sql + insert_sql

    cmd = [
        'psql',
        database_url,
        '-c',
        full_sql
    ]

    print(f"🔄 Executing database update...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Database update failed: {result.stderr}")
        raise Exception(f"Database update failed: {result.stderr}")

    print(f"✅ Database updated: {record_id}")
    print(f"   Output: {result.stdout.strip()}")

    return {
        'record_id': record_id,
        'operation': 'upsert',
        'updated_at': datetime.now().isoformat()
    }
