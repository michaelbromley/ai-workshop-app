# Multi-stage Dockerfile for AI Workshop App

# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source and shared types
COPY client/ ./
COPY shared/ ../shared/

# Build client
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci

# Copy server source and shared types
COPY server/ ./
COPY shared/ ../shared/

# Build server
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built server from builder
COPY --from=server-builder /app/server/dist ./dist

# Copy built client from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/workshop.db

# Start server
CMD ["node", "dist/server.js"]
