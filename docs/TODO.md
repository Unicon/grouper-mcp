# TODO - Planned Features and Improvements

## Planned Features

## Implement Remaining Web Service End Points

The Grouper web services API offers many additional endpoints that are **not currently implemented** in this MCP server:

### Stems/Folders Management
- Create and manage organizational folders/stems
- Stem privilege management
- Hierarchical organization operations

### Advanced Privilege Management
- **`grouper_assign_privilege`** _(high priority)_ - Assign a privilege to a subject on a group
  - Support all privilege types: admin, read, update, view, optin, optout
  - Parameters: groupName, subjectId, privilegeType, allowed (true/false)
  - Essential for delegation and access control workflows

- **`grouper_get_privileges`** _(high priority)_ - Get all privileges assigned to a group
  - List all subjects with privileges on a specific group
  - Include privilege type and subject details
  - Support pagination for groups with many privilege assignments

- **`grouper_revoke_privilege`** _(high priority)_ - Remove a privilege from a subject on a group
  - Mirror of assign_privilege for removing access
  - Support all privilege types

- Privilege inheritance and delegation
- Access control queries

### Member Management Enhancements
- **`grouper_has_member`** _(low priority)_ - Check if a subject is a member of a group
  - Parameters: groupName, subjectId
  - Returns: Boolean (true/false) with membership status
  - Optimization for common use case (vs. retrieving full member list)

- **`grouper_get_member_count`** _(low priority)_ - Get the count of members in a group
  - Parameters: groupName, memberFilter (All/Immediate/Effective, default: All)
  - Returns: Just the member count without full member details
  - Performance optimization for large groups

### Subject Management
- Subject source management
- External subject registration

### Attribute Definition Management
- **`grouper_find_attribute_def_names`** _(medium priority)_ - Search for attribute definitions
  - Parameters: searchTerm (optional - return all if omitted)
  - Support pagination for large attribute definition sets
  - Return attribute definition names, descriptions, and types
  - Complements existing `grouper_assign_attribute` tool

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

## Build-Time Tool Filtering

### Granular Tool Control for Docker Builds
- Add ability to specify which specific tools are available at Docker build time
- Tool selection should be immutable and cannot be overridden by environment variables at runtime
- Use cases:
  - Create specialized Docker images with only read operations
  - Create domain-specific images with only group management tools
  - Create images for specific organizational roles (e.g., membership management only)
  - Security hardening by removing unnecessary tools from production images

### Implementation Considerations
- Build-time configuration file or build argument to specify enabled tools
- Filter tools during Docker image build, not at runtime
- Document pattern for creating custom Docker images with tool subsets
- Ensure tool filtering works with both stdio and HTTP/MCPO modes
- Consider creating pre-built image variants (read-only, admin, membership-only, etc.)

## Audit Logging

### Comprehensive Audit Trail for All Operations
- Implement standardized audit logging that runs independently of debug logging
- Audit log should always be enabled (not dependent on GROUPER_DEBUG setting)
- Track all operations performed through the MCP server for compliance and security monitoring

### Audit Log Requirements
- Log all tool invocations with:
  - Timestamp
  - Tool name
  - Input parameters (sanitize sensitive data like passwords)
  - User/subject context (if available via act-as configuration)
  - Operation result (success/failure)
  - Response summary (group created, member added, etc.)
  - Execution time/duration
- Separate audit log file from debug logs (e.g., `grouper-mcp-audit.log`)
- Structured log format (JSON) for easier parsing and integration with SIEM systems
- Log rotation and retention policies
- Configuration options for:
  - Audit log location
  - Log level/verbosity
  - Whether to include full request/response payloads
  - Sensitive data masking rules

### Use Cases
- Compliance auditing (who did what, when)
- Security monitoring and incident response
- Usage analytics and reporting
- Troubleshooting without requiring debug mode
- Integration with enterprise logging systems (Splunk, ELK, etc.)

## Performance Improvements

_No pending performance improvements at this time._

## Other Improvements

_Add additional todo items and planned improvements here._

---

## ✅ Completed Features

- Tool description result formats and standardized error handling
- **Read-Only Mode** - Configuration option to enable read-only mode via environment variable (`READ_ONLY=true`) or properties file (`config/grouper-mcp.properties`). When enabled, all write operations are blocked at both registration and runtime. Properties file takes precedence over environment variables, enabling immutable read-only Docker images.
- **HTTP/HTTPS Protocol Support via MCPO** - HTTP/SSE access is now supported via [MCPO](https://github.com/open-webui/mcpo) proxy. MCPO provides zero-code HTTP/SSE exposure of the stdio MCP server with API key authentication, auto-generated OpenAPI documentation, support for multiple concurrent connections, and compatibility with Open WebUI and other HTTP-based AI agents. See [README.md - MCPO section](../README.md#exposing-via-httpsse-with-mcpo) for usage instructions. For advanced use cases requiring custom authentication or authorization logic, see [HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md) for detailed implementation guide.
- **Open WebUI Configuration Documentation** - Complete configuration documentation for integrating with Open WebUI via MCPO proxy.
- **Batch Membership Operations** - The `grouper_add_member` and `grouper_remove_member` tools now support batch operations. Pass multiple subjects in a single API call via the `subjects` array parameter instead of making multiple calls. Backward compatible - existing single-subject usage still works. Response includes individual success/failure status for each member. See [TOOLS.md](TOOLS.md#member-management) for details.
- **Membership Tracing** - The `grouper_trace_membership` tool traces how a subject is connected to a group, showing the complete membership path. Identifies whether membership is direct (immediate), through intermediate groups (effective), or through composite group operations (union/intersection/complement). Includes cycle detection, configurable max depth (default 10, max 20), and detailed visualization of membership chains. Essential for debugging complex membership hierarchies and understanding effective permissions. See [TOOLS.md](TOOLS.md#-grouper_trace_membership) for details.