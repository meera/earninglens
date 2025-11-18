#!/usr/bin/env python3
"""
MarketHawk Insights Extraction with OpenAI Structured Outputs
Extract earnings call metadata, speaker identification, and insights

Adapted from VideotoBe's transcript_openai_analysis.py
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict
from openai import OpenAI
import json
import re
from pathlib import Path


class Speaker(BaseModel):
    """Speaker identification"""
    speaker_id: str = Field(description="Original speaker ID from transcript (e.g., SPEAKER_00)")
    speaker_name: str = Field(description="Identified speaker name (or 'Unknown' if can't identify)")
    role: Optional[str] = Field(default=None, description="Role (e.g., CEO, CFO, Analyst)")


class FinancialMetric(BaseModel):
    """Financial metric highlight"""
    metric: str = Field(description="Metric name (e.g., Revenue, EPS, Operating Income)")
    value: str = Field(description="Value mentioned (e.g., $94.9B, $1.64)")
    change: Optional[str] = Field(default=None, description="Change vs prior period (e.g., +6% YoY, -3% QoQ)")
    timestamp: int = Field(description="Timestamp in seconds when mentioned")
    context: str = Field(description="Brief context around the metric")


class Highlight(BaseModel):
    """Key highlight or insight"""
    timestamp: int = Field(description="Timestamp in seconds")
    text: str = Field(description="Highlight text (concise, <280 chars)")
    category: Literal["financial", "product", "guidance", "strategy", "qa"] = Field(
        description="Category of highlight"
    )
    speaker: str = Field(description="Speaker who said it")


class Chapter(BaseModel):
    """Video chapter marker"""
    timestamp: int = Field(description="Start time in seconds")
    title: str = Field(description="Chapter title")


class CompanyMention(BaseModel):
    """Company mentioned in the call"""
    name: str = Field(description="Company name")
    ticker: Optional[str] = Field(default=None, description="Stock ticker if mentioned")
    relationship: Literal["competitor", "partner", "customer", "acquisition_target", "subsidiary", "other"] = Field(
        description="Relationship to the reporting company"
    )
    context: str = Field(description="Brief context of mention")


class ProductMention(BaseModel):
    """Product or service mentioned"""
    name: str = Field(description="Product/service name")
    category: Literal["existing", "new_launch", "discontinued", "planned"] = Field(
        description="Product status"
    )
    context: str = Field(description="Context of mention")


class GeographicRegion(BaseModel):
    """Geographic region or market discussed"""
    region: str = Field(description="Region name (e.g., North America, EMEA, China)")
    metrics: Optional[str] = Field(default=None, description="Any metrics mentioned for this region")
    context: str = Field(description="Discussion context")


class ExecutiveMention(BaseModel):
    """Executive or key person mentioned"""
    name: str = Field(description="Person's name")
    title: Optional[str] = Field(default=None, description="Job title/role")
    mention_type: Literal["current_executive", "new_hire", "departure", "board_member", "other"] = Field(
        description="Type of mention"
    )
    context: str = Field(description="Context of mention")


class StrategicInitiative(BaseModel):
    """Strategic initiative or announcement"""
    title: str = Field(description="Initiative name/title")
    category: Literal["product_launch", "acquisition", "partnership", "restructuring", "investment", "regulatory", "other"] = Field(
        description="Type of initiative"
    )
    description: str = Field(description="Brief description")
    timestamp: int = Field(description="When mentioned (seconds)")


class GuidanceMetric(BaseModel):
    """Forward guidance metric"""
    metric: str = Field(description="Metric name (e.g., Revenue, EPS)")
    period: str = Field(description="Guidance period (e.g., Q4 2025, FY2025)")
    guidance: str = Field(description="Guidance value or range")
    change: Optional[Literal["raised", "lowered", "maintained", "new"]] = Field(
        default=None, description="Change from prior guidance"
    )
    context: str = Field(description="Additional context")


class RiskFactor(BaseModel):
    """Risk factor or concern highlighted"""
    risk: str = Field(description="Risk description")
    category: Literal["market", "regulatory", "operational", "competitive", "financial", "other"] = Field(
        description="Risk category"
    )
    severity: Literal["low", "medium", "high"] = Field(description="Implied severity")
    mitigation: Optional[str] = Field(default=None, description="Mitigation strategy if mentioned")


class AnalystConcern(BaseModel):
    """Key analyst question or concern"""
    topic: str = Field(description="Topic/concern")
    analyst_firm: Optional[str] = Field(default=None, description="Analyst's firm if mentioned")
    management_response_summary: str = Field(description="Summary of management's response")
    timestamp: int = Field(description="When asked (seconds)")


class SentimentAnalysis(BaseModel):
    """Overall sentiment and tone analysis"""
    management_tone: Literal["very_bullish", "bullish", "neutral", "cautious", "defensive"] = Field(
        description="Management's overall tone"
    )
    confidence_level: Literal["very_high", "high", "moderate", "low"] = Field(
        description="Management confidence in business outlook"
    )
    analyst_sentiment: Literal["positive", "neutral", "skeptical", "negative"] = Field(
        description="Overall analyst sentiment from Q&A"
    )
    key_themes: List[str] = Field(description="3-5 key themes from the call")
    notable_quotes: List[str] = Field(description="2-3 memorable quotes from executives")


class EarningsInsights(BaseModel):
    """Complete earnings call insights"""
    # Company detection and validation
    is_earnings_call: bool = Field(description="True if this is an actual earnings call, False for product launches, interviews, etc.")
    company_name: str = Field(description="Detected company name from transcript and metadata")
    company_ticker: Optional[str] = Field(default=None, description="Detected stock ticker symbol (e.g., NVDA, AAPL)")
    quarter: str = Field(description="Quarter (e.g., Q3, Q4)")
    year: int = Field(description="Year (e.g., 2025)")

    # Core content insights
    speakers: List[Speaker] = Field(description="All speakers identified in the call")
    financial_metrics: List[FinancialMetric] = Field(description="Key financial metrics mentioned")
    highlights: List[Highlight] = Field(description="5-10 key highlights from the call")
    chapters: List[Chapter] = Field(description="Video chapter markers for major sections")

    # Enhanced entity extraction
    companies_mentioned: List[CompanyMention] = Field(default=[], description="Other companies mentioned (competitors, partners, customers)")
    products_mentioned: List[ProductMention] = Field(default=[], description="Products and services discussed")
    geographic_regions: List[GeographicRegion] = Field(default=[], description="Geographic markets discussed")
    executives_mentioned: List[ExecutiveMention] = Field(default=[], description="Executives or key people mentioned beyond speakers")
    strategic_initiatives: List[StrategicInitiative] = Field(default=[], description="Strategic announcements and initiatives")
    guidance_metrics: List[GuidanceMetric] = Field(default=[], description="Forward guidance provided")
    risk_factors: List[RiskFactor] = Field(default=[], description="Risks and concerns highlighted")
    analyst_concerns: List[AnalystConcern] = Field(default=[], description="Key analyst questions and concerns from Q&A")
    sentiment: SentimentAnalysis = Field(description="Overall sentiment and tone analysis")

    # Narrative outputs
    summary: str = Field(description="2-3 paragraph narrative summary of the call")
    youtube_title: str = Field(description="Optimized YouTube video title")
    youtube_description: str = Field(description="YouTube description with timestamps")


def extract_earnings_insights_auto(
    transcript_file: Path,
    youtube_metadata: Optional[Dict] = None,
    output_file: Optional[Path] = None
) -> EarningsInsights:
    """
    Extract structured insights with auto-detection of company/quarter/year

    Args:
        transcript_file: Path to transcript.json (from WhisperX)
        youtube_metadata: Optional YouTube metadata (title, description, channel)
        output_file: Optional path to save raw OpenAI response

    Returns:
        EarningsInsights object with auto-detected company information
    """
    # Load transcript
    with open(transcript_file, 'r', encoding='utf-8') as f:
        transcript_data = json.load(f)

    # Format transcript for analysis
    formatted_transcript = format_transcript_for_analysis(transcript_data)

    # Build context from YouTube metadata
    metadata_context = ""
    if youtube_metadata:
        metadata_context = f"""
