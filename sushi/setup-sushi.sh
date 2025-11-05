#!/bin/bash
# Setup script for sushi GPU machine
# Run this once on sushi after git clone/pull

set -e

echo "=========================================="
echo "EarningLens Sushi GPU Setup"
echo "=========================================="

# Check if we're on the right machine
if [[ $(hostname) != *"sushi"* ]]; then
    echo "⚠️  Warning: This doesn't appear to be the sushi machine"
    echo "Current hostname: $(hostname)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for CUDA
echo ""
echo "Checking for CUDA..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi
    echo "✅ CUDA is available"
else
    echo "❌ CUDA not found - Whisper will run on CPU (slower)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for Python 3
echo ""
echo "Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi

python3 --version
echo "✅ Python 3 found"

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
python3 -m venv .venv
echo "✅ Virtual environment created: .venv"

# Activate venv
source .venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing Python dependencies..."
pip install -r sushi/requirements.txt
echo "✅ Dependencies installed"

# Create directories
echo ""
echo "Creating working directories..."
mkdir -p sushi/uploads
mkdir -p sushi/downloads
echo "✅ Directories created"

# Setup environment file
echo ""
echo "Setting up environment configuration..."
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  .env file not found"
    if [ -f "$ENV_EXAMPLE" ]; then
        read -p "Create .env from .env.example? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo "✅ Created $ENV_FILE"
            echo ""
            echo "⚠️  Important: Edit $ENV_FILE and add your API keys:"
            echo "  - OPENAI_API_KEY"
            echo "  - YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN"
            echo "  - DATABASE_URL"
            echo ""
        fi
    fi
else
    echo "✅ .env file found"

    # Load environment variables from .env
    set -a  # Export all variables
    source "$ENV_FILE"
    set +a

    echo "✅ Environment variables loaded from $ENV_FILE"

    # Verify required keys
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "⚠️  OPENAI_API_KEY not set in .env file"
    else
        echo "✅ OPENAI_API_KEY is set"
    fi
fi

# Download Whisper models (optional but recommended)
echo ""
read -p "Pre-download Whisper models? (recommended, ~3GB) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Downloading Whisper models..."
    python3 -c "import whisper; whisper.load_model('medium')"
    echo "✅ Whisper models downloaded"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit config: nano .env (add API keys)"
echo "2. Activate the environment: source .venv/bin/activate"
echo "3. Process a video: ./scripts/process-earnings.sh <video-id> youtube <url>"
echo ""
echo "Example:"
echo "  source .venv/bin/activate"
echo "  ./scripts/process-earnings.sh pltr-q3-2024 youtube https://youtube.com/watch?v=..."
echo "=========================================="
