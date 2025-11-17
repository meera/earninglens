"""
Extract Insights Step - Wrapper for extract_insights_structured
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Add parent to path
LENS_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(LENS_DIR))

from extract_insights_structured import extract_earnings_insights, extract_earnings_insights_auto


def extract_insights_step(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract earnings insights (step handler wrapper)

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with insights path
    """
    # Try to get confirmed metadata (if confirm_metadata step ran before this)
    confirmed_meta = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    # If no confirmed metadata, LLM will auto-detect from transcript
    if confirmed_meta:
        company_name = confirmed_meta.get('company')
        ticker = confirmed_meta.get('ticker')
        quarter_only = confirmed_meta.get('quarter')
        year = confirmed_meta.get('year')

        # Combine quarter and year for insights extraction (e.g., "Q4-2025")
        quarter = f"{quarter_only}-{year}"
    else:
        # LLM will auto-detect - pass None for all metadata
        company_name = None
        ticker = None
        quarter = None

    # Find transcript file
    transcript_file = job_dir / "transcripts" / "transcript.json"
    if not transcript_file.exists():
        raise FileNotFoundError(f"Transcript not found: {transcript_file}")

    # Output file for insights
    output_file = job_dir / "insights.raw.json"

    # Call appropriate insights extraction function
    if company_name:
        # Use standard extraction with known metadata
        print(f"📊 Extracting insights for {company_name} ({ticker}) {quarter}")
        insights = extract_earnings_insights(
            transcript_file=transcript_file,
            company_name=company_name,
            ticker=ticker,
            quarter=quarter,
            output_file=output_file
        )
    else:
        # Use auto-detection extraction
        print(f"📊 Extracting insights (LLM will auto-detect company/ticker/quarter)")
        insights = extract_earnings_insights_auto(
            transcript_file=transcript_file,
            output_file=output_file
        )

    # Extract auto-detected metadata from insights if it was auto-detected
    if not company_name and hasattr(insights, 'company_name'):
        company_name = insights.company_name
        ticker = insights.company_ticker if hasattr(insights, 'company_ticker') else None
        quarter = f"{insights.quarter}-{insights.year}" if hasattr(insights, 'quarter') and hasattr(insights, 'year') else None

    # Return result
    return {
        'insights_file': str(output_file),
        'company': company_name or 'Unknown',
        'ticker': ticker or 'N/A',
        'quarter': quarter or 'N/A',
        'metrics_count': len(insights.financial_metrics) if hasattr(insights, 'financial_metrics') else 0,
        'highlights_count': len(insights.highlights) if hasattr(insights, 'highlights') else 0
    }
