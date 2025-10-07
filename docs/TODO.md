# TODO - Planned Features and Improvements

## Planned Features

### Read-Only Mode
- Add configuration option to enable read-only mode
- When enabled, all write operations (create, update, delete, add/remove members) would be disabled
- Useful for testing, demonstrations, or restricted access scenarios
- Only search and read operations would be available

## Implement Remaining Web Service End Points

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

### GSH Script Execution
- Execute Grouper Shell (GSH) scripts remotely
- Run batch operations and complex administrative tasks
- Custom scripting for advanced workflows

## Streamable HTTP Transport Support (Planned - Phased Approach)

This feature will enable the MCP server to run as a remote service accessible over HTTPS using the modern Streamable HTTP transport protocol (MCP spec 2025-03-26).

### Benefits
- Remote access from any MCP-compatible client
- Support for multiple concurrent connections/sessions
- Enhanced deployment flexibility (Docker, cloud platforms)
- Centralized server management
- Better monitoring and logging capabilities

### Implementation Phases

#### Phase 1: Local Streamable HTTPS (No Authentication) ✅ COMPLETED
- ✅ Convert from stdio to Streamable HTTP transport over HTTPS
- ✅ Reused existing self-signed SSL certificates
- ✅ Implement session management using `StreamableHTTPServerTransport`
- ✅ Add Express.js HTTPS server with single `/mcp` endpoint
- ✅ Support concurrent sessions via Map-based transport storage
- ✅ Test locally without authentication
- ✅ Keep stdio transport working alongside HTTPS (both fully operational)

**Status**: ✅ Completed (2025-10-06)

**Key Implementation Details:**
- Created `src/server-core.ts` - Shared MCP server logic for both transports
- Created `src/http-server.ts` - HTTPS server with session management
- Refactored `src/index.ts` - Uses shared core for stdio transport
- Added npm scripts: `npm run start:http` and `npm run dev:http`
- Health endpoint: `GET /health`
- MCP endpoint: `POST /mcp`
- Session deletion: `DELETE /mcp`

**See**: [STREAMABLE_HTTP_IMPLEMENTATION.md](STREAMABLE_HTTP_IMPLEMENTATION.md) for implementation guide

#### Phase 2: Docker Containerization ✅ COMPLETED
- ✅ Create Dockerfile for server (multi-stage build)
- ✅ Docker Compose setup for easy deployment
- ✅ Environment variable management (.env support)
- ✅ Volume mounting for logs and SSL certificates
- ✅ Multi-stage builds for optimized images (197MB Alpine-based)
- ✅ Development Docker Compose with hot-reload
- ✅ Helper scripts for build/run/stop operations
- ✅ Health checks at container level
- ✅ Non-root user (nodejs:nodejs) for security
- ✅ Comprehensive deployment documentation

**Status**: ✅ Completed (2025-10-06)

**Key Implementation Details:**
- Created `Dockerfile` - Multi-stage production build
- Created `Dockerfile.dev` - Development build with hot-reload
- Created `docker-compose.yml` - Production deployment
- Created `docker-compose.dev.yml` - Development deployment
- Created helper scripts in `scripts/`: docker-build.sh, docker-run.sh, docker-stop.sh
- Updated package.json with Docker npm scripts
- Image size: 197MB (Alpine Linux base)
- Container runs as non-root user for security
- Health checks every 30s via HTTPS endpoint
- Logs persisted to named volume `grouper-logs`
- SSL certificates mounted read-only from `./certs`

**See**: [docs/DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for comprehensive deployment guide

#### Phase 3: OAuth 2.1 Authentication 🔐
- Implement OAuth 2.1 with PKCE
- Bearer token authentication
- OAuth discovery endpoints (`.well-known/*`)
- Token management and validation
- Secure production deployment

**Status**: Not started

**Note**: The previous HTTP_FEATURE_NOTES.md document contains reference information but is not the current implementation plan.

## Possible Bugs

_No known bugs at this time._

## Testing Infrastructure

### Automated Testing
- Add unit tests for GrouperClient methods
- Add integration tests for MCP tool handlers
- Create test fixtures with mock Grouper API responses
- Test error handling scenarios with various Grouper API error responses
- Add tests for formatting functions (formatSingleGroupDetails, formatGroupCollectionDetails)
- Set up continuous integration to run tests on code changes
- Create test utilities for mocking Grouper API calls

### Test Coverage Goals
- Client method functionality (create, read, update, delete operations)
- Error handling and parsing of Grouper API errors
- Tool parameter validation and response formatting
- Authentication and configuration handling

## Documentation Improvements

### Multi-Agent Configuration Documentation
- Add configuration examples for other MCP-compatible AI agents beyond Claude Desktop
- Include setup instructions for:
  - Continue (VS Code extension)
  - Cline (VS Code extension)
  - Zed Editor
  - Other MCP-compatible tools and platforms
- Document any agent-specific configuration differences or requirements
- Provide troubleshooting tips for each platform

## Other Improvements

_Add additional todo items and planned improvements here._

---

## ✅ Completed Features

- Tool description result formats and standardized error handling