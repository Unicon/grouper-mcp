# Phase 2: Docker Containerization - Implementation Plan

## Overview

This phase focuses on containerizing the Grouper MCP HTTPS server for easy deployment, portability, and scalability. The goal is to create production-ready Docker images and compose configurations.

---

## Goals

✅ Create optimized multi-stage Dockerfile
✅ Implement Docker Compose for local development and testing
✅ Secure environment variable and secrets management
✅ Volume mounting for logs, certificates, and configuration
✅ Health checks and graceful shutdown
✅ Documentation for deployment scenarios
⭐ (Optional) Container registry publishing

---

## Implementation Steps

### 2.1 Create Multi-Stage Dockerfile

**File:** `Dockerfile`

**Strategy:** Use multi-stage builds to minimize final image size and improve security.

#### Stage 1: Builder (Build TypeScript)
```dockerfile
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

# Remove dev dependencies after build
RUN npm prune --production
```

**Why Alpine?**
- Small base image (~5MB vs ~100MB for full Node image)
- Security-focused with minimal attack surface
- Industry standard for Node.js containers

#### Stage 2: Production Runtime
```dockerfile
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories for volumes
RUN mkdir -p /app/certs /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose HTTPS port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('https').get('https://localhost:3000/health', {rejectUnauthorized: false}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command (can be overridden)
CMD ["node", "dist/http-server.js"]
```

**Key Features:**
- **dumb-init**: Proper signal forwarding for graceful shutdown
- **Non-root user**: Security best practice (nodejs:nodejs)
- **Health check**: Automatic container health monitoring
- **Volume directories**: Pre-created with correct permissions

---

### 2.2 Create .dockerignore

**File:** `.dockerignore`

```
# Build output
dist/

# Dependencies
node_modules/

# Environment files
.env
.env.*
!.env.example

# Git
.git/
.gitignore

# Documentation (not needed in image)
docs/
*.md
!README.md

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
.grouper-mcp/

# Testing
coverage/
.nyc_output/

# CI/CD
.github/

# Certificates (will be mounted as volumes)
certs/*.pem
```

**Why:** Reduces build context size and prevents sensitive files from being copied into the image.

---

### 2.3 Create Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  grouper-mcp:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: grouper-mcp:latest
    container_name: grouper-mcp-server

    ports:
      - "${PORT:-3000}:3000"

    environment:
      # Grouper Configuration
      GROUPER_BASE_URL: ${GROUPER_BASE_URL}
      GROUPER_USERNAME: ${GROUPER_USERNAME}
      GROUPER_PASSWORD: ${GROUPER_PASSWORD}
      GROUPER_ACT_AS_SUBJECT_ID: ${GROUPER_ACT_AS_SUBJECT_ID:-}
      GROUPER_ACT_AS_SUBJECT_SOURCE_ID: ${GROUPER_ACT_AS_SUBJECT_SOURCE_ID:-}
      GROUPER_ACT_AS_SUBJECT_IDENTIFIER: ${GROUPER_ACT_AS_SUBJECT_IDENTIFIER:-}

      # Server Configuration
      PORT: 3000
      USE_HTTPS: ${USE_HTTPS:-true}

      # Logging
      GROUPER_DEBUG: ${GROUPER_DEBUG:-false}
      GROUPER_LOG_DIR: /app/logs

    volumes:
      # SSL Certificates (read-only)
      - ./certs:/app/certs:ro

      # Logs (persistent)
      - grouper-logs:/app/logs

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "node", "-e", "require('https').get('https://localhost:3000/health', {rejectUnauthorized: false}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

    networks:
      - grouper-network

volumes:
  grouper-logs:
    driver: local

networks:
  grouper-network:
    driver: bridge
```

**Key Features:**
- Environment variables from `.env` file
- Volume for persistent logs
- Read-only mount for certificates
- Health checks configured
- Custom network for isolation
- Restart policy for reliability

---

### 2.4 Create Development Docker Compose

**File:** `docker-compose.dev.yml`

For local development with hot-reload:

```yaml
version: '3.8'

