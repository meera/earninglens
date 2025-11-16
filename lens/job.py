#!/usr/bin/env python3
"""
MarketHawk Job Manager
Single source of truth: job.yaml

Usage:
    # Create new job
    python job.py create --url "https://youtube.com/..." --ticker PLTR --quarter Q3-2025

    # Process job (all steps)
    python job.py process job_001_pltr_q3_2025

    # Run specific step
    python job.py process job_001_pltr_q3_2025 --step transcribe

    # Check status
    python job.py status job_001_pltr_q3_2025

    # List all jobs
    python job.py list
"""

import sys
import os
import argparse
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
import json

# Directories
LENS_DIR = Path(__file__).parent
PROJECT_ROOT = LENS_DIR.parent
JOBS_DIR = Path(os.getenv("JOBS_DIR", "/var/markethawk/jobs"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@192.168.86.250:54322/postgres")

# Collocation preference: Everything for a job in one directory


def lookup_company(ticker: str) -> Optional[Dict[str, Any]]:
    """Lookup company by ticker from database."""
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT symbol, name, slug, cik_str, metadata
            FROM markethawkeye.companies
            WHERE UPPER(symbol) = UPPER(%s)
            LIMIT 1
        """, (ticker,))

        row = cursor.fetchone()
        conn.close()

        if row:
            symbol, name, slug, cik_str, metadata = row
            return {
                'symbol': symbol,
                'name': name,
                'slug': slug,
                'cik_str': cik_str,
                'metadata': metadata or {}
            }

        return None

    except Exception as e:
        print(f"⚠️  Database lookup failed: {e}")
        print(f"   Continuing without company enrichment...")
        return None


class JobManager:
    """Manage job lifecycle"""

    def __init__(self, job_file: Path):
        self.job_file = job_file
        self.job = self._load()

    def _load(self) -> Dict[str, Any]:
        """Load job from YAML"""
        if not self.job_file.exists():
            raise FileNotFoundError(f"Job file not found: {self.job_file}")

        with open(self.job_file, 'r') as f:
            return yaml.safe_load(f)

    def _save(self):
        """Save job to YAML"""
        self.job_file.parent.mkdir(parents=True, exist_ok=True)

        with open(self.job_file, 'w') as f:
            yaml.dump(self.job, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    def update_step(self, step: str, status: str, **data):
        """Update step status and data"""
        # Initialize step if it doesn't exist (backward compatibility)
        if step not in self.job['processing']:
            self.job['processing'][step] = {}

        self.job['processing'][step]['status'] = status

        # Merge additional data
        for key, value in data.items():
            self.job['processing'][step][key] = value

        self._save()

    def get_step(self, step: str) -> Dict[str, Any]:
        """Get step data"""
        return self.job['processing'].get(step, {})

    def get_value(self, step: str, key: str) -> Any:
        """Get specific value from step"""
        return self.job['processing'].get(step, {}).get(key)

    def set_status(self, status: str):
        """Set overall job status"""
        self.job['status'] = status
        self._save()


def create_job(args):
    """Create new job"""

    # Workflow must be explicitly specified
    workflow = args.workflow
    if not workflow:
        print("Error: --workflow is required")
        print("Available workflows:")
        print("  manual-audio    - For manually downloaded MP3/audio files")
        print("  youtube-video   - For YouTube videos (standard pipeline)")
        print("  audio-batch     - For batch processing multiple videos")
        sys.exit(1)

    # Generate job ID
    ticker = args.ticker.upper() if args.ticker else 'UNKNOWN'
    quarter = args.quarter if args.quarter else 'Q0-0000'
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    job_id = f"{ticker}_{quarter}_{timestamp}".replace("-", "_")

    # Lookup company from database (if ticker provided)
    company_data = None
    if args.ticker:
        print(f"🔍 Looking up company: {ticker}")
        company_data = lookup_company(ticker)

        if company_data:
            print(f"✅ Found: {company_data['name']} ({company_data['symbol']})")
            print(f"   Slug: {company_data['slug']}")
            print(f"   CIK: {company_data['cik_str']}")
            if company_data['metadata'].get('sector'):
                print(f"   Sector: {company_data['metadata']['sector']}")
        else:
            print(f"⚠️  Company not found in database: {ticker}")
            print(f"   Job will be created with limited company info")

    # Determine input type
    if args.audio:
        input_type = 'audio_file'
        input_value = args.audio
        audio_source = args.audio
    elif args.url:
        if 'youtube.com' in args.url or 'youtu.be' in args.url:
            input_type = 'youtube_url'
        elif args.url.endswith('.m3u8') or 'm3u8' in args.url:
            input_type = 'hls_stream'
        else:
            input_type = 'http_url'
        input_value = args.url
        audio_source = None
    elif args.file:
        input_type = 'local_file'
        input_value = args.file
        audio_source = None
    else:
        print("Error: Must provide --url, --file, or --audio")
        sys.exit(1)

    # Load template
    template_file = LENS_DIR / "job.yaml.template"
    with open(template_file, 'r') as f:
        job = yaml.safe_load(f)

    # Update job data
    job['job_id'] = job_id
    job['workflow'] = workflow
    job['created_at'] = datetime.now().isoformat()
    job['input']['type'] = input_type
    job['input']['value'] = input_value

    # For manual-audio workflow, store audio source path
    if audio_source:
        job['audio_source'] = audio_source

    # Update company fields (may be populated later for manual-audio)
    if args.ticker:
        job['company']['ticker'] = ticker
    if args.quarter:
        job['company']['quarter'] = quarter

    # Add company data from database
    if company_data:
        job['company']['name'] = company_data['name']
        job['company']['slug'] = company_data['slug']
        job['company']['cik_str'] = company_data['cik_str']
        job['company']['exchange'] = company_data['metadata'].get('exchange')
        job['company']['sector'] = company_data['metadata'].get('sector')
        job['company']['industry'] = company_data['metadata'].get('industry')
        job['company_match'] = {
            'cik_str': company_data['cik_str'],
            'symbol': company_data['symbol'],
            'name': company_data['name'],
            'slug': company_data['slug']
        }
    elif args.company:
        job['company']['name'] = args.company

    # Create job directory (collocation: everything in one place)
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True, mode=0o755)

    # Create subdirectories with permissive permissions for SMB/cross-machine access
    (job_dir / "input").mkdir(exist_ok=True, mode=0o755)
    (job_dir / "transcripts").mkdir(exist_ok=True, mode=0o755)
    (job_dir / "renders").mkdir(exist_ok=True, mode=0o755)
    (job_dir / "thumbnails").mkdir(exist_ok=True, mode=0o755)

    # Save job.yaml inside job directory
    job_file = job_dir / "job.yaml"
    with open(job_file, 'w') as f:
        yaml.dump(job, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    print(f"✓ Job created: {job_id}")
    print(f"  Directory: {job_dir}")
    print(f"  Job file: {job_file}")
    print(f"  Workflow: {workflow}")
    print(f"  Input: {input_type}")
    if args.ticker and args.quarter:
        print(f"  Company: {ticker} {quarter}")
    print()
    print(f"Next: python lens/workflow.py {job_file}")

    return job_id


def list_jobs(args):
    """List all jobs"""
    if not JOBS_DIR.exists():
        print("No jobs directory found")
        return

    # Look for job directories containing job.yaml
    job_dirs = [d for d in JOBS_DIR.iterdir() if d.is_dir() and (d / "job.yaml").exists()]
    jobs = sorted(job_dirs, key=lambda p: (p / "job.yaml").stat().st_mtime, reverse=True)

    if not jobs:
        print("No jobs found")
        return

    print(f"{'Job ID':<40} {'Status':<12} {'Company':<15} {'Created'}")
    print("-" * 100)

    for job_dir in jobs:
        job_file = job_dir / "job.yaml"
        with open(job_file, 'r') as f:
            job = yaml.safe_load(f)

        job_id = job['job_id']
        status = job['status']
        company = f"{job['company']['ticker']} {job['company']['quarter']}"
        created = job['created_at'][:19].replace('T', ' ')

        print(f"{job_id:<40} {status:<12} {company:<15} {created}")


def show_status(args):
    """Show job status"""
    job_file = JOBS_DIR / args.job_id / "job.yaml"

    if not job_file.exists():
        print(f"Job not found: {args.job_id}")
        sys.exit(1)

    with open(job_file, 'r') as f:
        job = yaml.safe_load(f)

    print(f"Job: {job['job_id']}")
    print(f"Status: {job['status']}")
    print(f"Company: {job['company']['ticker']} {job['company']['quarter']}")
    print(f"Created: {job['created_at']}")
    print()
    print("Processing:")
    for step_name, step_data in job['processing'].items():
        status = step_data.get('status', 'pending')
        icon = "✓" if status == "completed" else "✗" if status == "failed" else "○"
        print(f"  {icon} {step_name:<15} {status}")

    print()
    print("Outputs:")
    if job['outputs'].get('full_video'):
        print(f"  Full video: {job['outputs']['full_video']}")
    if job['outputs'].get('youtube_url'):
        print(f"  YouTube: {job['outputs']['youtube_url']}")

    if job.get('notes'):
        print()
        print("Notes:")
        print(job['notes'])


def process_job(args):
    """Process job - run workflow steps"""
    job_file = JOBS_DIR / args.job_id / "job.yaml"

    if not job_file.exists():
        print(f"Job not found: {args.job_id}")
        sys.exit(1)

    # Import workflow orchestrator
    sys.path.insert(0, str(LENS_DIR))
    from workflow import WorkflowOrchestrator

    # Create orchestrator (uses workflow from job.yaml)
    orchestrator = WorkflowOrchestrator(job_file)

    if args.step:
        # Run single step
        orchestrator.run_step(args.step)
    elif args.from_step:
        # Run from specific step onwards
        orchestrator.run_from_step(args.from_step)
    else:
        # Run all steps
        orchestrator.run_all()


def main():
    parser = argparse.ArgumentParser(description="MarketHawk Job Manager - Workflow-based Processing")
    subparsers = parser.add_subparsers(dest='command', required=True)

    # Create job
    create_parser = subparsers.add_parser('create', help='Create new job')
    create_parser.add_argument('--url', help='YouTube URL or HTTP URL')
    create_parser.add_argument('--file', help='Local file path')
    create_parser.add_argument('--audio', help='Audio file path (for manual-audio workflow)')
    create_parser.add_argument('--ticker', help='Company ticker (e.g., NVDA) - optional for manual-audio, auto-extracted')
    create_parser.add_argument('--quarter', help='Quarter (e.g., Q3) - optional for manual-audio, auto-extracted')
    create_parser.add_argument('--company', help='Company name (optional)')
    create_parser.add_argument('--workflow', required=True, help='Workflow name: manual-audio, youtube-video, or audio-batch')

    # List jobs
    list_parser = subparsers.add_parser('list', help='List all jobs')

    # Show status
    status_parser = subparsers.add_parser('status', help='Show job status')
    status_parser.add_argument('job_id', help='Job ID')

    # Process job
    process_parser = subparsers.add_parser('process', help='Process job using workflow')
    process_parser.add_argument('job_id', help='Job ID')
    process_parser.add_argument('--step', help='Run specific step only')
    process_parser.add_argument('--from-step', help='Run from specific step onwards')

    args = parser.parse_args()

    # Dispatch
    if args.command == 'create':
        create_job(args)
    elif args.command == 'list':
        list_jobs(args)
    elif args.command == 'status':
        show_status(args)
    elif args.command == 'process':
        process_job(args)


if __name__ == '__main__':
    main()
