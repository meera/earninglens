#!/bin/bash
# Helper script to load environment variables from .env
# Source this file: source sushi/load-env.sh

SUSHI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SUSHI_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    # Load all environment variables from .env
    set -a  # Automatically export all variables
    source "$ENV_FILE"
    set +a

    echo "✅ Environment variables loaded from $ENV_FILE"

    # List loaded variables (without showing values)
    echo ""
    echo "Loaded variables:"
    grep -v '^#' "$ENV_FILE" | grep -v '^$' | cut -d= -f1 | while read var; do
        if [ ! -z "${!var}" ]; then
            echo "  ✓ $var"
        else
            echo "  ✗ $var (not set or empty)"
        fi
    done
else
    echo "⚠️  .env file not found: $ENV_FILE"
    echo ""
    echo "To create it:"
    echo "  cp $PROJECT_ROOT/.env.example $ENV_FILE"
    echo "  nano $ENV_FILE  # Add your API keys"
    return 1
fi
