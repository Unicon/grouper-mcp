# Docker Deployment Guide

This guide covers deploying the Grouper MCP server using Docker and Docker Compose.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Building Images](#building-images)
- [Running the Server](#running-the-server)
- [Development Mode](#development-mode)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your Grouper credentials

# 2. Ensure SSL certificates exist
ls certs/cert.pem certs/key.pem

# 3. Build and run
npm run docker:build
npm run docker:up

# 4. Verify
curl -k https://localhost:3000/health
```

**Available Endpoints:**
- **Streamable HTTP** (Modern): `https://localhost:3000/mcp`
- **SSE** (ChatGPT compatible): `https://localhost:3000/sse`
- **Health Check**: `https://localhost:3000/health`

---

## Prerequisites

### Required Software
- **Docker**: Version 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)

### Verify Installation
```bash
docker --version
docker-compose --version
```

### SSL Certificates

Self-signed certificates are required for HTTPS. If you don't have them:

```bash
bash scripts/generate-certs.sh
```

This creates browser-compatible certificates with proper extensions (Digital Signature, Key Encipherment, TLS Server Authentication).

---

## Configuration

### Environment Variables

Create `.env` from the example:

```bash
cp .env.example .env
```

**Required variables:**
```bash
GROUPER_BASE_URL=https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000
GROUPER_USERNAME=your_username
GROUPER_PASSWORD=your_password
```

**Optional variables:**
```bash
PORT=3000
USE_HTTPS=true
GROUPER_DEBUG=false
```

See `.env.example` for complete documentation.

---

## Building Images

### Production Image

Build the optimized production image:

```bash
npm run docker:build
```

Or manually:
```bash
docker build -t grouper-mcp:latest .
```

**Image characteristics:**
- Multi-stage build for minimal size
- Alpine Linux base (~150-200MB total)
- Non-root user (nodejs:nodejs)
- Health checks included

### Development Image

```bash
docker-compose -f docker-compose.dev.yml build
```

---

## Running the Server

### Production Mode

**Using npm scripts (recommended):**
```bash
npm run docker:up     # Start server
npm run docker:down   # Stop server
npm run docker:logs   # View logs
```

**Using docker-compose directly:**
```bash
docker-compose up -d          # Start in background
docker-compose logs -f        # Follow logs
docker-compose down           # Stop and remove
docker-compose down -v        # Stop and remove volumes
```

### Verify Running

Check container status:
```bash
docker ps | grep grouper-mcp
```

Test health endpoint:
```bash
curl -k https://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T12:34:56.789Z",
  "activeSessions": 0
}
```

---

## Development Mode

Development mode includes:
- Hot-reload on code changes
- Source code mounted as volume
- Debug logging enabled
- Bind-mounted logs for easy access

### Start Development Server

```bash
npm run docker:dev
```

Or:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Stop Development Server

```bash
npm run docker:dev:down
```

Or:
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## Monitoring and Logs

### View Logs

**All logs:**
```bash
docker-compose logs -f
```

**Last 100 lines:**
```bash
docker-compose logs --tail=100
```

**Production logs (from volume):**
```bash
docker exec grouper-mcp-server cat /app/logs/grouper-mcp.log
```

**Error logs only:**
```bash
docker exec grouper-mcp-server cat /app/logs/grouper-mcp-errors.log
```

### Health Checks

Docker automatically monitors health:

```bash
docker inspect --format='{{json .State.Health}}' grouper-mcp-server | jq
```

### Resource Usage

```bash
docker stats grouper-mcp-server
```

---

## Volumes

### Production Volumes

**grouper-logs (named volume):**
- Persists logs across container restarts
- Located: `/var/lib/docker/volumes/grouper-logs`

**certs (bind mount):**
- Read-only mount from `./certs`
- Provides SSL certificates to container

### Inspect Volumes

```bash
docker volume ls
docker volume inspect grouper-logs
```

### Backup Logs

```bash
docker run --rm -v grouper-logs:/data -v $(pwd):/backup alpine \
  tar czf /backup/grouper-logs-backup.tar.gz -C /data .
```

### Restore Logs

```bash
docker run --rm -v grouper-logs:/data -v $(pwd):/backup alpine \
  tar xzf /backup/grouper-logs-backup.tar.gz -C /data
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common issues:**
1. **Missing .env file**
   ```bash
   cp .env.example .env
   # Edit with your credentials
   ```

2. **Missing SSL certificates**
   ```bash
   bash scripts/generate-certs.sh
   ```

3. **Port already in use**
   ```bash
   # Change PORT in .env
   PORT=3001
   ```

### Health Check Failing

**Check container status:**
```bash
docker ps -a | grep grouper-mcp
```

**Inspect health check:**
```bash
docker inspect grouper-mcp-server | grep -A 10 Health
```

**Test manually:**
```bash
docker exec grouper-mcp-server node -e "require('https').get('https://localhost:3000/health', {rejectUnauthorized: false}, (res) => console.log(res.statusCode)).on('error', console.error);"
```

### Cannot Connect to Grouper

**Test from within container:**
```bash
docker exec grouper-mcp-server sh -c "apk add curl && curl -I $GROUPER_BASE_URL"
```

**Check environment variables:**
```bash
docker exec grouper-mcp-server env | grep GROUPER
```

### Permission Issues

**Check file ownership:**
```bash
ls -la certs/
```

Certificates should be readable:
```bash
chmod 644 certs/cert.pem
chmod 600 certs/key.pem
```

---

## Production Deployment

### Security Checklist

- [ ] Use proper SSL certificates (not self-signed)
- [ ] Set strong Grouper credentials
- [ ] Use Docker secrets for sensitive data
- [ ] Limit container resources
- [ ] Enable Docker content trust
- [ ] Use specific image tags (not `latest`)
- [ ] Regular security updates
- [ ] Network isolation
- [ ] Log aggregation

### Production docker-compose.yml

Example with secrets and resource limits:

```yaml
version: '3.8'

services:
  grouper-mcp:
    image: grouper-mcp:0.3.0  # Use specific version
    container_name: grouper-mcp-prod

    ports:
      - "3000:3000"

    environment:
      GROUPER_BASE_URL: ${GROUPER_BASE_URL}
      PORT: 3000
      USE_HTTPS: true
      GROUPER_DEBUG: false

    secrets:
      - grouper_username
      - grouper_password

    volumes:
      - /path/to/production/certs:/app/certs:ro
      - grouper-logs:/app/logs

    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

    restart: always

    healthcheck:
      test: ["CMD", "node", "-e", "require('https').get('https://localhost:3000/health', {rejectUnauthorized: false}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

    networks:
      - grouper-network

secrets:
  grouper_username:
    external: true
  grouper_password:
    external: true

volumes:
  grouper-logs:
    driver: local

networks:
  grouper-network:
    driver: bridge
```

### Using Docker Secrets

```bash
# Create secrets
echo "myusername" | docker secret create grouper_username -
echo "mypassword" | docker secret create grouper_password -

# Deploy stack
docker stack deploy -c docker-compose.prod.yml grouper
```

### Resource Limits

Add to docker-compose.yml:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

---

## Cloud Deployment

### AWS ECS

1. Push image to ECR
2. Create task definition
3. Create service with ALB
4. Configure secrets from AWS Secrets Manager

### Google Cloud Run

```bash
docker build -t gcr.io/PROJECT_ID/grouper-mcp .
docker push gcr.io/PROJECT_ID/grouper-mcp
gcloud run deploy grouper-mcp --image gcr.io/PROJECT_ID/grouper-mcp --platform managed
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name grouper-mcp \
  --image grouper-mcp:latest \
  --dns-name-label grouper-mcp \
  --ports 3000
```

---

## Useful Commands

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove all unused images
docker image prune -a

# Clean everything
docker system prune -a --volumes
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Shell Access

```bash
# Get shell in running container
docker exec -it grouper-mcp-server sh

# Run one-off command
docker exec grouper-mcp-server ls -la /app
```

---

## Next Steps

- [Phase 3: OAuth Authentication](TODO.md#phase-3-oauth-21-authentication)
- [MCP Tools Documentation](TOOLS.md)
- [Main README](../README.md)
