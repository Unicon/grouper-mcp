# TODO - Planned Features and Improvements

## Planned Features

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
- Add configuration examples for additional MCP-compatible AI agents:
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
- **Read-Only Mode** - Configuration option to enable read-only mode via environment variable (`READ_ONLY=true`) or properties file (`config/grouper-mcp.properties`). When enabled, all write operations are blocked at both registration and runtime. Properties file takes precedence over environment variables, enabling immutable read-only Docker images.
- **HTTP/HTTPS Protocol Support via MCPO** - HTTP/SSE access is now supported via [MCPO](https://github.com/open-webui/mcpo) proxy. MCPO provides zero-code HTTP/SSE exposure of the stdio MCP server with API key authentication, auto-generated OpenAPI documentation, support for multiple concurrent connections, and compatibility with Open WebUI and other HTTP-based AI agents. See [README.md - MCPO section](../README.md#exposing-via-httpsse-with-mcpo) for usage instructions. For advanced use cases requiring custom authentication or authorization logic, see [HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md) for detailed implementation guide.
- **Open WebUI Configuration Documentation** - Complete configuration documentation for integrating with Open WebUI via MCPO proxy.