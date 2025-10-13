# Grouper MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Internet2's Grouper identity management system via web services.

## Features

This MCP server provides **15 core tools** for essential Grouper operations, organized into four main categories:

- **Group Management** (8 tools) - Search, create, retrieve, update, and delete groups
- **Member Management** (3 tools) - Add, remove, and list group members
- **Attribute Management** (1 tool) - Assign attributes to groups
- **Subject Management** (3 tools) - Search for and retrieve information about subjects

For detailed documentation of all available tools, parameters, and usage examples, see **[TOOLS.md](docs/TOOLS.md)**.

This implementation covers the essential group lifecycle and membership management operations that handle most common use cases. Many additional Grouper web service endpoints are not yet implemented but are planned - see the [TODO.md](docs/TODO.md#implement-remaining-web-service-end-points) for the complete list of planned features.

## Configuration

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
```


## Installation

### Option 1: Local Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

### Option 2: Docker Installation

1. Clone this repository
2. Build the Docker image:
   ```bash
   docker build -t grouper-mcp .
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
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

**Environment Variables:**
- `GROUPER_DEBUG`: Set to `"true"` to enable detailed logging for troubleshooting
- `NODE_TLS_REJECT_UNAUTHORIZED`: Set to `"0"` if using self-signed certificates

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