YOUTUBE METADATA:
- Title: {youtube_metadata.get('title', 'N/A')}
- Description: {youtube_metadata.get('description', 'N/A')[:500]}...
- Channel: {youtube_metadata.get('channel', 'N/A')}
"""

    # System prompt
    system_prompt = """You are an expert financial analyst specializing in earnings calls.
Your role is to:
1. VALIDATE if this is an actual earnings call (not a product launch, interview, or other content)
2. DETECT the company name, ticker symbol, quarter, and year from the content
3. Extract key financial metrics, identify speakers, and create structured insights

Be conservative with validation - only mark as earnings call if there are clear financial results discussed."""

    # User prompt with auto-detection
    user_prompt = f"""
Analyze this audio transcript and determine if it is an earnings call.

{metadata_context}

VALIDATION (CRITICAL):
- Is this an actual earnings call with quarterly financial results?
- Or is it a product launch, interview, conference presentation, or other content?
- Set is_earnings_call = True ONLY if financial results are discussed

COMPANY DETECTION:
- Extract company name from transcript or metadata
- Extract stock ticker if mentioned (e.g., NVDA, AAPL, TSLA)
- Determine quarter (Q1, Q2, Q3, Q4) and year (2024, 2025)

SPEAKER IDENTIFICATION:
- Map SPEAKER_00, SPEAKER_01, etc. to actual names
- Identify roles (CEO, CFO, IR Head, Analyst from [Firm])
- Use 'Unknown' only if name truly can't be identified from context

