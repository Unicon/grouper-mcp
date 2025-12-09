# Grouper MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Internet2's Grouper identity management system via web services.

## Features

This MCP server provides **19 core tools** for essential Grouper operations, organized into five main categories:

- **Group Management** (8 tools) - Search, create, retrieve, update, and delete groups
- **Stem/Folder Management** (3 tools) - Search and browse organizational hierarchy
- **Member Management** (3 tools) - Add, remove, and list group members
- **Attribute Management** (1 tool) - Assign attributes to groups
- **Subject Management** (4 tools) - Search for and retrieve information about subjects and their group memberships

For detailed documentation of all available tools, parameters, and usage examples, see **[TOOLS.md](docs/TOOLS.md)**.

This implementation covers the essential group lifecycle and membership management operations that handle most common use cases. Many additional Grouper web service endpoints are not yet implemented but are planned - see the [TODO.md](docs/TODO.md#implement-remaining-web-service-end-points) for the complete list of planned features.

## Configuration

The server supports configuration via environment variables or properties files. Key environment variables:

- **`GROUPER_BASE_URL`** (required): Full URL to Grouper web services endpoint
- **`GROUPER_USERNAME`** (required): Grouper authentication username
- **`GROUPER_PASSWORD`** (required): Grouper authentication password
- **`READ_ONLY`**: Enable read-only mode (`"true"` or `"false"`)
- **`GROUPER_DEBUG`**: Enable detailed debug logging (`"true"` or `"false"`)
- **`NODE_TLS_REJECT_UNAUTHORIZED`**: Set to `"0"` for self-signed certificates (development only)

For complete configuration details including properties files, read-only mode, logging, TLS/SSL, and act-as configuration, see **[Configuration Guide](docs/CONFIGURATION.md)**.

## Installation

### Option 1: Docker Installation (Recommended)

#### Standard stdio MCP Server

For use with Claude Desktop or other MCP clients that support stdio:

```bash
# Clone this repository
git clone <repository-url>
cd grouper-mcp

# Build the Docker image
docker build -t grouper-mcp:latest .
```

#### HTTP-Enabled Server (with MCPO)

For HTTP/SSE access (Open WebUI, web-based AI agents, etc.):

```bash
# Clone this repository
git clone <repository-url>
cd grouper-mcp

# Build the HTTP-enabled Docker image
docker build -f Dockerfile.http -t grouper-mcp:http .
```

This image includes both the MCP server and MCPO proxy, providing instant HTTP access without additional setup.

### Option 2: Local Installation

For development or custom deployments:

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Local Development
Run in development mode with:
```bash
npm run dev
```

### Local Production
Build and run:
```bash
npm run build
npm start
```

### With Claude Desktop

Once you've built the Docker image (see Installation above), Claude Desktop will automatically launch the container when needed. Simply add this configuration to your `claude_desktop_config.json`:

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
        "grouper-mcp:latest"
      ]
    }
  }
}
```

For detailed setup instructions including configuration file locations, local installation, troubleshooting, and more, see **[Claude Desktop Setup Guide](docs/SETUP_CLAUDE_DESKTOP.md)**.

### With Open WebUI

[Open WebUI](https://docs.openwebui.com/) (v0.6.31+) supports MCP servers via HTTP/SSE using MCPO as a proxy.

**Quick Start:**

1. Build and run the HTTP-enabled Docker image as a persistent service:
   ```bash
   docker build -f Dockerfile.http -t grouper-mcp:http .
   # Start the HTTP server (runs continuously - Open WebUI connects to this endpoint)
   docker run -p 8000:8000 \
     -e GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000" \
     -e GROUPER_USERNAME="your_username" \
     -e GROUPER_PASSWORD="your_password" \
     -e MCPO_API_KEY="your-secret-key" \
     grouper-mcp:http
   ```

2. In Open WebUI:
   - Navigate to **⚙️ Admin Settings → External Tools**
   - Click **+ (Add Server)**
   - Select **MCP (Streamable HTTP)**
   - Server URL: `http://localhost:8000`
   - API Key: `your-secret-key`

3. Start chatting and Grouper tools will be available automatically!

For complete setup instructions, MCPO installation options, production deployment, and troubleshooting, see **[Open WebUI Setup Guide](docs/SETUP_OPEN_WEBUI.md)**.

### HTTP/SSE Access with MCPO

[MCPO (MCP-to-OpenAPI Proxy)](https://github.com/open-webui/mcpo) converts the MCP server to HTTP/SSE, enabling RESTful API access with auto-generated documentation.

**Quick Start:**

```bash
# Build and run the all-in-one HTTP image as a persistent service
docker build -f Dockerfile.http -t grouper-mcp:http .
# Start the HTTP server (runs continuously - clients connect to this endpoint)
docker run -p 8000:8000 \
  -e GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000" \
  -e GROUPER_USERNAME="your_username" \
  -e GROUPER_PASSWORD="your_password" \
  -e MCPO_API_KEY="your-secret-key" \
  grouper-mcp:http

# Access the API (once the server is running)
# - Interactive docs: http://localhost:8000/docs
# - OpenAPI schema: http://localhost:8000/openapi.json
```

**Example API Call:**

```bash
curl -X POST http://localhost:8000/grouper_find_groups_by_name_approximate \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "engineering"}'
```

For complete HTTP setup including separate MCPO installation, production deployment with reverse proxy, advanced configuration, and troubleshooting, see **[HTTP/MCPO Setup Guide](docs/SETUP_HTTP.md)**.

## Examples

### Create a new group
```
Create a group named "edu:department:engineering:students" with display name "Engineering Students"
```

### Add members to a group
```
Add user "jdoe" to the group "edu:department:engineering:students"
```

### Search for groups
```
Find all groups containing "engineering" in their name
```

### Get group by UUID
```
Get details for group with UUID "12345678-1234-1234-1234-123456789abc"
```

### Assign attributes
```
Assign attribute "classification" with value "academic" to group "edu:department:engineering:students"
```

### Get subject details
```
Get detailed information for subject with ID "jdoe123"
```

### Search subjects
```
Search for subjects containing "Smith" in their name or other searchable fields
```

## Logging

The server automatically logs all activity to `~/.grouper-mcp/logs/`:
- `grouper-mcp.log` - All messages (info, debug, errors)
- `grouper-mcp-errors.log` - Error messages only

Set `GROUPER_DEBUG=true` to enable verbose debug logging for troubleshooting.

For complete logging configuration including custom log directories and Docker log access, see **[Configuration Guide](docs/CONFIGURATION.md#logging-configuration)**.

## Planned Features

Planned features and improvements are tracked in [TODO.md](docs/TODO.md).

## API Compatibility

This server is designed to work with Grouper v4.0.000 web services API. It should be compatible with most recent versions of Grouper.