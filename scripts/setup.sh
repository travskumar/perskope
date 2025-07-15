#!/bin/bash

echo "🚀 Setting up Periskope MCP Integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
mkdir -p logs
mkdir -p tests/unit
mkdir -p tests/integration

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your credentials."
fi

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ Setup complete!"
echo "📖 Next steps:"
echo "1. Update .env file with your Periskope credentials"
echo "2. Run: npm run dev (for development)"
echo "3. Run: npm start (for production)"
echo "4. Configure Claude Desktop with config/claude_desktop_config.json"