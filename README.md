# Grouper MCP Server

A containerized Model Context Protocol (MCP) server that provides tools for interacting with Internet2's Grouper identity management system via web services. Supports both HTTP and HTTPS transports with OAuth 2.1 Bearer authentication.

## Features

This MCP server provides **10 core tools** for essential Grouper operations. It focuses on the most commonly used group management functionality.

### Group Management (6 tools)
- **grouper_find_groups_by_name_approximate**: Search for groups by approximate name match
- **grouper_get_group_by_exact_name**: Get detailed information about a specific group by exact name
- **grouper_get_group_by_uuid**: Get detailed information about a specific group by UUID
- **grouper_create_group**: Create a new group
- **grouper_update_group**: Update group properties (display name, description)
- **grouper_delete_group**: Delete a group

### Member Management (3 tools)
- **grouper_add_member**: Add a member to a group
- **grouper_remove_member**: Remove a member from a group
- **grouper_get_members**: Get all members of a group

### Attribute Management (1 tool)
- **grouper_assign_attribute**: Assign an attribute to a group

## Available but Not Implemented

The Grouper web services API offers many additional endpoints that are **not currently implemented** in this MCP server:

### Stems/Folders Management
- Create and manage organizational folders/stems
- Stem privilege management
- Hierarchical organization operations

### Advanced Privilege Management
- Group privilege assignment (admin, read, view, update, etc.)
- Privilege inheritance and delegation
- Access control queries

### Subject Management
- Find subjects across multiple sources
- Subject source management
- External subject registration

### Attribute Definition Management
- Create and manage attribute definitions
- Attribute definition privileges
- Complex attribute operations

### Audit and History
- Audit log queries
- Change history tracking
- Activity monitoring

### Advanced Group Operations
- Group copying and moving
- Composite group creation
- Group type assignment
- Bulk operations

**Note**: This implementation covers the **essential group lifecycle and membership management** operations that handle most common use cases. Additional endpoints can be added based on organizational requirements.

## Architecture

The server is built using:
- **Express.js** HTTP server with Server-Sent Events (SSE) transport
- **Docker** containerization for easy deployment
- **TypeScript** for type safety and development experience
- **OAuth 2.1** Bearer token authentication following MCP specification
- **Multi-stage builds** for optimized container size
- **Self-signed certificates** for local HTTPS development

### Container Architecture
```
┌─────────────────────────────────────────┐
│ Docker Container (grouper-mcp)          │
│ ┌─────────────────────────────────────┐ │
│ │ Express HTTP/HTTPS Server           │ │
│ │ ├── SSE Transport (/sse)            │ │
│ │ ├── Health Check (/health)          │ │
│ │ └── OAuth Metadata (/.well-known)   │ │
│ └─────────────────────────────────────┘ │
│                  │                      │
│                  ▼                      │
│ ┌─────────────────────────────────────┐ │
│ │ Grouper Client                      │ │
│ │ ├── HTTP Basic Auth                 │ │
│ │ ├── Web Services API v4.0           │ │
│ │ └── Error Handling & Logging       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   │
                   ▼
     ┌─────────────────────────────┐
     │ Grouper Instance            │
     │ Web Services API            │
     └─────────────────────────────┘
```

## Quick Start

### Prerequisites
- Docker installed on your system
- Access to a Grouper instance

### 1. Generate HTTPS Certificates
```bash
./bin/generate-certs.sh
```

### 2. Build the Container
```bash
./bin/build.sh
```

### 3. Run the Server
```bash
# HTTPS (recommended for MCP clients requiring secure connections)
./bin/run.sh --https -u https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000

# HTTP (for local development)
./bin/run.sh -u https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000
```

The server will start in detached mode. Use `--foreground` to run in the foreground.

### 4. Verify the Server
```bash
# Test health endpoint
curl -k https://localhost:3443/health

# View OAuth metadata
curl -k https://localhost:3443/.well-known/oauth-protected-resource
```

## Configuration

The container is configured through environment variables:

### Instance Configuration (Container Level)
```bash
GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000"
GROUPER_DEBUG="true"                    # Enable debug logging
NODE_TLS_REJECT_UNAUTHORIZED="0"        # Accept self-signed certificates
```

### Authentication
Credentials are provided by MCP clients via OAuth 2.1 Bearer tokens. The server does not store credentials - they are passed securely through the MCP protocol.

