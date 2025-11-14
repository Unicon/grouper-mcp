# HTTP/SSE Setup with MCPO

This guide explains how to expose the Grouper MCP server via HTTP/SSE using MCPO (MCP-to-OpenAPI Proxy).

## Overview

[MCPO](https://github.com/open-webui/mcpo) is a lightweight proxy that converts MCP servers from stdio transport to HTTP/SSE transport. This enables:

- Integration with HTTP-based AI agents (Open WebUI, web apps, etc.)
- RESTful API access to Grouper tools
- Auto-generated OpenAPI documentation
- API key authentication
- Multiple concurrent connections

## Quick Start

### Option 1: All-in-One Docker Image (Recommended)

The simplest approach uses a Docker image with both the MCP server and MCPO built-in:

```bash
# Build the HTTP-enabled image
docker build -f Dockerfile.http -t grouper-mcp:http .

# Run with HTTP access on port 8000
docker run -p 8000:8000 \
  -e GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000" \
  -e GROUPER_USERNAME="your_username" \
  -e GROUPER_PASSWORD="your_password" \
  -e MCPO_API_KEY="your-secret-key" \
  -e GROUPER_DEBUG="true" \
  -e READ_ONLY="false" \
  -e NODE_TLS_REJECT_UNAUTHORIZED="0" \
  grouper-mcp:http
```

**For local development with Docker Desktop:**

```bash
docker run -p 8000:8000 \
  -e GROUPER_BASE_URL="https://host.docker.internal:9443/grouper-ws/servicesRest/json/v4_0_000" \
  -e GROUPER_USERNAME="GrouperSystem" \
  -e GROUPER_PASSWORD="pass" \
  -e MCPO_API_KEY="top-secret" \
  -e GROUPER_DEBUG="true" \
  -e READ_ONLY="false" \
  -e NODE_TLS_REJECT_UNAUTHORIZED="0" \
  grouper-mcp:http
```

### Option 2: Separate MCPO Installation

Run MCPO separately for more control:

#### Install MCPO

```bash
# Via uv (recommended)
pip install uv
uvx mcpo --version

# Or via pip
pip install mcpo
```

#### Run MCPO with Grouper MCP

```bash
uvx mcpo --port 8000 --api-key "your-secret-key" -- \
  docker run -i --rm \
    -e GROUPER_BASE_URL=https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000 \
    -e GROUPER_USERNAME=your_username \
    -e GROUPER_PASSWORD=your_password \
    -e GROUPER_DEBUG=true \
    -e READ_ONLY=false \
    -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
    grouper-mcp:latest
```

#### With Local Build

```bash
# Build the project
npm install
npm run build

# Run MCPO with local build
uvx mcpo --port 8000 --api-key "your-secret-key" -- \
  node /absolute/path/to/grouper-mcp/dist/index.js
```

## Accessing the API

Once running, you can access:

- **API Endpoint**: `http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

The interactive documentation (`/docs`) provides:
- List of all available tools
- Try-it-now functionality
- Request/response examples
- Authentication testing

## Making API Calls

All API requests require the API key in the `Authorization` header:

### Example: Search for Groups

```bash
curl -X POST http://localhost:8000/grouper_find_groups_by_name_approximate \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "engineering"}'
```

### Example: Get Group Members

```bash
curl -X POST http://localhost:8000/grouper_get_members \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"groupName": "edu:department:engineering:staff"}'
```

### Example: Get Subject's Groups

```bash
curl -X POST http://localhost:8000/grouper_get_subject_groups \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"subjectId": "12345", "memberFilter": "All"}'
```

## Configuration

### Environment Variables

#### MCPO-Specific Variables

- **`MCPO_API_KEY`** (required): API key for authentication
  - Default: `change-me-in-production`
  - **Important**: Always set a strong API key in production

- **`MCPO_PORT`**: HTTP port to listen on
  - Default: `8000`

- **`MCPO_HOST`**: Bind address
  - Default: `0.0.0.0` (all interfaces)
  - Use `127.0.0.1` to only allow local connections

#### Grouper MCP Variables

See [Configuration Guide](CONFIGURATION.md) for complete details:

- `GROUPER_BASE_URL` (required)
- `GROUPER_USERNAME` (required)
- `GROUPER_PASSWORD` (required)
- `GROUPER_DEBUG`
- `READ_ONLY`
- `NODE_TLS_REJECT_UNAUTHORIZED`

### Logging

#### All-in-One Docker Image

Logs are written to `/home/mcp/.grouper-mcp/logs/` inside the container:

```bash
# Mount logs to host (recommended)
docker run -p 8000:8000 \
  -v $(pwd)/logs:/home/mcp/.grouper-mcp/logs \
  -e GROUPER_BASE_URL="..." \
  -e MCPO_API_KEY="..." \
  grouper-mcp:http

# View logs from running container
docker exec <container-id> cat /home/mcp/.grouper-mcp/logs/grouper-mcp.log

# Copy logs from container
docker cp <container-id>:/home/mcp/.grouper-mcp/logs ./logs
```

Log files:
- `grouper-mcp.log` - All messages (info, debug, errors)
- `grouper-mcp-errors.log` - Error messages only

#### Separate MCPO Installation

- **Grouper MCP logs**: `~/.grouper-mcp/logs/` (or custom `GROUPER_LOG_DIR`)
- **MCPO logs**: Stdout/stderr from MCPO process

## Advanced Configuration

### Custom Root Path

Run the API under a custom path:

```bash
uvx mcpo --port 8000 --api-key "your-key" --root-path "/api/grouper" -- \
  docker run -i --rm ... grouper-mcp:latest

# API now available at http://localhost:8000/api/grouper/docs
```

### Multiple MCP Servers

Run multiple MCP servers through a single MCPO instance using a config file:

**Create `mcpo-config.json`:**

```json
{
  "mcpServers": {
    "grouper": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GROUPER_BASE_URL=https://your-instance.edu/grouper-ws/servicesRest/json/v4_0_000",
        "-e", "GROUPER_USERNAME=your_username",
        "-e", "GROUPER_PASSWORD=your_password",
        "grouper-mcp:latest"
      ]
    },
    "another-service": {
      "command": "node",
      "args": ["/path/to/another-mcp/server.js"]
    }
  }
}
```

**Run with config:**

```bash
uvx mcpo --config mcpo-config.json --api-key "your-key"
```

### Custom Port and Host

```bash
# Listen on port 9000
docker run -p 9000:9000 \
  -e MCPO_PORT=9000 \
  -e GROUPER_BASE_URL="..." \
  -e MCPO_API_KEY="..." \
  grouper-mcp:http

