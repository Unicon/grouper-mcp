# Multi-stage Dockerfile for Grouper MCP Server
# Stage 1: Builder - Build TypeScript and prepare dependencies
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build to reduce size
RUN npm prune --production

# Stage 2: Production - Minimal runtime image
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories for volumes with correct permissions
RUN mkdir -p /app/certs /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose HTTPS port
EXPOSE 3000

# Health check - verify server is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('https').get('https://localhost:3000/health', {rejectUnauthorized: false}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Default command - run HTTPS server
CMD ["node", "dist/http-server.js"]
