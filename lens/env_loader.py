"""
Environment loader - loads .env or .env.production based on DEV_MODE

Similar to Next.js environment loading:
- DEV_MODE=true (or unset) → loads .env
- DEV_MODE=false → loads .env.production

Environment variables:
- DATABASE_URL: PostgreSQL connection string
- R2_BUCKET_NAME: Cloudflare R2 bucket name
"""

import os
from pathlib import Path
from dotenv import load_dotenv


def load_environment():
    """
    Load environment variables from .env and optionally .env.production

    Loading strategy (like Next.js):
    1. Always load .env (common variables)
    2. If DEV_MODE=false, load .env.production (overrides .env)

    Uses DEV_MODE to determine production override:
    - DEV_MODE=true or unset → .env only (development)
    - DEV_MODE=false → .env + .env.production (production)
    """
    project_root = Path(__file__).parent.parent

    # Always load .env first (common variables)
    env_file = project_root / '.env'
    if env_file.exists():
        load_dotenv(env_file, override=False)  # Don't override existing env vars
        print(f"🔧 Loaded common environment from .env")
    else:
        print(f"⚠️  Warning: .env not found")

    # Check DEV_MODE (default to true for development)
    dev_mode = os.getenv('DEV_MODE', 'true').lower() == 'true'

    # If production mode, load .env.production to override
    if not dev_mode:
        prod_env_file = project_root / '.env.production'
        if prod_env_file.exists():
            load_dotenv(prod_env_file, override=True)  # Override with production values
            print(f"🔧 Loaded production overrides from .env.production")
        else:
            print(f"⚠️  Warning: DEV_MODE=false but .env.production not found")

    # Set R2 bucket to always use production bucket (no dev bucket)
    if not os.getenv('R2_BUCKET_NAME'):
        os.environ['R2_BUCKET_NAME'] = 'markeyhawkeye'

    # Validate required environment variables
    required_vars = ['DATABASE_URL']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print(f"   Expected in: {env_file.name}")
        raise ValueError(f"Missing required environment variables: {missing_vars}")


def get_database_url() -> str:
    """Get DATABASE_URL from environment"""
    url = os.getenv('DATABASE_URL')
    if not url:
        raise ValueError("DATABASE_URL not set in environment")
    return url


def get_r2_bucket_name() -> str:
    """Get R2_BUCKET_NAME from environment"""
    bucket = os.getenv('R2_BUCKET_NAME')
    if not bucket:
        raise ValueError("R2_BUCKET_NAME not set in environment")
    return bucket


def get_r2_rclone_remote() -> str:
    """Get R2_RCLONE_REMOTE from environment (e.g., 'r2-prod', 'r2-local')"""
    remote = os.getenv('R2_RCLONE_REMOTE')
    if not remote:
        raise ValueError("R2_RCLONE_REMOTE not set in environment")
    return remote


# Auto-load on import (unless explicitly disabled)
if os.getenv('SKIP_ENV_LOAD') != 'true':
    load_environment()
