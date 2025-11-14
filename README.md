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

The server can be configured using environment variables or a properties file.

### Configuration Methods

**Configuration Priority:**
1. **Properties file** (`config/grouper-mcp.properties`) - Highest priority, cannot be overridden
2. **Environment variables** - Used if no properties file exists or setting not defined in properties file
3. **Defaults** - Built-in default values

### Environment Variables

Configure the server using environment variables:

```bash
# Required: Base URL for Grouper web services
export GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000"

# Required: Basic authentication credentials
export GROUPER_USERNAME="your_username"
export GROUPER_PASSWORD="your_password"

# Optional: Act as different subject (for administrative operations)
export GROUPER_ACT_AS_SUBJECT_ID="your_admin_subject_id"
export GROUPER_ACT_AS_SUBJECT_SOURCE_ID="your_subject_source"
export GROUPER_ACT_AS_SUBJECT_IDENTIFIER="your_admin_identifier"

# Optional: Logging configuration
export GROUPER_LOG_DIR="/custom/log/directory"  # Default: ~/.grouper-mcp/logs/
export GROUPER_DEBUG="true"  # Enable verbose debug logging (default: false)

# Optional: Read-only mode
export READ_ONLY="true"  # Enable read-only mode (default: false)
```

### Properties File Configuration

For production deployments or when you need immutable configuration (especially useful for Docker images), use a properties file:

```bash
# 1. Create properties file from example
cp config/grouper-mcp.properties.example config/grouper-mcp.properties

# 2. Edit the properties file and set your configuration
# Example properties:
# grouper-mcp.readOnly=true

# 3. Build Docker image - the properties file will be baked in
docker build -t grouper-mcp:configured .

# 4. The container will use the properties file configuration
# Environment variables cannot override properties file settings
docker run -i grouper-mcp:configured
```

**Benefits of properties file approach:**
- Configuration is immutable at runtime
- Prevents accidental configuration changes via environment variables
- Ideal for production deployments where settings should be locked
- Enables building specialized Docker images (e.g., read-only images)

### Read-Only Mode

The server can be configured to run in read-only mode, which restricts access to read operations only.

**Use cases:**
- Production monitoring and auditing without risk of accidental changes
- Providing safe access to Grouper data for reporting purposes
- Running multiple instances where only some should have write access

**Configuration:**
- Via environment variable: `READ_ONLY=true`
- Via properties file: `grouper-mcp.readOnly=true`

**When read-only mode is enabled:**
- Only read operations are available (searches, queries, retrieving information)
- Write operations (create, update, delete, add/remove members) are blocked
- Blocked tools do not appear in the tool list
- Runtime checks prevent execution if a write tool is somehow called

**Read-only tools** (available when READ_ONLY=true):
- `grouper_find_groups_by_name_approximate` - Search for groups
- `grouper_get_group_by_exact_name` - Get group details by name
- `grouper_get_group_by_uuid` - Get group details by UUID
- `grouper_find_stems_by_name_approximate` - Search for stems/folders
- `grouper_get_stem_by_exact_name` - Get stem details by name
- `grouper_get_stem_by_uuid` - Get stem details by UUID
- `grouper_get_members` - Get group membership information
- `grouper_get_subject_by_id` - Get subject details by ID
- `grouper_get_subject_by_identifier` - Get subject details by identifier
- `grouper_search_subjects` - Search for subjects
- `grouper_get_subject_groups` - Get all group memberships for a subject

**Write tools** (blocked when READ_ONLY=true):
- `grouper_create_group` - Create new groups
- `grouper_update_group` - Modify group properties
- `grouper_delete_group_by_name` - Delete groups by name
- `grouper_delete_group_by_uuid` - Delete groups by UUID
- `grouper_delete_group_by_id_index` - Delete groups by ID index
- `grouper_add_member` - Add members to groups
- `grouper_remove_member` - Remove members from groups
- `grouper_assign_attribute` - Assign attributes to groups

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

### Docker Usage

Run the container with your configuration:

```bash
docker run -i \
  -e GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000" \
  -e GROUPER_USERNAME="your_username" \
  -e GROUPER_PASSWORD="your_password" \
  -e GROUPER_DEBUG="true" \
  -e READ_ONLY="false" \
  -e NODE_TLS_REJECT_UNAUTHORIZED="0" \
  -v $(pwd)/logs:/home/mcp/.grouper-mcp/logs \
  grouper-mcp:latest
```

#### With Claude Desktop (Docker)

Add to your Claude Desktop MCP configuration:

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