FINANCIAL METRICS:
- Extract key metrics: Revenue, EPS, Operating Income, Free Cash Flow, Margins
- Include exact values and % changes vs prior period
- Note timestamp when mentioned

HIGHLIGHTS:
- 5-10 most important moments from the call
- Financial results, guidance changes, product announcements, strategic shifts
- Include speaker attribution and timestamps

CHAPTERS:
- Create clear chapter markers:
  - Opening Remarks (usually ~0:00)
  - Financial Results (usually after intro)
  - Business Update / Product News
  - Guidance / Outlook
  - Q&A Session
- Use actual timestamps from transcript

ENTITY EXTRACTION (Extract as much structured data as possible):
- Companies Mentioned: Competitors, partners, customers, acquisition targets with relationship context
- Products: All products/services discussed (existing, new launches, discontinued, planned)
- Geographic Regions: Markets discussed with any associated metrics or performance data
- Executives: Key people mentioned (new hires, departures, board members) beyond call speakers
- Strategic Initiatives: Major announcements (acquisitions, partnerships, product launches, restructuring, investments)
- Guidance: All forward-looking metrics with periods and changes from prior guidance
- Risk Factors: Risks highlighted (market, regulatory, operational, competitive, financial) with severity
- Analyst Concerns: Key questions from Q&A with topics, firms, and management response summaries
- Sentiment: Overall tone analysis (management confidence, analyst sentiment, key themes, notable quotes)

SUMMARY:
- 2-3 paragraph narrative covering:
  - Financial performance highlights
  - Strategic announcements
  - Forward guidance
  - Key Q&A themes

YOUTUBE METADATA:
- Title: Optimized for search (include company, ticker, quarter, year)
- Description: Summary + timestamp links to chapters

