# Claude Desktop Setup Guide

This guide explains how to configure the Grouper MCP server for use with Claude Desktop.

## Prerequisites

- Claude Desktop installed
- Docker installed (for Docker method) OR Node.js 20+ installed (for local method)
- Access to a Grouper instance
- Grouper web services credentials

## Configuration Location

Claude Desktop configuration file location varies by platform:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Option 1: Docker Setup (Recommended)

### Step 1: Build the Docker Image

```bash
git clone <repository-url>
cd grouper-mcp
docker build -t grouper-mcp:latest .
```

### Step 2: Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grouper": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GROUPER_BASE_URL=https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000",
        "-e", "GROUPER_USERNAME=your_username",
        "-e", "GROUPER_PASSWORD=your_password",
        "-e", "GROUPER_DEBUG=true",
        "-e", "READ_ONLY=false",
        "-e", "NODE_TLS_REJECT_UNAUTHORIZED=0",
        "grouper-mcp:latest"
      ]
    }
  }
}
```

### Step 3: Restart Claude Desktop

After saving the configuration, completely quit and restart Claude Desktop.

## Option 2: Local Installation

### Step 1: Build the Project

```bash
git clone <repository-url>
cd grouper-mcp
npm install
npm run build
```

### Step 2: Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grouper": {
      "command": "node",
      "args": ["/absolute/path/to/grouper-mcp/dist/index.js"],
      "env": {
        "GROUPER_BASE_URL": "https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000",
        "GROUPER_USERNAME": "your_username",
        "GROUPER_PASSWORD": "your_password",
        "GROUPER_DEBUG": "true",
        "READ_ONLY": "false",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

**Important:** Use absolute paths, not relative paths (e.g., `/Users/yourname/grouper-mcp/dist/index.js`)

### Step 3: Restart Claude Desktop

After saving the configuration, completely quit and restart Claude Desktop.

## Configuration Options

### Required Environment Variables

- **`GROUPER_BASE_URL`**: Full URL to your Grouper web services endpoint
  - Example: `https://grouper.example.edu/grouper-ws/servicesRest/json/v4_0_000`
- **`GROUPER_USERNAME`**: Username for Grouper authentication
- **`GROUPER_PASSWORD`**: Password for Grouper authentication

### Optional Environment Variables

- **`GROUPER_DEBUG`**: Enable detailed logging
  - Values: `"true"` or `"false"` (default: `"false"`)
  - Recommended: `"true"` for initial setup and troubleshooting

- **`READ_ONLY`**: Enable read-only mode (blocks all write operations)
  - Values: `"true"` or `"false"` (default: `"false"`)
  - See [Configuration Guide](CONFIGURATION.md) for details

- **`NODE_TLS_REJECT_UNAUTHORIZED`**: Disable TLS certificate validation
  - Values: `"0"` to disable, `"1"` to enable (default: `"1"`)
  - Use `"0"` only for development with self-signed certificates
  - **Warning:** Never use in production!

- **`GROUPER_ACT_AS_SUBJECT_ID`**: Act as a different subject for administrative operations
- **`GROUPER_ACT_AS_SUBJECT_SOURCE_ID`**: Source ID for act-as subject
- **`GROUPER_ACT_AS_SUBJECT_IDENTIFIER`**: Identifier for act-as subject

See [Configuration Guide](CONFIGURATION.md) for complete configuration options.

## Verifying the Setup

1. Restart Claude Desktop
2. Start a new conversation
3. Ask Claude: "What Grouper tools are available?"
4. Claude should list all available Grouper MCP tools

## Testing the Connection

Try these example prompts:

```
Search for groups containing "test"
Get details for group "edu:test:mygroup"
Show me subjects matching "john"
```

## Troubleshooting

### Tools Not Appearing

1. Check that Claude Desktop is completely restarted (quit from menu, not just close window)
2. Verify the configuration file path is correct for your platform
3. Check that JSON syntax is valid (no trailing commas, proper quotes)

### Connection Errors

1. Enable debug logging: Set `GROUPER_DEBUG` to `"true"`
2. Check logs location:
   - **Docker**: Logs are inside the container at `/home/mcp/.grouper-mcp/logs/`
   - **Local**: Logs are at `~/.grouper-mcp/logs/` (or custom `GROUPER_LOG_DIR`)
3. View logs:
   ```bash
   # Docker
   docker ps  # Get container ID
   docker exec <container-id> cat /home/mcp/.grouper-mcp/logs/grouper-mcp.log

   # Local
   cat ~/.grouper-mcp/logs/grouper-mcp.log
   ```

### Certificate Errors

If you see SSL/TLS certificate errors:
- For development/testing: Set `NODE_TLS_REJECT_UNAUTHORIZED=0`
- For production: Ensure your Grouper instance has a valid SSL certificate

### Authentication Errors

Verify:
- Username and password are correct
- User has appropriate permissions in Grouper
- Base URL is correct and accessible

### Docker-Specific Issues

- Ensure Docker Desktop is running
- Check that the image is built: `docker images | grep grouper-mcp`
- For Docker Desktop networking issues on Mac/Windows, try using `host.docker.internal` instead of `localhost` in URLs

## Read-Only Mode

To run in read-only mode (useful for production monitoring without risk of changes):

```json
{
  "mcpServers": {
    "grouper": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GROUPER_BASE_URL=...",
        "-e", "GROUPER_USERNAME=...",
        "-e", "GROUPER_PASSWORD=...",
        "-e", "READ_ONLY=true",
        "grouper-mcp:latest"
      ]
    }
  }
}
```

See [Configuration Guide](CONFIGURATION.md#read-only-mode) for more details.

## Next Steps

- Review [available tools](TOOLS.md)
- Learn about [configuration options](CONFIGURATION.md)
- See [usage examples](../README.md#examples)

## Additional Resources

- [Grouper MCP Tools Documentation](TOOLS.md)
- [Configuration Guide](CONFIGURATION.md)
- [Claude Desktop MCP Documentation](https://claude.ai/docs/mcp)
