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

### GSH Script Execution
- Execute Grouper Shell (GSH) scripts remotely
- Run batch operations and complex administrative tasks
- Custom scripting for advanced workflows

## HTTP/HTTPS Protocol Support (In Progress)
- 🚧 **Work in Progress** - Implementation ongoing in separate branch
- Add option to run the MCP server using HTTP/HTTPS protocol instead of stdio
- This would allow the server to run as an external service rather than locally
- Benefits include:
  - Better separation of concerns and deployment flexibility
  - Ability to run the server on a different machine or container
  - Support for multiple concurrent connections
  - Enhanced monitoring and logging capabilities
  - Docker containerization support
- Implementation includes:
  - HTTP transport layer configuration
  - HTTPS support with SSL certificates
  - OAuth 2.1 Bearer token authentication
  - Docker containerization
  - Port and host binding options
  - Request/response handling over HTTP/HTTPS
  - Documentation updates for HTTP deployment scenarios

**See [HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md) for detailed implementation guide and resources.**

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

## Other Improvements

_Add additional todo items and planned improvements here._

---

## ✅ Completed Features

- Tool description result formats and standardized error handling