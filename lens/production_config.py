#!/usr/bin/env python3
"""
Production configuration tracker for earnings videos.
Saves RUNTIME parameters only (not source code defaults).
Creative decisions are tracked in git via composition files.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional


class ProductionConfig:
    """
    Tracks runtime production parameters for an earnings video.
    Saved as production.json in company directory (e.g., HOOD/Q3-2025/production.json)

    Only saves:
    - Source video metadata (YouTube URL, duration, etc.)
    - Runtime processing results (trim times, token usage, etc.)
    - Render attempts and their outcomes

    Does NOT save:
    - Default parameters from source code (e.g., whisper_model="medium")
    - Creative decisions (those are in git via compositions)
    """

    def __init__(self, company_dir: Path):
        self.company_dir = Path(company_dir)
        self.config_file = self.company_dir / "production.json"
        self.config = self._load_or_create()

    def _load_or_create(self) -> Dict[str, Any]:
        """Load existing config or create new one"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                return json.load(f)

        return {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "source": {},
            "processing": {},
            "renders": [],
            "last_updated": datetime.now().isoformat()
        }

    def save(self):
        """Save config to disk"""
        self.config["last_updated"] = datetime.now().isoformat()
        self.company_dir.mkdir(parents=True, exist_ok=True)

        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

    def set_source(self, youtube_url: str, video_id: str, title: str, duration: float):
        """Record source video information"""
        self.config["source"] = {
            "youtube_url": youtube_url,
            "video_id": video_id,
            "title": title,
            "duration_seconds": duration,
            "downloaded_at": datetime.now().isoformat()
        }
        self.save()

    def set_processing_params(self, **kwargs):
        """
        Record RUNTIME processing results only.
        Do not save default parameters from source code.

        Examples of what TO save:
            set_processing_params(
                trim_start=23.58,              # Runtime result
                first_speech_time=28.58,       # Runtime result
                llm_tokens_used=15234,         # Runtime result
                transcription_duration=420     # Runtime result
            )

        Examples of what NOT to save (already in source code):
            whisper_model="medium"             # Default in code
            whisper_language="en"              # Default in code
            llm_model="gpt-4o"                 # Default in code
        """
        self.config["processing"].update(kwargs)
        self.config["processing"]["updated_at"] = datetime.now().isoformat()
        self.save()

    def add_render(self, take_number: int, **kwargs):
        """
        Record a render attempt with outcomes/results.

        Examples:
            add_render(
                take_number=1,
                output_file="take1.mp4",
                duration=4618.5,              # Actual output duration
                file_size_mb=1250,            # Actual file size
                render_time_seconds=420,      # How long it took
                success=True,                 # Did it work?
                error=None,                   # Any errors?
                notes="Initial render"        # Human notes
            )

        Do NOT save (already in composition or code):
            composition_id="HOOD-Q3-2025"    # In git filename
            resolution="1920x1080"           # In remotion.config.ts
            fps=30                           # In remotion.config.ts
            codec="h264"                     # In remotion.config.ts
        """
        render_record = {
            "take": take_number,
            "rendered_at": datetime.now().isoformat(),
            **kwargs
        }

        # Find existing render for this take and update it
        for i, r in enumerate(self.config["renders"]):
            if r.get("take") == take_number:
                self.config["renders"][i] = render_record
                self.save()
                return

        # Add new render
        self.config["renders"].append(render_record)
        self.save()

    def get_latest_render(self) -> Optional[Dict[str, Any]]:
        """Get the most recent render"""
        if not self.config["renders"]:
            return None
        return max(self.config["renders"], key=lambda r: r.get("take", 0))

    def get_render(self, take_number: int) -> Optional[Dict[str, Any]]:
        """Get a specific render by take number"""
        for render in self.config["renders"]:
            if render.get("take") == take_number:
                return render
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Export config as dictionary"""
        return self.config.copy()


def example_usage():
    """Example of how to use ProductionConfig"""

    # Initialize
    config = ProductionConfig("/var/earninglens/HOOD/Q3-2025")

    # Record source
    config.set_source(
        youtube_url="https://www.youtube.com/watch?v=_cYsXG6FAzk",
        video_id="_cYsXG6FAzk",
        title="Robinhood Q3 2025 Earnings Call",
        duration=4642
    )

    # Record RUNTIME processing results (not defaults from code)
    config.set_processing_params(
        trim_start=23.58,                # Result from smart_trim
        first_speech_time=28.58,         # Detected by Whisper
        llm_tokens_used=15234,           # From OpenAI API response
        transcription_duration=420       # Time taken to transcribe
    )

    # Record render attempts (outcomes only, not config params)
    config.add_render(
        take_number=1,
        output_file="take1.mp4",
        duration=4618.5,
        file_size_mb=1250,
        render_time_seconds=420,
        success=True,
        notes="Initial render - discovered hallucination issue"
    )

    # Record second render
    config.add_render(
        take_number=2,
        output_file="take2.mp4",
        duration=4595.2,  # Shorter after correct trim
        file_size_mb=1248,
        render_time_seconds=410,
        success=True,
        notes="Fixed Whisper hallucinations, correct trim point"
    )

    print("Production config saved!")
    print(json.dumps(config.to_dict(), indent=2))


if __name__ == "__main__":
    example_usage()
