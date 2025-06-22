#!/bin/bash
# Load development environment variables

echo "Loading development environment variables..."

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "Error: .env.development file not found!"
    echo "Please create .env.development from .env.development.example"
    exit 1
fi

# Load environment variables
set -a
source .env.development
set +a

echo "Development environment variables loaded successfully!"
echo "NEXT_PUBLIC_APP_ENV: $NEXT_PUBLIC_APP_ENV"
echo "NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL"

# Optional: Start development server
if [ "$1" = "--start" ]; then
    echo "Starting development server..."
    npm run dev
fi