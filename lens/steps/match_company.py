"""
Match Company - Fuzzy match company name/ticker against companies database
"""

from pathlib import Path
from typing import Dict, Any
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from lib.fuzzy_match import load_matcher


def match_company(job_dir: Path, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Match company name/ticker against companies database to get CIK

    Args:
        job_dir: Job directory path
        job_data: Job data dict

    Returns:
        Result dict with company_match data
    """
    # Get confirmed metadata (from interactive confirmation step)
    confirmed_meta = job_data.get('processing', {}).get('confirm_metadata', {}).get('confirmed', {})

    company_name = confirmed_meta.get('company')
    ticker = confirmed_meta.get('ticker')

    if not company_name and not ticker:
        print("⚠️  No company name or ticker found in confirmed metadata")
        return {
            'company_match': None,
            'matched': False
        }

    print(f"🔍 Matching company: {company_name} ({ticker})")

    # Load company matcher
    matcher = load_matcher()

    # Match company
    match = matcher.match(company_name, ticker, min_score=80.0)

    if match:
        print(f"✅ Company matched:")
        print(f"   Name: {match.name}")
        print(f"   Ticker: {match.symbol}")
        print(f"   CIK: {match.cik_str}")
        print(f"   Match type: {match.match_type}")
        print(f"   Score: {match.score:.1f}%")

        return {
            'company_match': {
                'cik_str': match.cik_str,
                'symbol': match.symbol,
                'name': match.name,
                'slug': match.slug,
                'metadata': match.metadata,
                'score': match.score,
                'match_type': match.match_type
            },
            'matched': True
        }
    else:
        print(f"⚠️  No company match found (tried: {company_name}, {ticker})")
        return {
            'company_match': None,
            'matched': False
        }
