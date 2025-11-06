#!/usr/bin/env python3
"""
Unified earnings video processing orchestrator.
Can run all steps or individual steps with state tracking.

Supports parallel processing of multiple videos:
- Each video has its own state file: DOWNLOADS_DIR/<video_id>/.state.json
- File locking prevents race conditions
- Safe to run multiple videos concurrently

Usage:
    # Run all steps
    python process_earnings.py --url "https://youtube.com/watch?v=..."

    # Run single step
    python process_earnings.py --url "..." --step download

    # Run from specific step onwards
    python process_earnings.py --url "..." --from transcribe

    # Parallel processing (multiple terminals/processes)
    python process_earnings.py --url "https://youtube.com/watch?v=video1" &
    python process_earnings.py --url "https://youtube.com/watch?v=video2" &
    python process_earnings.py --url "https://youtube.com/watch?v=video3" &
"""

import sys
import os
import json
import argparse
import subprocess
import re
import fcntl
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment (loads from ~/earninglens/.env when running from root)
load_dotenv()

# Directories (must be set before imports)
PIPELINE_DIR = Path(__file__).parent
PROJECT_ROOT = PIPELINE_DIR.parent

# Import our processing functions
sys.path.insert(0, str(PIPELINE_DIR / "scripts"))
from download_source import download_video
from parse_metadata import parse_video_metadata
from remove_silence import remove_silence as remove_silence_func

# Data directories
DOWNLOADS_DIR = Path(os.getenv("DOWNLOADS_DIR", "/var/earninglens/_downloads"))
ORGANIZED_DIR = Path(os.getenv("ORGANIZED_DIR", "/var/earninglens"))

# Ensure /var/earninglens is accessible
if not ORGANIZED_DIR.parent.exists():
    print(f"ERROR: {ORGANIZED_DIR.parent} not accessible")
    print("On Mac: Ensure samba mount is connected to GPU machine")
    print("On Linux: Ensure /var/earninglens directory exists")
    sys.exit(1)


