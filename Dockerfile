# Multi-stage build for Grouper MCP Server

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Copy config directory (including properties file if it exists)
COPY config ./config

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -u 1001 -S mcp -G mcp

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy config directory from builder (will include properties file if it was present)
# To build with config: create config/grouper-mcp.properties before building
# To build without config: just build normally (will use env vars only)
COPY --from=builder --chown=mcp:mcp /app/config ./config

# Create logs directory with proper permissions
RUN mkdir -p /home/mcp/.grouper-mcp/logs && \
    chown -R mcp:mcp /home/mcp/.grouper-mcp

# Switch to non-root user
USER mcp

# Set default log directory
ENV GROUPER_LOG_DIR=/home/mcp/.grouper-mcp/logs

# Expose stdio for MCP communication
# MCP servers communicate via stdin/stdout, no ports needed

# Start the server
CMD ["node", "dist/index.js"]
