# Open WebUI Setup Guide

This guide explains how to integrate the Grouper MCP server with Open WebUI using MCPO as an HTTP proxy.

## Overview

[Open WebUI](https://docs.openwebui.com/) (v0.6.31+) provides a web-based interface for interacting with AI models and supports MCP servers via Streamable HTTP protocol. Since Open WebUI requires HTTP/SSE transport, you'll need to use MCPO to expose grouper-mcp over HTTP.

## Prerequisites

- Open WebUI v0.6.31 or higher
- Docker installed
- Access to a Grouper instance
- Grouper web services credentials

## Quick Start

### Step 1: Start the HTTP-Enabled MCP Server

**Option A: All-in-One Docker Image (Recommended)**

The simplest approach uses a pre-built Docker image that includes both the MCP server and MCPO:

```bash
# Build the HTTP-enabled Docker image
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

**Option B: Separate MCPO Installation**

If you prefer to run MCPO separately:

```bash
# Install MCPO
pip install uv
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

See [HTTP Setup Guide](SETUP_HTTP.md) for more MCPO configuration options.

### Step 2: Verify the Server

Visit `http://localhost:8000/docs` to see the auto-generated API documentation and verify the server is running.

### Step 3: Configure Open WebUI

1. Log in to your Open WebUI instance
2. Navigate to **⚙️ Admin Settings → External Tools**
3. Click **+ (Add Server)**
4. Select **MCP (Streamable HTTP)** as the server type
5. Configure the connection:
   - **Server URL**: `http://localhost:8000` (or your MCPO server URL)
   - **API Key**: `your-secret-key` (the key you set when starting MCPO)
6. Click **Save**
7. Restart Open WebUI if prompted

### Step 4: Test the Integration

Start a new chat in Open WebUI and try these prompts:

```
Search for groups containing "engineering"
Show me the members of group edu:department:engineering:students
Get details for subject with ID 12345
```

The AI should automatically use the Grouper tools to respond to your requests.

## Configuration Options

### Environment Variables

See [Configuration Guide](CONFIGURATION.md) for complete details. Key variables:

- **`GROUPER_BASE_URL`**: Full URL to Grouper web services endpoint (required)
- **`GROUPER_USERNAME`**: Grouper authentication username (required)
- **`GROUPER_PASSWORD`**: Grouper authentication password (required)
- **`MCPO_API_KEY`**: API key for MCPO authentication (required)
- **`GROUPER_DEBUG`**: Enable detailed logging (`"true"` or `"false"`)
- **`READ_ONLY`**: Enable read-only mode (`"true"` or `"false"`)
- **`NODE_TLS_REJECT_UNAUTHORIZED`**: Set to `"0"` for self-signed certificates (development only)

### MCPO-Specific Variables

- **`MCPO_PORT`**: HTTP port (default: `8000`)
- **`MCPO_HOST`**: Bind address (default: `0.0.0.0`)

## Important Notes

### Transport Protocol

Open WebUI only supports **Streamable HTTP** for MCP servers. Traditional stdio MCP servers must be proxied through MCPO.

### Authentication

MCPO provides API key authentication. For production deployments:
- Use strong, randomly generated API keys
- Store API keys securely (environment variables, secrets manager)
- Rotate keys periodically

### Network Access

If running MCPO on a different machine than Open WebUI:
- Ensure the server URL is accessible from the Open WebUI instance
- Configure firewall rules to allow HTTP traffic on the MCPO port
- Consider using HTTPS (see Production Deployment below)

### Special Characters in Group Names

⚠️ **Important Limitation**: Open WebUI converts special characters (like `-`, `:`, etc.) to asterisks (`*`) in tool call parameters.

**Workaround**: Wrap group names in triple backticks (code blocks) in your prompts:

```
Get members of group ```edu:app:my-app:users```
```

Without the code block, `edu:app:my-app:users` would be corrupted to `edu*app*my*app*users`.

This applies to:
- Group names with colons, hyphens, or other special characters
- Stem names with special characters
- Any parameter values containing special characters

## Production Deployment

### HTTPS Setup

For production, run MCPO behind a reverse proxy (nginx or Caddy) with HTTPS:

**Nginx Example:**

```nginx
server {
    listen 443 ssl;
    server_name grouper-mcp.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

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

Then configure Open WebUI to use `https://grouper-mcp.example.com`.

### Read-Only Mode

For production monitoring/auditing without risk of changes:

```bash
docker run -p 8000:8000 \
  -e GROUPER_BASE_URL="..." \
  -e GROUPER_USERNAME="..." \
  -e GROUPER_PASSWORD="..." \
  -e MCPO_API_KEY="..." \
  -e READ_ONLY="true" \
  grouper-mcp:http
```

See [Configuration Guide](CONFIGURATION.md#read-only-mode) for details.

### Logging

Access logs from the container:

```bash
# Mount logs to host (recommended)
docker run -p 8000:8000 \
  -v $(pwd)/logs:/home/mcp/.grouper-mcp/logs \
  -e GROUPER_BASE_URL="..." \
  grouper-mcp:http

# View logs from running container
docker exec <container-id> cat /home/mcp/.grouper-mcp/logs/grouper-mcp.log

# Copy logs from container
docker cp <container-id>:/home/mcp/.grouper-mcp/logs ./logs
```

Log files:
- `grouper-mcp.log` - All log messages
- `grouper-mcp-errors.log` - Error messages only

## Troubleshooting

### Server Not Starting

1. Check Docker is running
2. Verify port 8000 is not already in use: `lsof -i :8000`
3. Check environment variables are set correctly
4. View container logs: `docker logs <container-id>`

### Open WebUI Can't Connect

1. Verify server is running: `curl http://localhost:8000/docs`
2. Check server URL in Open WebUI matches your MCPO URL
3. Verify API key matches between server and Open WebUI config
4. Check network connectivity if server is on different machine

### Tools Not Working

1. Enable debug logging: `GROUPER_DEBUG=true`
2. Check logs for errors
3. Verify Grouper credentials and permissions
4. Test Grouper API directly: `curl -u user:pass https://grouper-url/...`

### Special Characters Not Working

Remember to wrap group names in triple backticks:
```
Get members of ```edu:my:group```
```

## Example Prompts

Once configured, try these prompts in Open WebUI:

```
Find all groups with "engineering" in the name

Show me the members of group ```edu:department:engineering:staff```

Search for subjects with name "John Smith"

Get all groups that subject 12345 is a member of

Create a new group called ```edu:test:mygroup``` with display name "My Test Group"
```

## Additional Resources

- [HTTP/MCPO Setup Guide](SETUP_HTTP.md) - Detailed MCPO configuration
- [Configuration Guide](CONFIGURATION.md) - All configuration options
- [Available Tools](TOOLS.md) - Complete tool reference
- [Open WebUI MCP Documentation](https://docs.openwebui.com/features/mcp/)
- [MCPO Documentation](https://github.com/open-webui/mcpo)
