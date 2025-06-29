# Use the official Node.js 18 image based on Alpine
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Install Chromium, FFmpeg & dependencies for video generation
RUN apk add --no-cache \
  chromium \
  harfbuzz \
  ca-certificates \
  freetype \
  nss \
  ttf-freefont \
  woff2 \
  libpng \
  libjpeg-turbo \
  udev \
  curl \
  git \
  ffmpeg \
  && rm -rf /var/cache/apk/*

# Set Puppeteer environment variable to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of your app's source code
COPY . .

# Final stage
FROM base AS final
ARG APP_ENV=production
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV APP_ENV=${APP_ENV}

# Copy environment file
COPY .env.${APP_ENV} .env

# Expose required ports
EXPOSE 4000 8080

# Build app for production
RUN if [ "$APP_ENV" = "production" ]; then \
        echo "Setting up production environment" && \
        npm run build && \
        npm prune --production; \
    else \
        echo "Setting up development environment" && \
        npm run build; \
    fi

# Set the startup command
CMD if [ "$APP_ENV" = "production" ]; then \
        npm start; \
    else \
        npm run dev; \
    fi