# Listen on localhost only
docker run -p 127.0.0.1:8000:8000 \
  -e MCPO_HOST=127.0.0.1 \
  -e GROUPER_BASE_URL="..." \
  -e MCPO_API_KEY="..." \
  grouper-mcp:http
```

## Production Deployment

### HTTPS with Reverse Proxy

For production, run MCPO behind a reverse proxy with HTTPS:

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name grouper-api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

#### Caddy Configuration

```caddy
grouper-api.example.com {
    reverse_proxy localhost:8000 {
        flush_interval -1
    }
}
```

### Security Considerations

1. **Strong API Keys**: Use randomly generated, long API keys
   ```bash
   # Generate a secure API key
   openssl rand -base64 32
   ```

2. **HTTPS Only**: Always use HTTPS in production (via reverse proxy)

3. **Network Isolation**: Run MCPO on localhost if only accessed via reverse proxy
   ```bash
   -e MCPO_HOST=127.0.0.1
   ```

4. **Read-Only Mode**: Use for monitoring/reporting without write risk
   ```bash
   -e READ_ONLY=true
   ```

5. **Rate Limiting**: Implement at reverse proxy level

6. **Firewall Rules**: Restrict access to known IP ranges if possible

### High Availability

For production workloads, consider:

1. **Load Balancer**: Run multiple instances behind a load balancer
2. **Health Checks**: Monitor `/docs` endpoint
3. **Auto-restart**: Use Docker restart policies or systemd
4. **Monitoring**: Track response times, error rates, API usage

## Use Cases

### Integration with Web Applications

```javascript
// JavaScript/TypeScript example
const response = await fetch('https://grouper-api.example.com/grouper_find_groups_by_name_approximate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ searchTerm: 'engineering' })
});

const data = await response.json();
console.log(data);
```

### Integration with Open WebUI

See [Open WebUI Setup Guide](SETUP_OPEN_WEBUI.md)

### Integration with Other HTTP Clients

The API works with any HTTP client that supports:
- POST requests
- JSON payloads
- Bearer token authentication

## Troubleshooting

### Server Won't Start

1. Check port is available: `lsof -i :8000`
2. Verify Docker is running
3. Check environment variables are set
4. View logs: `docker logs <container-id>`

### Authentication Errors

1. Verify API key matches in request and server config
2. Check `Authorization` header format: `Bearer your-key`
3. Ensure no extra spaces or quotes in API key

### Connection Timeout

1. Increase timeout in client
2. Enable debug logging: `GROUPER_DEBUG=true`
3. Check Grouper instance is accessible
4. Verify network connectivity

### CORS Issues

MCPO automatically handles CORS. If you have issues:
1. Check browser console for specific CORS error
2. Ensure reverse proxy isn't stripping CORS headers
3. Verify API key is being sent correctly

## Additional Resources

- [MCPO Documentation](https://github.com/open-webui/mcpo)
- [Configuration Guide](CONFIGURATION.md)
- [Open WebUI Setup](SETUP_OPEN_WEBUI.md)
- [Available Tools](TOOLS.md)
