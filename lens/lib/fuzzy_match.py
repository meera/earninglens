#!/usr/bin/env python3
"""
Fuzzy matching utility for company names against companies_master.csv

Uses rapidfuzz for fast fuzzy string matching to match GPT-detected company names
against the 7,372 companies in the database.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import csv
import json
from dataclasses import dataclass
from rapidfuzz import fuzz, process


@dataclass
class CompanyMatch:
    """Result of fuzzy matching"""
    cik_str: str
    symbol: str
    name: str
    slug: str
    metadata: Dict
    score: float  # 0-100 confidence score
    match_type: str  # 'exact_ticker', 'exact_name', 'fuzzy_name'


class CompanyMatcher:
    """Fuzzy matcher for company names and tickers"""

    def __init__(self, companies_csv: Path):
        """
        Initialize matcher with companies database

        Args:
            companies_csv: Path to companies_master.csv
        """
        self.companies = []
        self.ticker_index = {}  # Fast lookup by ticker
        self.name_index = {}    # Fast lookup by exact name

        # Load companies from CSV
        with open(companies_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                company = {
                    'cik_str': row['cik_str'],
                    'symbol': row['symbol'],
                    'name': row['name'],
                    'slug': row['slug'],
                    'metadata': json.loads(row.get('metadata_json', '{}'))
                }
                self.companies.append(company)

                # Build indexes
                self.ticker_index[row['symbol'].upper()] = company
                self.name_index[row['name'].upper()] = company

    def match(
        self,
        company_name: str,
        ticker: Optional[str] = None,
        min_score: float = 80.0
    ) -> Optional[CompanyMatch]:
        """
        Match company name and/or ticker against database

        Args:
            company_name: Detected company name from GPT
            ticker: Optional detected ticker symbol
            min_score: Minimum fuzzy match score (0-100)

        Returns:
            CompanyMatch if found, None if no good match
        """
        # Strategy 1: Exact ticker match (highest confidence)
        if ticker:
            ticker_upper = ticker.upper()
            if ticker_upper in self.ticker_index:
                company = self.ticker_index[ticker_upper]
                return CompanyMatch(
                    cik_str=company['cik_str'],
                    symbol=company['symbol'],
                    name=company['name'],
                    slug=company['slug'],
                    metadata=company['metadata'],
                    score=100.0,
                    match_type='exact_ticker'
                )

        # Strategy 2: Exact name match
        name_upper = company_name.upper()
        if name_upper in self.name_index:
            company = self.name_index[name_upper]
            return CompanyMatch(
                cik_str=company['cik_str'],
                symbol=company['symbol'],
                name=company['name'],
                slug=company['slug'],
                metadata=company['metadata'],
                score=100.0,
                match_type='exact_name'
            )

        # Strategy 3: Fuzzy name match
        best_match = self._fuzzy_match_name(company_name, min_score)
        if best_match:
            return best_match

        return None

    def _fuzzy_match_name(
        self,
        company_name: str,
        min_score: float
    ) -> Optional[CompanyMatch]:
        """
        Fuzzy match company name using rapidfuzz

        Args:
            company_name: Company name to match
            min_score: Minimum acceptable score

        Returns:
            CompanyMatch if good match found, None otherwise
        """
        # Clean company name (remove common suffixes)
        cleaned_name = self._clean_company_name(company_name)

        # Build list of company names for fuzzy matching
        company_names = [c['name'] for c in self.companies]

        # Use rapidfuzz to find best match
        # Use token_sort_ratio for robustness against word order
        result = process.extractOne(
            cleaned_name,
            company_names,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=min_score
        )

        if result:
            matched_name, score, idx = result
            company = self.companies[idx]

            return CompanyMatch(
                cik_str=company['cik_str'],
                symbol=company['symbol'],
                name=company['name'],
                slug=company['slug'],
                metadata=company['metadata'],
                score=score,
                match_type='fuzzy_name'
            )

        return None

    def _clean_company_name(self, name: str) -> str:
        """
        Clean company name for better fuzzy matching

        Removes common suffixes like Inc., Corp., Ltd., etc.

        Args:
            name: Raw company name

        Returns:
            Cleaned company name
        """
        # Remove common suffixes
        suffixes = [
            'Inc.', 'Inc', 'Corporation', 'Corp.', 'Corp',
            'Limited', 'Ltd.', 'Ltd', 'LLC', 'L.L.C.',
            'LP', 'L.P.', 'PLC', 'P.L.C.', 'Co.', 'Company',
            'Group', 'Holdings', 'International', 'Incorporated'
        ]

        cleaned = name
        for suffix in suffixes:
            # Remove suffix with comma (e.g., "Apple, Inc.")
            cleaned = cleaned.replace(f', {suffix}', '')
            # Remove suffix without comma (e.g., "Apple Inc")
            if cleaned.endswith(f' {suffix}'):
                cleaned = cleaned[:-len(f' {suffix}')]

        return cleaned.strip()

    def match_batch(
        self,
        companies: List[Tuple[str, Optional[str]]],
        min_score: float = 80.0
    ) -> List[Optional[CompanyMatch]]:
        """
        Match multiple companies in batch

        Args:
            companies: List of (company_name, ticker) tuples
            min_score: Minimum fuzzy match score

        Returns:
            List of CompanyMatch results (None for no match)
        """
        results = []
        for company_name, ticker in companies:
            match = self.match(company_name, ticker, min_score)
            results.append(match)
        return results


def load_matcher(companies_csv: Optional[Path] = None) -> CompanyMatcher:
    """
    Load CompanyMatcher with default companies database

    Args:
        companies_csv: Optional path to companies CSV
                       (defaults to data/companies_master.csv)

    Returns:
        CompanyMatcher instance
    """
    if companies_csv is None:
        # Default to data/companies_master.csv relative to project root
        project_root = Path(__file__).parent.parent.parent
        companies_csv = project_root / 'data' / 'companies_master.csv'

    return CompanyMatcher(companies_csv)


if __name__ == '__main__':
    # Demo usage
    import argparse

    parser = argparse.ArgumentParser(description='Test fuzzy company matching')
    parser.add_argument('company_name', help='Company name to match')
    parser.add_argument('--ticker', help='Optional ticker symbol')
    parser.add_argument('--csv', help='Path to companies_master.csv')
    parser.add_argument('--min-score', type=float, default=80.0,
                        help='Minimum match score (default: 80)')

    args = parser.parse_args()

    # Load matcher
    matcher = load_matcher(Path(args.csv) if args.csv else None)

    print(f"\n🔍 Matching: '{args.company_name}'" +
          (f" (ticker: {args.ticker})" if args.ticker else ""))
    print(f"Database: {len(matcher.companies)} companies")
    print(f"Min score: {args.min_score}\n")

    # Perform match
    result = matcher.match(args.company_name, args.ticker, args.min_score)

    if result:
        print(f"✅ MATCH FOUND:")
        print(f"   Type: {result.match_type}")
        print(f"   Score: {result.score:.1f}%")
        print(f"   Company: {result.name}")
        print(f"   Ticker: {result.symbol}")
        print(f"   CIK: {result.cik_str}")
        print(f"   Slug: {result.slug}")
        if result.metadata.get('sector'):
            print(f"   Sector: {result.metadata['sector']}")
        if result.metadata.get('market_cap'):
            market_cap_b = result.metadata['market_cap'] / 1e9
            print(f"   Market Cap: ${market_cap_b:.1f}B")
    else:
        print(f"❌ NO MATCH FOUND")
        print(f"   Try lowering --min-score or check company name")
