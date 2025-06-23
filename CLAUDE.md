# JL Designs Project

## Project Overview
- Next.js web application for social media management and video generation
- Firebase backend for authentication
- Migration to Postgres SQL for data storage
- Multi client framework where eachc client can have many users, and has their own Postgres DB on an instance.
- API endpoints for post management, video generation, and user authentication

## Main Features
- Video generation pipeline for social media content.
- User authentication and account management.
- Multi-Client service where users are part of clients.
- Clients must have their own Database for their needed elements.
- The main DB elements each client must have are Posts, Videos, and Tasks.
    - See DB schema section for more information and existing schema. Add to this schema wehre needed.
- Post generation page. See WellnessWWW for implementation details.
    - Must generate posts instead of blog posts. Posts must contain content.
    - Posts do not need to go through approval. Rejection/Acceptance is of the videos, not of the posts.
- Full functioning video dashboard for users to see video information under each post. See wellnessWWW project for implementation details.
    - Must display valid list of posts and videos.
    - Must allow for generation of scrolling and scripted videos and multi-lingual support.
    - Must allow for download of the vidoes directly on the page.
    - Must have a toggle to show content for the user.
- File upload and management endpoints needed for gathering or manipulating videos.

## Database Details

## Development Guidelines
- Run linting with: `npm run lint`. Run linting before testing, 
- Run type checking with: `npm run typecheck`
- Test with: `npm test`. Test after completing major features.

## Project Structure
- `/src/dal` - Data access layer for Firebase interactions
- `/src/models` - TypeScript interfaces for data models
- `/src/pages` - Next.js pages and API routes
- `/src/services` - Business logic services
- `/src/components` - Reusable UI components
- `/src/utils` - Utility functions