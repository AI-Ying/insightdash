# Multi-stage Dockerfile for Next.js 15 + Prisma + PostgreSQL
#
# Build: docker build --build-arg DATABASE_URL="postgres://..." -t insightdash:latest .
# Run:   docker run -p 3000:3000 -e DATABASE_URL="postgres://..." insightdash:latest

# Stage 1: Base - install dependencies and generate Prisma client
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies for Prisma and Next.js
RUN apk add --no-cache \
    bash \
    curl \
    openssl \
    libc6-compat \
    ca-certificates

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev for Prisma CLI)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

# Stage 2: Builder - build the application
FROM base AS builder
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy all source files
COPY . .

# Reinstall dependencies to ensure everything is present
RUN npm ci

# Push Prisma schema to database and build
RUN npx prisma db push --accept-data-loss && npm run build

# Stage 3: Production - minimal runtime image
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Install system dependencies for Prisma runtime
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    ca-certificates

# Copy package files and install production dependencies only
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./

# Generate Prisma client in production stage
RUN npx prisma generate

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