Transcript:
{formatted_transcript}
"""

    # Call OpenAI with structured output
    client = OpenAI()

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=EarningsInsights,
    )

    insights = completion.choices[0].message.parsed

    # Save raw OpenAI response if output file specified
    if output_file:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            # Include usage stats and metadata
            raw_output = {
                "insights": insights.model_dump(),
                "youtube_metadata": youtube_metadata,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                },
                "model": completion.model,
                "created_at": completion.created
            }
            json.dump(raw_output, f, indent=2, ensure_ascii=False)

    return insights


def extract_earnings_insights(
    transcript_file: Path,
    company_name: str,
    ticker: str,
    quarter: str,
    output_file: Optional[Path] = None
) -> EarningsInsights:
    """
    Extract structured insights from earnings call transcript

    Args:
        transcript_file: Path to transcript.json (from WhisperX)
        company_name: Company name
        ticker: Stock ticker
        quarter: Quarter (e.g., Q3-2025)
        output_file: Optional path to save raw OpenAI response

    Returns:
        EarningsInsights object
    """
    # Load transcript
    with open(transcript_file, 'r', encoding='utf-8') as f:
        transcript_data = json.load(f)

    # Format transcript for analysis
    formatted_transcript = format_transcript_for_analysis(transcript_data)

    # System prompt
    system_prompt = f"""You are an expert financial analyst specializing in earnings calls.
Your role is to extract key financial metrics, identify speakers, and create structured insights
while maintaining accuracy and context.

Focus on:
- Identifying C-suite executives and analysts by name
- Extracting financial metrics with exact values mentioned
- Highlighting strategic announcements and guidance
- Creating clear chapter markers for major sections (Opening Remarks, Financial Results, Guidance, Q&A)
"""

    # Parse quarter and year from quarter string (e.g., "Q3-2025")
    quarter_parts = quarter.split('-')
    quarter_only = quarter_parts[0] if len(quarter_parts) > 0 else quarter
    year_only = int(quarter_parts[1]) if len(quarter_parts) > 1 else 2025

    # User prompt
    user_prompt = f"""
Analyze this {company_name} ({ticker}) {quarter} earnings call transcript.

COMPANY INFORMATION:
- Company Name: {company_name}
- Ticker: {ticker}
- Quarter: {quarter_only}
- Year: {year_only}
- This is a confirmed earnings call (is_earnings_call = True)

SPEAKER IDENTIFICATION:
- Map SPEAKER_00, SPEAKER_01, etc. to actual names
- Identify roles (CEO, CFO, IR Head, Analyst from [Firm])
- Use 'Unknown' only if name truly can't be identified from context

FINANCIAL METRICS:
- Extract key metrics: Revenue, EPS, Operating Income, Free Cash Flow, Margins
- Include exact values and % changes vs prior period
- Note timestamp when mentioned

HIGHLIGHTS:
- 5-10 most important moments from the call
- Financial results, guidance changes, product announcements, strategic shifts
- Include speaker attribution and timestamps

CHAPTERS:
- Create clear chapter markers:
  - Opening Remarks (usually ~0:00)
  - Financial Results (usually after intro)
  - Business Update / Product News
  - Guidance / Outlook
  - Q&A Session
- Use actual timestamps from transcript

ENTITY EXTRACTION (Extract as much structured data as possible):
- Companies Mentioned: Competitors, partners, customers, acquisition targets with relationship context
- Products: All products/services discussed (existing, new launches, discontinued, planned)
- Geographic Regions: Markets discussed with any associated metrics or performance data
- Executives: Key people mentioned (new hires, departures, board members) beyond call speakers
- Strategic Initiatives: Major announcements (acquisitions, partnerships, product launches, restructuring, investments)
- Guidance: All forward-looking metrics with periods and changes from prior guidance
- Risk Factors: Risks highlighted (market, regulatory, operational, competitive, financial) with severity
- Analyst Concerns: Key questions from Q&A with topics, firms, and management response summaries
- Sentiment: Overall tone analysis (management confidence, analyst sentiment, key themes, notable quotes)

SUMMARY:
- 2-3 paragraph narrative covering:
  - Financial performance highlights
  - Strategic announcements
  - Forward guidance
  - Key Q&A themes

YOUTUBE METADATA:
- Title: Optimized for search (include company, ticker, quarter, year)
- Description: Summary + timestamp links to chapters