### With Claude Desktop (Local)

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "grouper": {
      "command": "node",
      "args": ["/path/to/grouper-mcp/dist/index.js"],
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

**Environment Variables:**
- `GROUPER_DEBUG`: Set to `"true"` to enable detailed logging for troubleshooting
- `READ_ONLY`: Set to `"true"` to enable read-only mode (blocks all write operations)
- `NODE_TLS_REJECT_UNAUTHORIZED`: Set to `"0"` if using self-signed certificates

### With Open WebUI

[Open WebUI](https://docs.openwebui.com/) (v0.6.31+) provides a web-based interface for interacting with AI models and supports MCP servers via Streamable HTTP protocol. You can integrate grouper-mcp with Open WebUI using MCPO as a proxy.

#### Prerequisites

- Open WebUI v0.6.31 or higher
- MCPO installed (see [MCPO section](#exposing-via-httpsse-with-mcpo) below for installation)
- grouper-mcp Docker image built

#### Step 1: Start MCPO with Grouper MCP

**Option A: All-in-One Docker Image (Recommended)**

Use the HTTP-enabled Docker image that includes both MCP server and MCPO:

```bash
# Build the image (if not already built)
docker build -f Dockerfile.http -t grouper-mcp:http .

# Run with HTTP access
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

**For local development with host.docker.internal:**
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

Run MCPO separately to expose the standard grouper-mcp Docker image:

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

**Verify the server is running** by visiting `http://localhost:8000/docs` to see the auto-generated API documentation.

#### Step 2: Configure Open WebUI

1. Log in to your Open WebUI instance
2. Navigate to **⚙️ Admin Settings → External Tools**
3. Click **+ (Add Server)**
4. Select **MCP (Streamable HTTP)** as the server type
5. Configure the connection:
   - **Server URL**: `http://localhost:8000` (or your MCPO server URL)
   - **API Key**: `your-secret-key` (the key you set when starting MCPO)
6. Click **Save**
7. Restart Open WebUI if prompted

#### Step 3: Use Grouper Tools in Open WebUI

Once configured, all grouper-mcp tools will be available in your Open WebUI chats:

- Start a new chat or open an existing conversation
- The AI can now call Grouper tools automatically based on your requests
- Example prompts:
  - "Search for groups containing 'engineering'"
  - "Show me the members of group edu:department:engineering:students"
  - "Create a new group named edu:projects:research with display name 'Research Projects'"

#### Important Notes

- **Transport Protocol**: Open WebUI only supports Streamable HTTP for MCP servers. Traditional stdio MCP servers must be proxied through MCPO.
- **Authentication**: MCPO provides API key authentication. For production deployments, ensure you use strong API keys.
- **Network Access**: If running MCPO on a different machine than Open WebUI, ensure the server URL is accessible from the Open WebUI instance.
- **HTTPS**: For production deployments, consider running MCPO behind a reverse proxy (nginx, Caddy) with HTTPS enabled.
- **Special Characters in Group Names**: Open WebUI converts special characters (like `-`, `:`, etc.) to asterisks (`*`) in tool call parameters. When working with group names containing special characters, wrap them in triple backticks (code blocks) in your prompts to preserve the exact name:
  ```
  Get members of group ```edu:app:my-app:users```
  ```
  Without the code block, the group name might be corrupted (e.g., `edu:app:my-app:users` becomes `edu*app*my*app*users`).

For more information about Open WebUI's MCP support, see the [Open WebUI MCP Documentation](https://docs.openwebui.com/features/mcp/).

### Exposing via HTTP/SSE with MCPO

[MCPO (MCP-to-OpenAPI Proxy)](https://github.com/open-webui/mcpo) is a lightweight proxy that converts MCP servers into OpenAPI-compatible HTTP endpoints. This allows you to expose grouper-mcp tools as RESTful APIs with auto-generated interactive documentation, making them accessible to HTTP-based AI agents and other tools.

#### What is MCPO?

MCPO addresses the limitations of traditional MCP servers that communicate via stdio by:
- Providing a secure HTTP/SSE interface
- Adding authentication support via API keys
- Generating interactive OpenAPI documentation
- Enabling integration with standard HTTP tools and agents

#### Option 1: All-in-One Docker Image (Recommended)

The simplest way to run grouper-mcp with HTTP access is to use the pre-built Docker image that includes both the MCP server and MCPO:

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

**For local development with host.docker.internal:**
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

**Environment Variables:**
- `MCPO_API_KEY`: API key for authentication (default: `change-me-in-production`)
- `MCPO_PORT`: HTTP port (default: `8000`)
- `MCPO_HOST`: Bind address (default: `0.0.0.0`)
- All standard grouper-mcp environment variables (see [Configuration](#configuration))

**Accessing Logs:**

Logs are written to `/home/mcp/.grouper-mcp/logs/` inside the container. To access them:

```bash
# Option 1: Mount a volume to persist logs (recommended)
docker run -p 8000:8000 \
  -v $(pwd)/logs:/home/mcp/.grouper-mcp/logs \
  -e GROUPER_BASE_URL="..." \
  -e MCPO_API_KEY="..." \
  grouper-mcp:http

# Option 2: View logs from a running container
docker exec <container-id> cat /home/mcp/.grouper-mcp/logs/grouper-mcp.log

# Option 3: Copy logs from container to host
docker cp <container-id>:/home/mcp/.grouper-mcp/logs ./logs
```

Log files available:
- `grouper-mcp.log` - All log messages (info, debug, errors)
- `grouper-mcp-errors.log` - Error messages only

#### Option 2: Separate MCPO Installation

If you prefer to run MCPO separately or want more control over the setup:

**Installation:**

Install MCPO via uv (recommended):
```bash
pip install uv  # if not already installed
```

Or via pip:
```bash
pip install mcpo
```

**Basic Usage:**

Expose grouper-mcp via HTTP on port 8000:

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

**For local development/testing with host.docker.internal:**
```bash
uvx mcpo --port 8000 --api-key "top-secret" -- \
  docker run -i --rm \
    -e GROUPER_BASE_URL=https://host.docker.internal:9443/grouper-ws/servicesRest/json/v4_0_000 \
    -e GROUPER_USERNAME=GrouperSystem \
    -e GROUPER_PASSWORD=pass \
    -e GROUPER_DEBUG=true \
    -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
    -e READ_ONLY=false \
    grouper-mcp:latest
```

#### Accessing the HTTP API

Once running, you can access:
- **API endpoint**: `http://localhost:8000`
- **Interactive documentation**: `http://localhost:8000/docs`
- **OpenAPI schema**: `http://localhost:8000/openapi.json`

#### Making API Calls

All API requests require the API key in the Authorization header:

```bash
curl -X POST http://localhost:8000/grouper_find_groups_by_name_approximate \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "engineering"}'
```

#### Advanced MCPO Options

**Custom root path:**
```bash
uvx mcpo --port 8000 --api-key "your-key" --root-path "/api/grouper" -- docker run ...
```

**Using a local build instead of Docker:**
```bash
uvx mcpo --port 8000 --api-key "your-key" -- \
  node /path/to/grouper-mcp/dist/index.js
```

**Multiple MCP servers via config file:**

Create a config file (`mcpo-config.json`):
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
    }
  }
}
```

Run with config:
```bash
uvx mcpo --config mcpo-config.json --api-key "your-key"
```

For more information on MCPO features and configuration options, see the [MCPO documentation](https://github.com/open-webui/mcpo).

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

## Authentication

The server supports Grouper's "act as" functionality for administrative operations. Configure the acting subject using the environment variables listed above.

## Logging

The server automatically logs all activity to help with debugging:

### Log Files
- **Location**: `~/.grouper-mcp/logs/` (default) or custom via `GROUPER_LOG_DIR`
- **Files**:
  - `grouper-mcp.log` - All log messages (info, debug, errors)
  - `grouper-mcp-errors.log` - Error messages only

### What Gets Logged
- Server startup and connection events
- All HTTP requests to Grouper (with credentials redacted)
- All HTTP responses (including error details)
- Detailed error information with context

### Debug Mode
Set `GROUPER_DEBUG=true` to enable verbose debug logging showing:
- Request/response details
- API call parameters
- Detailed error traces

### Example Log Entry
```
[2024-01-15T10:30:45.123Z] [ERROR] HTTP Response: 400 Bad Request {"url":"https://grouper.edu/grouper-ws/servicesRest/json/v4_0_000/groups","status":400,"body":{"error":"Invalid group name format"}}
```

## Error Handling

The server includes comprehensive error handling and logging. Errors are captured and formatted appropriately for display in Claude. Check the log files for detailed error information when troubleshooting.

## Planned Features

Planned features and improvements are tracked in [TODO.md](docs/TODO.md).

## API Compatibility

This server is designed to work with Grouper v4.0.000 web services API. It should be compatible with most recent versions of Grouper.