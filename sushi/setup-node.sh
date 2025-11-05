#!/bin/bash
#
# Setup Node.js and Remotion on sushi GPU machine
# Run this once on sushi
#

set -e

echo "========================================"
echo "  Sushi Node.js & Remotion Setup"
echo "========================================"
echo ""

# Check if running on sushi
if [ ! -d "/usr/local/cuda" ]; then
    echo "⚠ Warning: CUDA not detected. Are you on sushi?"
    echo "  This script is intended for the GPU machine."
    echo ""
fi

# 1. Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."

    # Use nvm for Node.js installation
    if [ ! -d "$HOME/.nvm" ]; then
        echo "  Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

        # Load nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    # Install Node.js LTS
    nvm install --lts
    nvm use --lts

    echo "✓ Node.js installed: $(node -v)"
else
    echo "✓ Node.js already installed: $(node -v)"
fi

# 2. Install npm packages for studio
STUDIO_DIR="$(cd "$(dirname "$0")/../studio" && pwd)"

if [ ! -d "$STUDIO_DIR" ]; then
    echo "❌ Studio directory not found: $STUDIO_DIR"
    echo "   Make sure you've cloned the full earninglens repo"
    exit 1
fi

cd "$STUDIO_DIR"

echo ""
echo "📦 Installing studio dependencies..."
echo "  Directory: $STUDIO_DIR"

if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in studio/"
    echo "   Run this script after setting up the studio project"
    exit 1
fi

npm install

echo "✓ Studio dependencies installed"

# 3. Install sushi scripts dependencies
SUSHI_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "📦 Installing sushi scripts dependencies..."
cd "$SUSHI_DIR"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json <<'EOF'
{
  "name": "earninglens-sushi",
  "version": "1.0.0",
  "description": "Sushi GPU machine scripts",
  "private": true,
  "dependencies": {
    "googleapis": "^118.0.0",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
}
EOF
    echo "  Created package.json"
fi

npm install

echo "✓ Sushi scripts dependencies installed"

# 4. Install ffmpeg (if not already installed)
echo ""
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 Installing ffmpeg..."

    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    elif command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "⚠ Please install ffmpeg manually"
    fi

    echo "✓ ffmpeg installed"
else
    echo "✓ ffmpeg already installed: $(ffmpeg -version | head -1)"
fi

# 5. Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x "$SUSHI_DIR/scripts/"*.sh
chmod +x "$SUSHI_DIR/scripts/"*.py
chmod +x "$SUSHI_DIR/scripts/"*.js
echo "✓ Scripts are executable"

# 6. Setup config
echo ""
PROJECT_ROOT="$(cd "$SUSHI_DIR/.." && pwd)"
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "⚠ Config file not found"
    echo ""
    echo "Create your config file:"
    echo "  cp $PROJECT_ROOT/.env.example $PROJECT_ROOT/.env"
    echo "  nano $PROJECT_ROOT/.env"
    echo ""
    echo "You'll need:"
    echo "  - OPENAI_API_KEY"
    echo "  - YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN"
    echo "  - DATABASE_URL"
else
    echo "✓ Config file exists: $PROJECT_ROOT/.env"
fi

# 7. Test Remotion
echo ""
echo "🧪 Testing Remotion installation..."
cd "$STUDIO_DIR"

if npx remotion --version &> /dev/null; then
    echo "✓ Remotion is ready: $(npx remotion --version)"
else
    echo "❌ Remotion test failed"
    exit 1
fi

# Done
echo ""
echo "========================================"
echo "✓ Setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Configure credentials: nano .env"
echo "  2. Test processing: ./sushi/scripts/process-earnings.sh test-video youtube <url>"
echo ""
echo "Available commands:"
echo "  ./sushi/scripts/process-earnings.sh <video-id> <source> [url]"
echo "  ./sushi/scripts/update-thumbnail.sh <video-id>"
echo ""
