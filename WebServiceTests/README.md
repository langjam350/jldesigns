# JL Designs Web Service Tests

API integration tests for the JL Designs platform, designed to test against the DEV environment.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export TEST_BASE_URL="https://dev.jldesigns.com"
```

3. Run tests:
```bash
npm test
```

## Test Categories

### Posts API Tests (`/api/posts/*`)
- Create posts
- Retrieve posts
- Update posts with videos
- Topic queue management
- Post approval workflow

### Video API Tests (`/api/video/*`)
- Video creation requests
- Text-to-speech generation
- Scripted video generation
- Scrolling video generation

## Environment Configuration

The tests are configured to run against the DEV environment by default. You can override this by setting the `TEST_BASE_URL` environment variable.

## Test Data Management

Tests automatically create and clean up test data to avoid polluting the database. Each test uses unique identifiers to prevent conflicts.

## Running Specific Tests

Run specific test suites:
```bash
# Posts API tests only
npm test -- posts.integration.test.ts

# Video API tests only
npm test -- video.integration.test.ts
```

## Coverage Reports

Generate coverage reports:
```bash
npm run test:coverage
```

## Continuous Testing

Watch mode for development:
```bash
npm run test:watch
```