class Colors:
    """ANSI color codes"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'


class Logger:
    """Simple colored logger"""

    @staticmethod
    def log(msg: str):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Colors.BLUE}[{timestamp}]{Colors.NC} {msg}")

    @staticmethod
    def success(msg: str):
        print(f"{Colors.GREEN}✓ {msg}{Colors.NC}")

    @staticmethod
    def error(msg: str):
        print(f"{Colors.RED}✗ {msg}{Colors.NC}")

    @staticmethod
    def step(msg: str):
        print(f"\n{Colors.YELLOW}==>{Colors.NC} {msg}")

    @staticmethod
    def info(msg: str):
        print(f"{Colors.CYAN}ℹ {msg}{Colors.NC}")


class StateManager:
    """Manage processing state (per-video, parallel-safe)"""

    def __init__(self, video_id: str):
        self.video_id = video_id
        self.state_file = DOWNLOADS_DIR / video_id / ".state.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self.lock_file = DOWNLOADS_DIR / video_id / ".state.lock"

    def get_state(self, step: str) -> str:
        """Get status of a step"""
        if not self.state_file.exists():
            return "not_started"

        with open(self.state_file, 'r') as f:
            state = json.load(f)

        return state.get("steps", {}).get(step, {}).get("status", "not_started")

    def get_data(self, step: str, key: str) -> Optional[str]:
        """Get data from a step"""
        if not self.state_file.exists():
            return None

        with open(self.state_file, 'r') as f:
            state = json.load(f)

        return state.get("steps", {}).get(step, {}).get("data", {}).get(key)

    def update_state(self, step: str, status: str, data: Dict):
        """Update state for a step (thread-safe with file locking)"""
        # Acquire lock
        with open(self.lock_file, 'w') as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)

            try:
                # Read current state
                if self.state_file.exists():
                    with open(self.state_file, 'r') as f:
                        state = json.load(f)
                else:
                    state = {
                        "video_id": self.video_id,
                        "started_at": datetime.now().isoformat(),
                        "steps": {}
                    }

                # Update state
                state["steps"][step] = {
                    "status": status,
                    "timestamp": datetime.now().isoformat(),
                    "data": data
                }
                state["last_updated"] = datetime.now().isoformat()

                # Write state atomically
                temp_file = self.state_file.with_suffix('.json.tmp')
                with open(temp_file, 'w') as f:
                    json.dump(state, f, indent=2)
                temp_file.replace(self.state_file)

            finally:
                # Release lock
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


class EarningsProcessor:
    """Main earnings video processor"""

    def __init__(self, url: str):
        self.url = url
        self.video_id = self._extract_video_id(url)
        self.state = StateManager(self.video_id)
        self.logger = Logger()

    def _extract_video_id(self, url: str) -> str:
        """Extract YouTube video ID from URL"""
        patterns = [
            r'youtu\.be/([a-zA-Z0-9_-]+)',
            r'v=([a-zA-Z0-9_-]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        raise ValueError(f"Could not extract video ID from URL: {url}")

    def _run_python_script(self, script_path: Path, args: List[str]) -> subprocess.CompletedProcess:
        """Run a Python script via subprocess (for scripts without imported functions)"""
        cmd = [sys.executable, str(script_path)] + args
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            self.logger.error(f"Script failed: {script_path.name}")
            print(result.stderr)
            raise RuntimeError(f"Script failed with code {result.returncode}")

        return result

    # ========================================================================
    # STEP FUNCTIONS
    # ========================================================================

    def step_download(self):
        """Step 1: Download video"""
        self.logger.step("Step 1/7: Download video")

        if self.state.get_state("download") == "completed":
            self.logger.info("Already downloaded, skipping")
            return

        # Call download function directly
        result = download_video(self.url, str(DOWNLOADS_DIR))

        self.state.update_state("download", "completed", {
            "video_id": self.video_id,
            "url": self.url,
            "file_path": result['file_path'],
            "metadata_path": result['metadata_path']
        })
        self.logger.success("Download complete")

    def step_parse(self):
        """Step 2: Parse metadata"""
        self.logger.step("Step 2/7: Parse metadata")

        if self.state.get_state("parse") == "completed":
            self.logger.info("Already parsed, skipping")
            return

        metadata_file = DOWNLOADS_DIR / self.video_id / "input" / "metadata.json"

        if not metadata_file.exists():
            raise FileNotFoundError("Metadata not found. Run download step first.")

        # Call parse function directly
        parse_result = parse_video_metadata(str(metadata_file))

        ticker = parse_result.get("ticker")
        quarter = parse_result.get("quarter")
        company_name = parse_result.get("company_name")
        confidence = parse_result.get("confidence")

        if not ticker or not quarter:
            raise ValueError(f"Could not parse company/quarter. Ticker: {ticker}, Quarter: {quarter}")

        self.logger.success(f"Detected: {company_name} ({ticker}) {quarter} (confidence: {confidence})")

        # Create organized directory
        company_dir = ORGANIZED_DIR / ticker / quarter
        company_dir.mkdir(parents=True, exist_ok=True)
        (company_dir / "input").mkdir(exist_ok=True)
        (company_dir / "transcripts").mkdir(exist_ok=True)
        (company_dir / "take1").mkdir(exist_ok=True)

        # Copy metadata
        import shutil
        shutil.copy(metadata_file, company_dir / "metadata.json")

        self.state.update_state("parse", "completed", {
            "ticker": ticker,
            "quarter": quarter,
            "company_name": company_name,
            "company_dir": str(company_dir)
        })
        self.logger.success("Parse complete")

    def step_remove_silence(self):
        """Step 3: Remove initial silence"""
        self.logger.step("Step 3/7: Remove initial silence")

        if self.state.get_state("remove_silence") == "completed":
            self.logger.info("Already trimmed, skipping")
            return

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")

        if not ticker or not quarter:
            raise ValueError("Parse data not found. Run parse step first.")

        source_file = DOWNLOADS_DIR / self.video_id / "input" / "source.mp4"
        company_dir = ORGANIZED_DIR / ticker / quarter
        trimmed_file = company_dir / "input" / "source.mp4"

        # Call remove_silence function directly
        result = remove_silence_func(str(source_file), str(trimmed_file))

        self.state.update_state("remove_silence", "completed", {
            "trimmed_file": str(trimmed_file),
            "silence_duration": result['silence_duration']
        })
        self.logger.success(f"Silence removed ({result['silence_duration']}s)")

    def step_transcribe(self):
        """Step 4: Transcribe with Whisper"""
        self.logger.step("Step 4/7: Transcribe with Whisper")

        if self.state.get_state("transcribe") == "completed":
            self.logger.info("Already transcribed, skipping")
            return

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")
        company_dir = ORGANIZED_DIR / ticker / quarter
        input_file = company_dir / "input" / "source.mp4"

        if not input_file.exists():
            raise FileNotFoundError("Input file not found. Run previous steps first.")

        script = PIPELINE_DIR / "transcribe.py"
        # transcribe.py accepts: filepath, model_name (optional), language (optional)
        # Outputs are saved automatically to same directory as input
        self._run_python_script(script, [str(input_file), "medium"])

        # Move transcript files from input/ to transcripts/ directory
        import shutil
        input_dir = company_dir / "input"
        transcript_dir = company_dir / "transcripts"

        # Move all transcript files to transcripts/ directory
        shutil.move(str(input_dir / "source.json"), str(transcript_dir / "transcript.json"))
        shutil.move(str(input_dir / "source.srt"), str(transcript_dir / "transcript.srt"))
        shutil.move(str(input_dir / "source.vtt"), str(transcript_dir / "transcript.vtt"))
        shutil.move(str(input_dir / "source.txt"), str(transcript_dir / "transcript.txt"))
        shutil.move(str(input_dir / "source.paragraphs.json"), str(transcript_dir / "paragraphs.json"))

        self.state.update_state("transcribe", "completed", {
            "transcript_json": str(transcript_dir / "transcript.json"),
            "transcript_srt": str(transcript_dir / "transcript.srt"),
            "transcript_vtt": str(transcript_dir / "transcript.vtt"),
            "transcript_txt": str(transcript_dir / "transcript.txt"),
            "paragraphs_json": str(transcript_dir / "paragraphs.json")
        })
        self.logger.success("Transcription complete")

    def step_insights(self):
        """Step 5: Extract insights with LLM"""
        self.logger.step("Step 5/7: Extract insights with LLM")

        if self.state.get_state("insights") == "completed":
            self.logger.info("Already extracted, skipping")
            return

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")
        company_name = self.state.get_data("parse", "company_name")
        company_dir = ORGANIZED_DIR / ticker / quarter
        transcript_file = company_dir / "transcripts" / "transcript.json"
        output_file = company_dir / "transcripts" / "insights.json"

        if not transcript_file.exists():
            raise FileNotFoundError("Transcript not found. Run transcribe step first.")

        # Use comprehensive insights extractor
        script = PIPELINE_DIR / "extract_insights.py"
        args = [
            str(transcript_file),
            "--output", str(output_file),
            "--company", company_name,
            "--quarter", quarter
        ]
        self._run_python_script(script, args)

        self.state.update_state("insights", "completed", {
            "insights": str(output_file)
        })
        self.logger.success("Insights extracted")

    def step_render(self):
        """Step 6: Render video with Remotion"""
        self.logger.step("Step 6/7: Render video with Remotion")

        if self.state.get_state("render") == "completed":
            self.logger.info("Already rendered, skipping")
            return

        # Check if node is available
        try:
            subprocess.run(["node", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("Node.js not installed. Skipping render.")
            return

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")
        company_dir = ORGANIZED_DIR / ticker / quarter
        output_file = company_dir / "take1" / "final.mp4"

        script = PIPELINE_DIR / "scripts" / "render-video.js"
        subprocess.run(["node", str(script), str(company_dir), str(output_file)], check=True)

        self.state.update_state("render", "completed", {
            "video": str(output_file)
        })
        self.logger.success("Video rendered")

    def step_upload(self):
        """Step 7: Upload to YouTube"""
        self.logger.step("Step 7/7: Upload to YouTube")

        if self.state.get_state("upload") == "completed":
            self.logger.info("Already uploaded, skipping")
            return

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")
        company_dir = ORGANIZED_DIR / ticker / quarter
        video_file = company_dir / "take1" / "final.mp4"
        insights_file = company_dir / "transcripts" / "insights.json"

        if not video_file.exists():
            raise FileNotFoundError("Video not found. Run render step first.")

        if not insights_file.exists():
            raise FileNotFoundError("Insights not found. Run insights step first.")

        # Upload with comprehensive metadata
        script = PIPELINE_DIR / "scripts" / "upload_youtube.py"
        self._run_python_script(script, [str(video_file), str(insights_file)])

        self.state.update_state("upload", "completed", {
            "status": "uploaded"
        })
        self.logger.success("Uploaded to YouTube")

    # ========================================================================
    # EXECUTION
    # ========================================================================

    def run_step(self, step_name: str):
        """Run a single step"""
        steps = {
            "download": self.step_download,
            "parse": self.step_parse,
            "remove-silence": self.step_remove_silence,
            "transcribe": self.step_transcribe,
            "insights": self.step_insights,
            "render": self.step_render,
            "upload": self.step_upload,
        }

        if step_name not in steps:
            raise ValueError(f"Unknown step: {step_name}")

        steps[step_name]()

    def run_from_step(self, step_name: str):
        """Run from a specific step onwards"""
        all_steps = ["download", "parse", "remove-silence", "transcribe", "insights", "render", "upload"]

        try:
            start_idx = all_steps.index(step_name)
        except ValueError:
            raise ValueError(f"Unknown step: {step_name}")

        self.logger.log(f"Running from step: {step_name} onwards")

        for step in all_steps[start_idx:]:
            self.run_step(step)

    def run_all(self):
        """Run all steps"""
        self.logger.log(f"Running all steps for: {self.url}")

        self.step_download()
        self.step_parse()
        self.step_remove_silence()
        self.step_transcribe()
        self.step_insights()
        self.step_render()
        self.step_upload()

        # Final summary
        print()
        self.logger.success("=" * 40)
        self.logger.success("All steps complete!")
        self.logger.success("=" * 40)
        print()

        ticker = self.state.get_data("parse", "ticker")
        quarter = self.state.get_data("parse", "quarter")
        company_name = self.state.get_data("parse", "company_name")
        company_dir = ORGANIZED_DIR / ticker / quarter

        self.logger.log(f"Company: {company_name} ({ticker}) {quarter}")
        self.logger.log(f"Location: {company_dir}")
        print()
        self.logger.log("Files:")
        self.logger.log(f"  - Video: {company_dir}/take1/final.mp4")
        self.logger.log(f"  - Transcript: {company_dir}/transcripts/transcript.json")
        self.logger.log(f"  - Insights: {company_dir}/transcripts/insights.json")
        print()
        self.logger.log(f"Original download: {DOWNLOADS_DIR / self.video_id}")
        self.logger.log(f"State file: {self.state.state_file}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Unified earnings video processing orchestrator"
    )
    parser.add_argument("--url", required=True, help="YouTube URL")
    parser.add_argument("--step", help="Run single step (download, parse, remove-silence, transcribe, insights, render, upload)")
    parser.add_argument("--from", dest="from_step", help="Run from specific step onwards")

    args = parser.parse_args()

    try:
        processor = EarningsProcessor(args.url)

        if args.step:
            processor.run_step(args.step)
        elif args.from_step:
            processor.run_from_step(args.from_step)
        else:
            processor.run_all()

    except Exception as e:
        Logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