services:
  grouper-mcp-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
      target: development
    image: grouper-mcp:dev
    container_name: grouper-mcp-dev

    ports:
      - "3000:3000"

    environment:
      GROUPER_BASE_URL: ${GROUPER_BASE_URL}
      GROUPER_USERNAME: ${GROUPER_USERNAME}
      GROUPER_PASSWORD: ${GROUPER_PASSWORD}
      PORT: 3000
      USE_HTTPS: true
      GROUPER_DEBUG: true
      GROUPER_LOG_DIR: /app/logs
      NODE_ENV: development

    volumes:
      # Source code for hot-reload
      - ./src:/app/src:ro
      - ./tsconfig.json:/app/tsconfig.json:ro

      # Certificates
      - ./certs:/app/certs:ro

      # Logs
      - ./logs:/app/logs

      # Node modules (avoid re-installing)
      - node_modules:/app/node_modules

    command: npm run dev:http

    networks:
      - grouper-network

volumes:
  node_modules:

networks:
  grouper-network:
    driver: bridge
```

**File:** `Dockerfile.dev`

```dockerfile
FROM node:24-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source (volumes will override for hot-reload)
COPY . .

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev:http"]
```

---

### 2.5 Environment Variables Management

#### Production Secrets

For production, use Docker secrets or environment variable injection:

**Option 1: Docker Secrets (Recommended for Swarm/Kubernetes)**

```yaml
# docker-compose.prod.yml
services:
  grouper-mcp:
    secrets:
      - grouper_username
      - grouper_password
    environment:
      GROUPER_USERNAME_FILE: /run/secrets/grouper_username
      GROUPER_PASSWORD_FILE: /run/secrets/grouper_password

secrets:
  grouper_username:
    external: true
  grouper_password:
    external: true
```

**Option 2: .env file (Simple deployments)**

Create `.env` from `.env.example` with real values (never commit!).

**Option 3: Environment injection at runtime**

```bash
docker run -e GROUPER_USERNAME=admin -e GROUPER_PASSWORD=secret grouper-mcp:latest
```

---

### 2.6 Volume Strategy

#### Logs Volume
- **Purpose**: Persist logs across container restarts
- **Type**: Named volume (`grouper-logs`) for production
- **Type**: Bind mount (`./logs`) for development
- **Access**: Read-write

#### Certificates Volume
- **Purpose**: Provide SSL certificates to container
- **Type**: Bind mount (`./certs`)
- **Access**: Read-only (`:ro`)
- **Production**: Mount from secrets manager or secure location

#### Development Source Volume
- **Purpose**: Hot-reload during development
- **Type**: Bind mount (`./src`)
- **Access**: Read-only (`:ro`)

---

### 2.7 Update .gitignore

Add Docker-specific entries:

```gitignore
# Docker
.env.production
.env.staging
docker-compose.override.yml
```

---

### 2.8 Create Docker Documentation

**File:** `docs/DOCKER_DEPLOYMENT.md`

Contents:
- Quick start guide
- Building images
- Running with Docker Compose
- Environment variable configuration
- Volume management
- Health checks and monitoring
- Troubleshooting
- Production deployment checklist

---

### 2.9 Create Helper Scripts

**File:** `scripts/docker-build.sh`

```bash
#!/bin/bash
set -e

echo "Building Grouper MCP Docker image..."
docker build -t grouper-mcp:latest .

echo "Build complete!"
docker images grouper-mcp:latest
```

**File:** `scripts/docker-run.sh`

```bash
#!/bin/bash
set -e

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Copy .env.example to .env and configure it first"
    exit 1
fi

# Check if certs exist
if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
    echo "Error: SSL certificates not found in certs/"
    echo "Run: openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'"
    exit 1
fi

echo "Starting Grouper MCP server with Docker Compose..."
docker-compose up -d

