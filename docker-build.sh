#!/bin/bash

# Docker build script for JL Designs
# Usage: ./docker-build.sh [environment] [project_id]

ENVIRONMENT=${1:-development}
PROJECT_ID=${2:-jldesigns}
IMAGE_NAME="jldesigns-app"
TAG=${ENVIRONMENT}

echo "Building Docker image for environment: $ENVIRONMENT"
echo "Project ID: $PROJECT_ID"
echo "Image: gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"

# Check if .env file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

# Build arguments from environment file
BUILD_ARGS="--build-arg NEXT_PUBLIC_APP_ENV=${ENVIRONMENT}"

# Add each non-comment line from env file as build arg
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ ! -z "$line" && ! "$line" =~ ^#.* ]]; then
        BUILD_ARGS="${BUILD_ARGS} --build-arg ${line}"
    fi
done < "$ENV_FILE"

# Build the Docker image
docker build \
    $BUILD_ARGS \
    -t "gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}" \
    -t "${IMAGE_NAME}:${TAG}" \
    .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo "Image: gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"
else
    echo "❌ Docker build failed"
    exit 1
fi