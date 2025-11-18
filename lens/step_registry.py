"""
Step Registry - Central mapping of workflow step handlers to Python functions
"""

import sys
from pathlib import Path
from typing import Dict, Callable, Any

# Add scripts to path
LENS_DIR = Path(__file__).parent
sys.path.insert(0, str(LENS_DIR / "scripts"))

# Import existing step handlers
# (None - all wrapped in steps/)
from scripts.download_source import download_video
from scripts.parse_metadata import parse_video_metadata

# Import new step handlers (will be created)
try:
    from steps.transcribe_step import transcribe_step
except ImportError:
    transcribe_step = None

try:
    from steps.extract_insights_step import extract_insights_step
except ImportError:
    extract_insights_step = None

try:
    from steps.refine_timestamps_step import refine_timestamps_step
except ImportError:
    refine_timestamps_step = None

try:
    from steps.create_banner import create_banner
except ImportError:
    create_banner = None

try:
    from steps.ffmpeg_render import ffmpeg_render
except ImportError:
    ffmpeg_render = None

try:
    from steps.upload_youtube_step import upload_youtube_step
except ImportError:
    upload_youtube_step = None

try:
    from steps.copy_audio_to_job import copy_audio_to_job
except ImportError:
    copy_audio_to_job = None

try:
    from steps.extract_metadata_llm import extract_metadata_llm
except ImportError:
    extract_metadata_llm = None

try:
    from steps.interactive_confirm_metadata import interactive_confirm_metadata
except ImportError:
    interactive_confirm_metadata = None

try:
    from steps.upload_artifacts_r2 import upload_artifacts_r2
except ImportError:
    upload_artifacts_r2 = None

try:
    from steps.upload_media_r2 import upload_media_r2
except ImportError:
    upload_media_r2 = None

try:
    from steps.remotion_render import remotion_render
except ImportError:
    remotion_render = None

try:
    from steps.generate_thumbnails import generate_thumbnails_step
except ImportError:
    generate_thumbnails_step = None

try:
    from steps.update_database import update_database
except ImportError:
    update_database = None

try:
    from steps.validate_earnings_call import validate_earnings_call
except ImportError:
    validate_earnings_call = None

try:
    from steps.fuzzy_match_company import fuzzy_match_company
except ImportError:
    fuzzy_match_company = None

try:
    from steps.extract_audio_ffmpeg import extract_audio_ffmpeg
except ImportError:
    extract_audio_ffmpeg = None

try:
    from steps.download_source_cached import download_source_cached
except ImportError:
    download_source_cached = None

try:
    from steps.detect_trim_point import detect_trim_point
except ImportError:
    detect_trim_point = None

try:
    from steps.match_company import match_company
except ImportError:
    match_company = None


# Step Handler Registry
# Maps handler names (from workflow YAML) to Python functions
STEP_HANDLERS: Dict[str, Callable] = {
    # Core processing steps
    'transcribe_whisperx': transcribe_step,
    'extract_insights_structured': extract_insights_step,
    'refine_timestamps': refine_timestamps_step,

    # Download/upload steps
    'download_source': download_video,
    'download_source_cached': download_source_cached,
    'parse_metadata': parse_video_metadata,
    'upload_youtube': upload_youtube_step,

    # New step handlers (manual-audio workflow)
    'copy_audio_to_job': copy_audio_to_job,
    'extract_metadata_llm': extract_metadata_llm,
    'interactive_confirm_metadata': interactive_confirm_metadata,

    # R2 upload steps
    'upload_artifacts_r2': upload_artifacts_r2,
    'upload_media_r2': upload_media_r2,

    # Rendering and thumbnails
    'create_banner': create_banner,
    'ffmpeg_render': ffmpeg_render,
    'remotion_render': remotion_render,
    'generate_thumbnails': generate_thumbnails_step,

    # Database steps
    'update_database': update_database,

    # Batch workflow steps
    'validate_earnings_call': validate_earnings_call,
    'fuzzy_match_company': fuzzy_match_company,
    'extract_audio_ffmpeg': extract_audio_ffmpeg,

    # Company matching
    'match_company': match_company,

    # Utility steps
    'detect_trim_point': detect_trim_point,
}


def get_handler(handler_name: str) -> Callable:
    """
    Get step handler function by name

    Args:
        handler_name: Name of handler (e.g., 'transcribe_whisperx')

    Returns:
        Handler function

    Raises:
        ValueError: If handler not found or not implemented
    """
    handler = STEP_HANDLERS.get(handler_name)

    if handler is None:
        raise ValueError(
            f"Unknown step handler: {handler_name}\n"
            f"Available handlers: {', '.join(STEP_HANDLERS.keys())}"
        )

    return handler


def list_handlers() -> Dict[str, str]:
    """
    List all registered handlers with their implementation status

    Returns:
        Dict mapping handler names to status ('available' or 'not implemented')
    """
    return {
        name: 'available' if handler is not None else 'not implemented'
        for name, handler in STEP_HANDLERS.items()
    }
