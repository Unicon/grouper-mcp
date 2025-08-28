# TODO - Planned Features and Improvements

## Planned Features

### Read-Only Mode
- Add configuration option to enable read-only mode
- When enabled, all write operations (create, update, delete, add/remove members) would be disabled
- Useful for testing, demonstrations, or restricted access scenarios
- Only search and read operations would be available

## Provide Expected Result Format in Tool Descriptions

AI models rely on tool descriptions to understand how to use tools effectively and interpret their results. Currently, the tool descriptions focus on input parameters but don't specify the expected output format. By adding clear result format documentation to each tool description, AI models will be able to:

- Better understand what data to expect from successful tool calls
- More accurately parse and interpret the returned results
- Provide more relevant follow-up actions based on the structured data

Additionally, error handling should be standardized across all tools. Error states should be caught by the MCP server and provided in the tool results in a consistent, easy-to-parse format that clearly indicates:
- Whether the operation succeeded or failed
- Specific error codes or types when available
- Human-readable error messages
- Contextual information to help with troubleshooting

This improvement would enhance the overall user experience by making tool interactions more predictable and reliable for AI models.

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

## HTTP Protocol Support
- Add option to run the MCP server using HTTP protocol instead of stdio
- This would allow the server to run as an external service rather than locally
- Benefits include:
  - Better separation of concerns and deployment flexibility
  - Ability to run the server on a different machine or container
  - Support for multiple concurrent connections
  - Enhanced monitoring and logging capabilities
- Implementation would require:
  - HTTP transport layer configuration
  - Port and host binding options
  - Request/response handling over HTTP
  - Authentication mechanisms for HTTP connections
  - Documentation updates for HTTP deployment scenarios

**See [HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md) for detailed implementation guide and resources.**

## Possible Bugs

### Group Creation Display Name Issue
- When creating a group, the display name may not be getting set properly
- Need to investigate if the displayName parameter is being correctly passed to the Grouper API
- Verify that created groups have the expected displayName value

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