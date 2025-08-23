
# Multi-stage Docker build for Node.js application
# Use the official Node.js 20 LTS Alpine image for smaller size and better security
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
USER nextjs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Dependencies stage
FROM base AS dependencies
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Install security updates and curl for healthcheck
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy built application and dependencies
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]

# Metadata
LABEL maintainer="Pathfinder Team"
LABEL version="1.0.0"
LABEL description="Pathfinder - Modern pathfinding application"
