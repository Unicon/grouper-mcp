# Use Case: AI-Generated Group Descriptions from Loader Configuration

**Source:** Internal discussion
**Status:** Analysis Needed

## Problem Statement

Groups populated by Grouper's loader often have technical configurations (SQL queries, LDAP filters, etc.) that define their membership, but lack human-readable descriptions explaining what the group actually represents. This makes it difficult for users to understand a group's purpose without examining the technical loader configuration.

## Proposed Solution

Leverage an AI agent to:
1. Retrieve a group's loader configuration (stored as attributes)
2. Interpret the loader SQL/LDAP filter to understand the membership criteria
3. Generate a clear, human-readable description
4. Update the group's description field

### Example Workflow

**Before:**
- Group: `edu:apps:lms:students:enrolled`
- Description: *(empty or outdated)*
- Loader SQL: `SELECT netid FROM enrollment WHERE status = 'active' AND term = 'Spring2026'`

**After AI Processing:**
- Description: "Students actively enrolled for Spring 2026 term. Membership is automatically synchronized from the enrollment system."

## Technical Considerations

### Current MCP Tool Support

| Capability | Tool | Status |
|-----------|------|--------|
| Get group with attributes | `grouper_get_group_by_exact_name` | Needs verification - do loader attributes return? |
| Update group description | `grouper_update_group` | ✅ Supported |
| Get specific attributes | `grouper_assign_attribute` | Only assigns, doesn't read |

### Potential Gaps

1. **Attribute Reading** - Need to verify that loader configuration attributes are included in group detail responses. The current tools return `attributeNames` and `attributeValues` in the group detail, but loader config may be stored differently.

2. **Loader Attribute Names** - Need to identify the specific attribute names used for loader configuration:
   - SQL query attribute
   - LDAP filter attribute
   - Loader schedule/type attributes

### Loader Configuration Attributes

Grouper loader configuration is typically stored using attributes like:
- `etc:attribute:loader:grouperLoaderDbName`
- `etc:attribute:loader:grouperLoaderType`
- `etc:attribute:loader:grouperLoaderQuery`
- `etc:attribute:loader:grouperLoaderScheduleType`

## MCP Tool Coverage Analysis

**Analysis Date:** TBD

*TODO: Test whether loader configuration attributes are returned by existing group query tools, or if additional attribute retrieval capabilities are needed.*

## Potential Value

- **Improved discoverability** - Users can understand groups without examining loader configs
- **Documentation automation** - Keep descriptions in sync with actual loader logic
- **Audit support** - Clear descriptions help with access reviews
- **Reduced support burden** - Self-documenting groups

## Implementation Options

### Option A: Fully Supported Today (Optimistic)

If loader attributes are returned in group details, this use case may work with existing tools:
1. Use `grouper_get_group_by_exact_name` to retrieve group + loader config
2. AI interprets the configuration
3. Use `grouper_update_group` to set the description

### Option B: Needs Attribute Reading Enhancement

If loader attributes require explicit retrieval:
1. Add `grouper_get_group_attributes` tool to read all attributes on a group
2. Or extend existing group query tools to include all attribute assignments

## Next Steps

1. [ ] Test if loader attributes are returned by `grouper_get_group_by_exact_name`
2. [ ] Identify the specific attribute names used for loader configuration
3. [ ] Document any gaps in attribute retrieval
4. [ ] Create Jira ticket if enhancements needed