## Command Line Options

### run.sh Options
```bash
./bin/run.sh [OPTIONS]

Options:
  -p, --port PORT     Port to run on (default: 3050 HTTP, 3443 HTTPS)
  -u, --url URL       Grouper base URL
      --no-debug      Disable debug mode
  -f, --foreground    Run in foreground (default: detached)
      --https         Enable HTTPS mode (requires certificates)
  -h, --help          Show help message
```

### Container Management
```bash
# Stop the server
docker stop grouper-mcp-3443  # (or grouper-mcp-3050 for HTTP)

# View logs
docker logs -f grouper-mcp-3443

# Run in foreground for debugging
./bin/run.sh --https -f -u https://your-grouper-url
```

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

## Transport Modes

The server supports multiple transport modes:

### HTTPS Transport (Recommended)
- **Port**: 3443 (default)
- **Features**: OAuth 2.1 Bearer authentication, SSL/TLS security
- **Use case**: Production deployments, MCP clients requiring secure connections
- **Endpoints**:
  - Health: `https://localhost:3443/health`
  - OAuth metadata: `https://localhost:3443/.well-known/oauth-protected-resource`
  - MCP SSE: `https://localhost:3443/sse`

### HTTP Transport
- **Port**: 3050 (default)
- **Features**: OAuth 2.1 Bearer authentication
- **Use case**: Local development, testing
- **Endpoints**:
  - Health: `http://localhost:3050/health`
  - OAuth metadata: `http://localhost:3050/.well-known/oauth-protected-resource`
  - MCP SSE: `http://localhost:3050/sse`

### Stdio Transport
- **Use case**: Local development with direct process communication
- **Command**: `node dist/index.js --transport stdio`

## Authentication

The server supports OAuth 2.1 Bearer token authentication:
- Credentials are provided via the `Authorization: Bearer <token>` header
- Token format: Base64-encoded `username:password`
- No credentials are stored in the container
- Supports Grouper's "act as" functionality for administrative operations

## Logging

The server automatically logs all activity for debugging:

### Container Logs
```bash
# View real-time logs
docker logs -f grouper-mcp-3443

# View recent logs
docker logs --tail 100 grouper-mcp-3443
```

### Log Files (inside container)
- **Location**: `/app/logs/`
- **Files**:
  - `grouper-mcp.log` - All log messages (info, debug, errors)
  - `grouper-mcp-errors.log` - Error messages only

### What Gets Logged
- Server startup and connection events
- All HTTP requests to Grouper (with credentials redacted)
- All HTTP responses (including error details)
- MCP client connections and authentication
- Detailed error information with context

### Debug Mode
Enable with `GROUPER_DEBUG=true` or `--debug` flag:
- Request/response details
- API call parameters
- Detailed error traces
- Authentication flow information

## Troubleshooting

### Health Check
```bash
# HTTPS
curl -k https://localhost:3443/health

# HTTP
curl http://localhost:3050/health
```

### Common Issues
- **Certificate errors**: Use `-k` flag with curl for self-signed certificates
- **Port conflicts**: Change port with `-p` option
- **Connection refused**: Verify container is running with `docker ps`
- **Authentication failures**: Check Bearer token format and Grouper credentials

## Development

For local development without Docker:

```bash
# Install dependencies
npm install

# Generate certificates (for HTTPS mode)
./bin/generate-certs.sh

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start
```

## Files and Scripts

- **`bin/generate-certs.sh`** - Generate self-signed HTTPS certificates
- **`bin/build.sh`** - Build Docker container
- **`bin/run.sh`** - Run Docker container with options
- **`src/`** - TypeScript source code
- **`dist/`** - Compiled JavaScript (after build)
- **`certs/`** - HTTPS certificates (after generation)
- **`Dockerfile`** - Multi-stage container build
- **`docker-compose.yml`** - Container orchestration

## API Compatibility

This server is designed to work with Grouper v4.0.000 web services API. It should be compatible with most recent versions of Grouper that support the v4 REST API.

## Contributing

Planned features and improvements are tracked in [TODO.md](docs/TODO.md). The server is designed to be easily extensible - additional Grouper web service endpoints can be added by:

1. Adding new tool definitions in `src/tool-definitions.ts`
2. Implementing handlers in `src/tool-handlers.ts`
3. Adding corresponding client methods in `src/grouper-client.ts`