Transcript:
{formatted_transcript}
"""

    # Call OpenAI with structured output
    client = OpenAI()

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format=EarningsInsights,
    )

    insights = completion.choices[0].message.parsed

    # Save raw OpenAI response if output file specified
    if output_file:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            # Include usage stats
            raw_output = {
                "insights": insights.model_dump(),
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                },
                "model": completion.model,
                "created_at": completion.created
            }
            json.dump(raw_output, f, indent=2, ensure_ascii=False)

    return insights


def format_transcript_for_analysis(transcript_data: Dict) -> str:
    """
    Format WhisperX transcript for OpenAI analysis

    Groups segments by speaker with timestamps
    """
    segments = transcript_data.get("segments", [])

    formatted_lines = []
    current_speaker = None
    current_text = []
    current_start = None

    for segment in segments:
        speaker = segment.get("speaker", "UNKNOWN")
        text = segment.get("text", "").strip()
        start = segment.get("start", 0)

        # Group consecutive segments from same speaker
        if speaker == current_speaker:
            current_text.append(text)
        else:
            # Write previous speaker's text
            if current_speaker and current_text:
                timestamp_str = format_timestamp(current_start)
                speaker_text = " ".join(current_text)
                formatted_lines.append(f"[{timestamp_str}] {current_speaker}: {speaker_text}")

            # Start new speaker
            current_speaker = speaker
            current_text = [text]
            current_start = start

    # Write last speaker
    if current_speaker and current_text:
        timestamp_str = format_timestamp(current_start)
        speaker_text = " ".join(current_text)
        formatted_lines.append(f"[{timestamp_str}] {current_speaker}: {speaker_text}")

    return "\n\n".join(formatted_lines)


def format_timestamp(seconds: float) -> str:
    """Format seconds to MM:SS"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def extract_keywords_from_metric(metric: FinancialMetric) -> List[str]:
    """
    Extract searchable keywords from a financial metric

    Args:
        metric: FinancialMetric object

    Returns:
        List of keywords to search for in word-level transcript
    """
    keywords = []

    # Extract metric name words (e.g., "Paramount Plus" -> ["paramount", "plus"])
    metric_words = re.findall(r'\w+', metric.metric.lower())
    keywords.extend(metric_words)

    # Extract value components (e.g., "$94.9B" -> ["94", "billion"])
    # Strip common symbols and get numbers
    value_clean = re.sub(r'[$,%]', '', metric.value.lower())
    value_words = re.findall(r'\w+', value_clean)
    keywords.extend(value_words)

    # Extract change keywords if present (e.g., "+24% YoY" -> ["24", "percent"])
    if metric.change:
        change_clean = re.sub(r'[+\-%]', '', metric.change.lower())
        change_words = re.findall(r'\w+', change_clean)
        keywords.extend(change_words)

    # Remove very common words that won't help narrow search
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
    keywords = [k for k in keywords if k not in stop_words and len(k) > 1]

    return keywords


def extract_keywords_from_highlight(highlight: Highlight) -> List[str]:
    """
    Extract searchable keywords from a highlight

    Args:
        highlight: Highlight object

    Returns:
        List of keywords to search for
    """
    # Extract meaningful words from highlight text
    text_clean = re.sub(r'[^\w\s]', '', highlight.text.lower())
    words = text_clean.split()

    # Remove stop words and keep substantial words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'was', 'are'}
    keywords = [w for w in words if w not in stop_words and len(w) > 3]

    # Take first 5 most distinctive words
    return keywords[:5]


