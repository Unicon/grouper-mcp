# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy certificates directory if it exists (for HTTPS)
COPY certs /app/certs/

# Create logs directory and set proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs /app/certs && \
    chmod 644 /app/certs/*.pem

# Switch to non-root user
USER nodejs

# Expose the ports (HTTP and HTTPS)
EXPOSE 3050
EXPOSE 3443

# Default environment variables (can be overridden)
ENV GROUPER_BASE_URL=""
ENV GROUPER_DEBUG="false"
ENV NODE_ENV="production"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3050/health || exit 1

# Start the server (defaults to HTTP mode on port 3050)
CMD ["node", "dist/index.js"]