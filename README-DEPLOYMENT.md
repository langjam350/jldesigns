# JL Designs Deployment Guide

This guide covers deployment configurations for JL Designs with video generation capabilities.

## 🚀 Deployment Overview

JL Designs uses a hybrid deployment approach:
- **Static Frontend**: Firebase Hosting
- **API Routes**: Google Cloud Run (Docker containers)
- **Video Processing**: Cloud Run with FFmpeg and Puppeteer
- **Database**: Firebase Firestore
- **File Storage**: Firebase Storage

## 📋 Prerequisites

### Required Services
1. **Google Cloud Platform Account**
2. **Firebase Project** (production and development)
3. **OpenAI API Key** (for video script generation)
4. **Unsplash API Key** (for image search)

### Required GitHub Secrets

#### Production Secrets
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `FIREBASE_PROJECT_ID` - Firebase Project ID
- `FIREBASE_SERVICE_ACCOUNT_JLDESIGNS` - Firebase service account JSON

#### Development Secrets
- `GCP_PROJECT_ID_DEV` - Development GCP Project ID
- `FIREBASE_PROJECT_ID_DEV` - Development Firebase Project ID
- `FIREBASE_SERVICE_ACCOUNT_JLDESIGNS_DEV` - Development service account JSON

## 🔧 Environment Setup

### 1. Environment Files

Create environment files from examples:
```bash
cp .env.production.example .env.production
cp .env.development.example .env.development
```

### 2. Required Environment Variables

#### Core Application
```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://jldesigns.com
```

#### Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
```

#### Video Generation Services
```bash
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project
GOOGLE_CLOUD_TTS_API_KEY=your_tts_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_key
```

## 🐳 Docker Configuration

### Local Development
```bash
# Build and run with Docker Compose
npm run docker:dev

# Or manually
npm run docker:build
npm run docker:run
```

### Production Container
The Dockerfile includes:
- Node.js 18 Alpine base
- Chromium for Puppeteer
- FFmpeg for video processing
- Production optimizations

## 🔄 CI/CD Pipeline

### Automatic Deployments

#### Production (main branch)
```yaml
Trigger: Push to main
Steps:
1. Build Next.js application
2. Create Docker image with video dependencies
3. Push to Google Container Registry
4. Deploy to Cloud Run
5. Deploy frontend to Firebase Hosting
```

#### Development (feature branches)
```yaml
Trigger: Push to feature/** or develop
Steps:
1. Build with development configuration
2. Deploy to development environment
3. Run on dev.jldesigns.com
```

### Manual Deployment Commands
```bash
# Development
npm run deploy:dev

# Production  
npm run deploy:prod
```

## 🏗️ Infrastructure Components

### Google Cloud Run
- **Memory**: 8GB (required for video processing)
- **CPU**: 4 cores
- **Timeout**: 300 seconds
- **Concurrency**: 80 requests
- **Min Instances**: 1
- **Max Instances**: 3 (production), 2 (development)

### Firebase Hosting
- **Static Assets**: Frontend build output
- **API Rewrites**: Route `/api/**` to Cloud Run
- **Custom Routes**: video-dashboard, generate-posts

### Container Features
- **Puppeteer**: Webpage capture for scrolling videos
- **FFmpeg**: Video processing and composition
- **Google Cloud TTS**: Multi-language audio generation
- **OpenAI Integration**: Script generation
- **Unsplash API**: Image search and retrieval

## 🔐 Security Configuration

### Service Accounts
- Dedicated service accounts for prod/dev
- Minimal required permissions
- Encrypted secrets in GitHub

### CORS Configuration
```json
{
  "Access-Control-Allow-Origin": "http://localhost:4000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

## 📊 Monitoring & Logging

### Cloud Run Logging
- Application logs available in Google Cloud Console
- Video generation process tracking
- Error monitoring and alerting

### Firebase Analytics
- User interaction tracking
- Performance monitoring
- Error reporting

## 🚦 Deployment Commands

### Development Workflow
```bash
# Load development environment
./load-dev.sh

# Start development server
npm run dev

# Build for development deployment
npm run build

# Deploy to development
git push origin feature/your-feature
```

### Production Workflow
```bash
# Create production build
npm run build-prod

# Deploy to production
git push origin main
```

## 🔧 Troubleshooting

### Common Issues

#### Video Generation Failures
- Check Google Cloud TTS API keys
- Verify OpenAI API limits
- Monitor Cloud Run memory usage

#### Container Build Issues
- Ensure Docker has sufficient memory
- Check Chromium installation in Alpine
- Verify FFmpeg dependencies

#### Firebase Deployment Issues
- Verify service account permissions
- Check Firebase project configuration
- Ensure hosting targets are set correctly

### Debug Commands
```bash
# Check container logs
gcloud run logs tail jldesigns-app --region=us-central1

# Test Docker build locally
docker build --no-cache -t jldesigns-test .

# Verify environment variables
./load-dev.sh && env | grep NEXT_PUBLIC
```

## 📈 Performance Optimization

### Cloud Run Configuration
- Optimized memory allocation for video processing
- Efficient container startup
- Proper request timeouts

### Frontend Optimization
- Static asset optimization
- CDN delivery via Firebase
- Efficient routing configuration

## 🔄 Updating Dependencies

### Video Processing Dependencies
```bash
# Update core video dependencies
npm update @google-cloud/text-to-speech
npm update fluent-ffmpeg
npm update puppeteer
npm update openai
```

### Container Dependencies
Update in Dockerfile:
```dockerfile
RUN apk add --no-cache \
  chromium \
  ffmpeg \
  # ... other dependencies
```

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run logs
3. Verify environment configurations
4. Test Docker build locally

This deployment setup provides a robust, scalable platform for JL Designs with full video generation capabilities.