def refine_timestamp_with_words(
    llm_timestamp: int,
    keywords: List[str],
    transcript_data: Dict,
    window_seconds: int = 30
) -> float:
    """
    Refine LLM-suggested timestamp using word-level transcript data

    Searches within +window_seconds of LLM suggestion for first keyword match.

    Args:
        llm_timestamp: Timestamp suggested by LLM (from paragraph-level)
        keywords: Keywords to search for
        transcript_data: Full transcript with word-level data
        window_seconds: Search window in seconds (forward from llm_timestamp)

    Returns:
        Refined timestamp (or original if no match found)
    """
    if not keywords:
        return llm_timestamp

    # Get all word-level data from segments
    segments = transcript_data.get("segments", [])

    # Search window: llm_timestamp to llm_timestamp + window_seconds
    search_start = llm_timestamp
    search_end = llm_timestamp + window_seconds

    # Build list of all words with timestamps in search window
    word_matches = []

    for segment in segments:
        segment_start = segment.get("start", 0)
        segment_end = segment.get("end", 0)

        # Skip segments outside search window
        if segment_end < search_start or segment_start > search_end:
            continue

        # Check word-level data if available
        words = segment.get("words", [])
        if words:
            for word_obj in words:
                word_text = word_obj.get("word", "").lower().strip()
                word_start = word_obj.get("start", segment_start)

                # Check if word is in search window
                if search_start <= word_start <= search_end:
                    # Check if word matches any keyword
                    for keyword in keywords:
                        if keyword in word_text or word_text in keyword:
                            word_matches.append({
                                'word': word_text,
                                'keyword': keyword,
                                'timestamp': word_start
                            })

    # Return first match timestamp + 0.5s buffer (so overlay appears after word spoken)
    if word_matches:
        first_match = min(word_matches, key=lambda x: x['timestamp'])
        refined_timestamp = first_match['timestamp'] + 0.5
        print(f"  ✓ Refined timestamp: {llm_timestamp}s → {refined_timestamp:.1f}s (matched '{first_match['word']}')")
        return refined_timestamp

    # No match found, return original
    return float(llm_timestamp)


def refine_all_timestamps(insights: EarningsInsights, transcript_data: Dict) -> EarningsInsights:
    """
    Refine all metric and highlight timestamps using word-level data

    Args:
        insights: EarningsInsights from LLM
        transcript_data: Full transcript with word-level data

    Returns:
        EarningsInsights with refined timestamps
    """
    print("\n🔍 Refining timestamps with word-level data...")

    # Refine financial metrics
    print(f"\nRefining {len(insights.financial_metrics)} financial metrics:")
    for metric in insights.financial_metrics:
        keywords = extract_keywords_from_metric(metric)
        print(f"  {metric.metric}: {metric.value} (keywords: {', '.join(keywords[:3])})")
        metric.timestamp = refine_timestamp_with_words(
            metric.timestamp,
            keywords,
            transcript_data,
            window_seconds=30
        )

    # Refine highlights
    print(f"\nRefining {len(insights.highlights)} highlights:")
    for highlight in insights.highlights:
        keywords = extract_keywords_from_highlight(highlight)
        preview = highlight.text[:50] + "..." if len(highlight.text) > 50 else highlight.text
        print(f"  {preview}")
        highlight.timestamp = refine_timestamp_with_words(
            highlight.timestamp,
            keywords,
            transcript_data,
            window_seconds=30
        )

    print("\n✅ Timestamp refinement complete!\n")

    return insights


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract earnings call insights with OpenAI")
    parser.add_argument("transcript_file", help="Path to transcript.json")
    parser.add_argument("--company", required=True, help="Company name")
    parser.add_argument("--ticker", required=True, help="Stock ticker")
    parser.add_argument("--quarter", required=True, help="Quarter (e.g., Q3-2025)")
    parser.add_argument("--output", help="Path to save raw OpenAI response")

    args = parser.parse_args()

    insights = extract_earnings_insights(
        transcript_file=Path(args.transcript_file),
        company_name=args.company,
        ticker=args.ticker,
        quarter=args.quarter,
        output_file=Path(args.output) if args.output else None
    )

    # Print summary
    print("\n" + "="*60)
    print(f"{args.company} ({args.ticker}) {args.quarter} Earnings Call")
    print("="*60)
    print(f"\nSpeakers: {len(insights.speakers)}")
    for speaker in insights.speakers:
        role_str = f" ({speaker.role})" if speaker.role else ""
        print(f"  - {speaker.speaker_name}{role_str}")

    print(f"\nFinancial Metrics: {len(insights.financial_metrics)}")
    for metric in insights.financial_metrics[:5]:  # Show first 5
        print(f"  - {metric.metric}: {metric.value}" + (f" ({metric.change})" if metric.change else ""))

    print(f"\nHighlights: {len(insights.highlights)}")
    print(f"Chapters: {len(insights.chapters)}")
    print(f"\nYouTube Title: {insights.youtube_title}")