echo "Server started!"
echo "Health check: curl -k https://localhost:3000/health"
echo "Logs: docker-compose logs -f"
```

**File:** `scripts/docker-stop.sh`

```bash
#!/bin/bash
docker-compose down
```

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

---

## Implementation Checklist

### Core Files
- [ ] Create `Dockerfile` (multi-stage)
- [ ] Create `.dockerignore`
- [ ] Create `docker-compose.yml` (production)
- [ ] Create `docker-compose.dev.yml` (development)
- [ ] Create `Dockerfile.dev` (development)

### Documentation
- [ ] Create `docs/DOCKER_DEPLOYMENT.md`
- [ ] Update main `README.md` with Docker instructions
- [ ] Update `.env.example` with Docker-specific comments

### Scripts
- [ ] Create `scripts/docker-build.sh`
- [ ] Create `scripts/docker-run.sh`
- [ ] Create `scripts/docker-stop.sh`

### Configuration
- [ ] Update `.gitignore` for Docker files
- [ ] Update `package.json` with Docker-related scripts

### Testing
- [ ] Build image successfully
- [ ] Run container with docker-compose
- [ ] Verify health check works
- [ ] Test HTTPS endpoint from host
- [ ] Verify logs persist across restarts
- [ ] Test with custom certificates
- [ ] Verify environment variables load correctly
- [ ] Test graceful shutdown (SIGTERM)

---

## Testing Strategy

### Local Testing
```bash
# Build image
npm run docker:build

# Start with compose
npm run docker:up

# Check health
curl -k https://localhost:3000/health

# Test MCP endpoint
curl -k -X POST https://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'

# Check logs
docker-compose logs -f

# Stop
npm run docker:down
```

### Production Testing
```bash
# Build production image
docker build -t grouper-mcp:prod .

# Run with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify running
docker ps | grep grouper-mcp

# Check health
docker inspect --format='{{json .State.Health}}' grouper-mcp-server | jq

# Stop
docker-compose down
```

---

## Security Considerations

### Image Security
✅ Non-root user (nodejs:nodejs)
✅ Minimal base image (Alpine)
✅ No secrets in image layers
✅ Regular security updates

### Runtime Security
✅ Read-only certificate volumes
✅ Environment variable injection
✅ Network isolation
✅ Resource limits (optional)

### Production Hardening
- Use secrets management (Docker secrets, Kubernetes secrets, AWS Secrets Manager)
- Implement resource limits (CPU, memory)
- Enable security scanning (Trivy, Snyk)
- Use signed images
- Implement network policies

---

## Performance Optimization

### Image Size Optimization
- Multi-stage builds (already implemented)
- Alpine base image
- Prune dev dependencies after build
- Only copy necessary files

### Runtime Optimization
- Health check intervals tuned
- Graceful shutdown with dumb-init
- Efficient logging configuration

---

## Deployment Scenarios

### Scenario 1: Local Development
Use `docker-compose.dev.yml` with hot-reload.

### Scenario 2: Single Server Deployment
Use `docker-compose.yml` with `.env` file.

### Scenario 3: Docker Swarm
Use secrets and deploy stack.

### Scenario 4: Kubernetes
Convert to Kubernetes manifests or use Helm chart (Phase 2.5).

### Scenario 5: Cloud Platforms
- **AWS ECS/Fargate**: Use task definitions
- **Google Cloud Run**: Direct deployment from image
- **Azure Container Instances**: Simple container deployment

---

## Success Criteria

✅ Docker image builds successfully (< 200MB)
✅ Container starts and passes health check
✅ HTTPS endpoint accessible from host
✅ Logs persist across container restarts
✅ Certificates mount correctly
✅ Environment variables load properly
✅ Graceful shutdown on SIGTERM
✅ Development hot-reload works
✅ Documentation complete and clear

---

## Timeline Estimate

- **Dockerfile creation**: 1 hour
- **Docker Compose setup**: 1 hour
- **Scripts and documentation**: 1 hour
- **Testing and refinement**: 2 hours
- **Total**: ~5 hours

---

## Next: Phase 3 - OAuth 2.1 Authentication

After Docker containerization, we'll add OAuth authentication for production security.
