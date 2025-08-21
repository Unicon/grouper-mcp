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

## Other Improvements

_Add additional todo items and planned improvements here._