# Design Decisions

This document captures key design decisions made during the development of the Grouper MCP Server.

## Tool Design: Multiple Specific Tools vs. Parameterized Generic Tools

**Decision**: Use multiple specific tools rather than generic tools with query type parameters.

**Context**: The Grouper web services API supports many different query filter types (e.g., `FIND_BY_GROUP_NAME_EXACT`, `FIND_BY_GROUP_NAME_APPROXIMATE`, `FIND_BY_GROUP_DESCRIPTION`, `FIND_BY_GROUP_ATTRIBUTE`, etc.). We needed to decide whether to expose this as:

1. Multiple specific tools (e.g., `grouper_find_groups_by_name`, `grouper_find_groups_by_description`)
2. Single generic tool with query type parameter (e.g., `grouper_find_groups` with `queryType` parameter)

**Rationale**:

### Why Multiple Specific Tools:
- **Clearer intent**: Tool names immediately convey purpose and search behavior
- **Better discoverability**: AI agents can see all available search capabilities in the tool list
- **Simpler tool descriptions**: Each tool can have focused, specific documentation without complex parameter explanations
- **Reduced cognitive load**: AI agents don't need to remember or choose between query type parameters
- **Higher reliability**: Less chance of AI agents selecting inappropriate query types
- **Better user experience**: Users can more easily understand what each tool does

### Trade-offs Considered:
- **More tools to maintain**: Accepted as the code sharing underlying implementation minimizes duplication
- **Potential API surface growth**: Mitigated by focusing only on commonly used query types initially

**Implementation**: 
- Current tools: `grouper_find_groups` (approximate name), `grouper_get_group` (exact name)
- Planned tools: `grouper_find_groups_by_description`, `grouper_find_groups_by_attribute`, etc.

**Alignment with MCP Philosophy**: This approach follows the Model Context Protocol philosophy of providing clear, purpose-built tools that AI agents can easily understand and use correctly.

**Date**: 2025-08-21
**Contributors**: Development team discussion