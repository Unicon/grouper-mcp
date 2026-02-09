# Grouper MCP Tools Documentation

This document provides comprehensive documentation for all available tools in the Grouper MCP server.

## Overview

The Grouper MCP server provides **22 core tools** for essential Grouper operations, organized into six main categories:

- **[Group Management](#group-management)** (8 tools) - Search, create, retrieve, update, and delete groups
- **[Stem/Folder Management](#stemfolder-management)** (3 tools) - Search and browse organizational hierarchy
- **[Member Management](#member-management)** (4 tools) - Add, remove, list group members, and trace membership paths
- **[Privilege Management](#privilege-management)** (2 tools) - Grant, revoke, and query privileges on groups and stems
- **[Attribute Management](#attribute-management)** (1 tool) - Assign attributes to groups
- **[Subject Management](#subject-management)** (4 tools) - Search for and retrieve information about subjects and their group memberships

---

## Group Management

### 🔍 grouper_find_groups_by_name_approximate

Search for groups by approximate name matching and/or within a specific stem (folder). Supports three search modes:

1. **Name search only** - Provide `query` parameter to search by approximate group name
2. **Stem browsing only** - Provide `stemName` to list all groups in that stem
3. **Combined search** - Provide both `query` and `stemName` to search within a specific stem

**Parameters:**
- **`query`** (string) - Search query for approximate group name matching (optional if stemName is provided)
- **`stemName`** (string) - Stem/folder to search within (e.g., "edu:hawaii:basis"). If provided without query, lists all groups in the stem.
- **`stemScope`** (string) - Scope when searching by stem: "ONE_LEVEL" for direct children only, "ALL_IN_SUBTREE" for recursive search (default). Valid values: `ONE_LEVEL`, `ALL_IN_SUBTREE`

**Note:** At least one of `query` or `stemName` must be provided.

**Returns:** Formatted text with comprehensive group information for each matching group, including count of found groups and detailed metadata.

**Example Usage:**
```
# Search by name (original behavior)
Find all groups containing "engineering" in their name
→ Use: { "query": "engineering" }

# List all groups in a stem (recursive)
List all groups under edu:hawaii:basis
→ Use: { "stemName": "edu:hawaii:basis" }

# List direct children only (one level)
List groups directly in edu:hawaii:basis (not in sub-stems)
→ Use: { "stemName": "edu:hawaii:basis", "stemScope": "ONE_LEVEL" }

# Combined search: name within stem
Find groups containing "faculty" under edu:hawaii:basis
→ Use: { "query": "faculty", "stemName": "edu:hawaii:basis" }
```

---

### 📄 grouper_get_group_by_exact_name

Get detailed information about a specific group by exact name match.

**Parameters:**
- **`groupName`** (required, string) - The exact full name of the group to retrieve

**Returns:** Comprehensive group information or "Group not found" if the exact group name does not exist.

**Example Usage:**
```
Get details for group "edu:department:engineering:students"
```

---

### 🆔 grouper_get_group_by_uuid

Get detailed information about a specific group by UUID.

**Parameters:**
- **`groupUuid`** (required, string) - The UUID of the group to retrieve

**Returns:** Comprehensive group information or "Group not found" if the UUID does not exist.

**Example Usage:**
```
Get details for group with UUID "12345678-1234-1234-1234-123456789abc"
```

---

### ➕ grouper_create_group

Create a new group in Grouper. Supports creating regular groups and composite groups (UNION, INTERSECTION, COMPLEMENT of two existing groups).

**Parameters:**
- **`name`** (required, string) - The full name of the group (e.g., "edu:example:mygroup")
- **`displayExtension`** (optional, string) - Human-readable display name for the group extension (rightmost part after the last colon). For example, if name is "test:groupFolder:groupName", displayExtension would be shown as "groupName"
- **`description`** (optional, string) - Optional description of the group
- **`compositeType`** (optional, string) - Type of composite operation: `UNION`, `INTERSECTION`, or `COMPLEMENT`. All three composite parameters must be provided together.
- **`leftGroupName`** (optional, string) - Full name of the left factor group for composite operation
- **`rightGroupName`** (optional, string) - Full name of the right factor group for composite operation

**Returns:** Detailed information about the created group.

**Example Usage:**
```
# Create a regular group
Create a group named "edu:department:engineering:students" with displayExtension "Engineering Students" and description "Students in the Engineering Department"

# Create a UNION composite group (members of either group)
Create a composite group:
→ Use: { "name": "edu:department:all-staff", "compositeType": "UNION", "leftGroupName": "edu:department:faculty", "rightGroupName": "edu:department:staff" }

# Create an INTERSECTION composite group (members in both groups)
→ Use: { "name": "edu:department:faculty-staff", "compositeType": "INTERSECTION", "leftGroupName": "edu:department:faculty", "rightGroupName": "edu:department:staff" }

# Create a COMPLEMENT composite group (members in left but not right)
→ Use: { "name": "edu:department:faculty-only", "compositeType": "COMPLEMENT", "leftGroupName": "edu:department:faculty", "rightGroupName": "edu:department:staff" }
```

---

### ✏️ grouper_update_group

Update an existing group's properties. Can also convert an existing group into a composite group, or remove an existing composite definition to convert it back to a regular group.

**Parameters:**
- **`groupName`** (required, string) - The current name of the group to update
- **`displayExtension`** (optional, string) - New display extension for the group (human-readable name for the rightmost part after the last colon)
- **`description`** (optional, string) - New description for the group
- **`compositeType`** (optional, string) - Type of composite operation: `UNION`, `INTERSECTION`, or `COMPLEMENT`. All three composite parameters must be provided together. Cannot be used with `removeComposite`.
- **`leftGroupName`** (optional, string) - Full name of the left factor group for composite operation
- **`rightGroupName`** (optional, string) - Full name of the right factor group for composite operation
- **`removeComposite`** (optional, boolean) - Set to `true` to remove the composite definition from a group, converting it back to a regular group. Cannot be used with `compositeType`/`leftGroupName`/`rightGroupName`.

**Returns:** Detailed information about the updated group.

**Example Usage:**
```
# Update group description
Update group "edu:department:engineering:students" with new description "All students enrolled in Engineering programs"

# Convert existing group to a composite group
→ Use: { "groupName": "edu:department:all-staff", "compositeType": "UNION", "leftGroupName": "edu:department:faculty", "rightGroupName": "edu:department:staff" }

# Remove composite definition (convert back to regular group)
→ Use: { "groupName": "edu:department:all-staff", "removeComposite": true }
```

---

### 🗑️ grouper_delete_group_by_name

Delete a group from Grouper by name.

**Parameters:**
- **`groupName`** (required, string) - The full name of the group to delete

**Returns:** Detailed information about the deleted group.

**Example Usage:**
```
Delete group "edu:department:engineering:temp_group"
```

---

### 🗑️ grouper_delete_group_by_uuid

Delete a group from Grouper by UUID.

**Parameters:**
- **`groupUuid`** (required, string) - The UUID of the group to delete

**Returns:** Detailed information about the deleted group.

**Example Usage:**
```
Delete group with UUID "12345678-1234-1234-1234-123456789abc"
```

---

### 🗑️ grouper_delete_group_by_id_index

Delete a group from Grouper by ID index.

**Parameters:**
- **`idIndex`** (required, string) - The ID index of the group to delete

**Returns:** Detailed information about the deleted group.

**Example Usage:**
```
Delete group with ID index "12345"
```

---

## Stem/Folder Management

Stems are organizational folders in Grouper that contain groups and other stems, forming a hierarchical structure. They provide the organizational backbone for managing groups.

### 🔍 grouper_find_stems_by_name_approximate

Search for stems/folders by approximate name matching.

**Parameters:**
- **`query`** (required, string) - Search query for approximate stem name matching

**Returns:** Formatted text with comprehensive stem information for each matching stem, including count of found stems and detailed information.

**Example Usage:**
```
Find all stems containing "department" in their name
```

---

### 📁 grouper_get_stem_by_exact_name

Get detailed information about a specific stem/folder by exact name match.

**Parameters:**
- **`stemName`** (required, string) - The exact full name of the stem to retrieve (e.g., "edu:apps" or "org:departments")

**Returns:** Comprehensive stem information or "Stem not found" if the exact stem name does not exist.

**Example Usage:**
```
Get details for stem "edu:apps:webapps"
```

---

### 🆔 grouper_get_stem_by_uuid

Get detailed information about a specific stem/folder by UUID.

**Parameters:**
- **`stemUuid`** (required, string) - The UUID of the stem to retrieve

**Returns:** Comprehensive stem information or "Stem not found" if the UUID does not exist.

**Example Usage:**
```
Get details for stem with UUID "12345678-1234-1234-1234-123456789abc"
```

---

## Member Management

### ➕ grouper_add_member

Add one or more members to a group. **Supports batch operations** - pass multiple subjects in a single call for efficiency instead of making multiple calls.

**Parameters:**

*For single member (backward compatible):*
- **`groupName`** (required, string) - The full name of the group
- **`subjectId`** (string) - The subject ID of a single member to add
- **`subjectSourceId`** (optional, string) - Subject source ID for single member
- **`subjectIdentifier`** (optional, string) - Subject identifier for single member

*For batch operations:*
- **`groupName`** (required, string) - The full name of the group
- **`subjects`** (array) - Array of subjects to add. Each object should have:
  - **`subjectId`** (required, string) - Subject ID
  - **`subjectSourceId`** (optional, string) - Subject source ID
  - **`subjectIdentifier`** (optional, string) - Subject identifier

**Note:** Use either `subjectId` OR `subjects` array, not both. The `subjects` array is more efficient for adding multiple members.

**Returns:** Detailed information about the group and results for each member added, including success/failure status per member.

**Example Usage:**
```
# Single member
Add user "jdoe" to group "edu:department:engineering:students"

# Batch operation (more efficient)
Add users ["jdoe", "jsmith", "mwilson"] to group "edu:department:engineering:students"
```

---

### ➖ grouper_remove_member

Remove one or more members from a group. **Supports batch operations** - pass multiple subjects in a single call for efficiency instead of making multiple calls.

**Parameters:**

*For single member (backward compatible):*
- **`groupName`** (required, string) - The full name of the group
- **`subjectId`** (string) - The subject ID of a single member to remove
- **`subjectSourceId`** (optional, string) - Subject source ID for single member
- **`subjectIdentifier`** (optional, string) - Subject identifier for single member

*For batch operations:*
- **`groupName`** (required, string) - The full name of the group
- **`subjects`** (array) - Array of subjects to remove. Each object should have:
  - **`subjectId`** (required, string) - Subject ID
  - **`subjectSourceId`** (optional, string) - Subject source ID
  - **`subjectIdentifier`** (optional, string) - Subject identifier

**Note:** Use either `subjectId` OR `subjects` array, not both. The `subjects` array is more efficient for removing multiple members.

**Returns:** Detailed information about the group and results for each member removed, including success/failure status per member.

**Example Usage:**
```
# Single member
Remove user "jdoe" from group "edu:department:engineering:students"

# Batch operation (more efficient)
Remove users ["jdoe", "jsmith"] from group "edu:department:engineering:students"
```

---

### 📋 grouper_get_members

Get all members of a group with detailed information.

**Parameters:**
- **`groupName`** (required, string) - The full name of the group
- **`subjectAttributeNames`** (optional, string) - Comma-separated list of additional subject attribute names to include beyond the default display_name, login_id, email_address (e.g., "lastName,firstName,department")
- **`memberFilter`** (optional, string) - Filter for membership type: "All", "Effective", "Immediate", "Composite", "NonImmediate" (default: "All")

**Returns:** Comprehensive group details and member information including Subject ID, Display Name, Login ID, Email, Source, Member ID, and additional subject attributes.

**Example Usage:**
```
Get all members of group "edu:department:engineering:students" including additional attributes "lastName,firstName,department"
```

---

### 🔍 grouper_trace_membership

Trace how a subject (user) is a member of a group, showing the complete membership path. This tool identifies whether membership is direct (immediate), through intermediate groups (effective), or through composite group operations (intersection/complement).

**Parameters:**
- **`subjectId`** (required, string) - The subject ID of the user to trace membership for
- **`groupName`** (required, string) - The full group name to trace membership to (e.g., "app:security:admin")
- **`subjectSourceId`** (optional, string) - Optional subject source ID (e.g., "ldap", "jdbc")
- **`maxDepth`** (optional, number) - Maximum recursion depth for tracing (1-20). Default: 10. Higher values may timeout for complex hierarchies.

**Returns:** Detailed trace showing:
- Whether the subject is a member
- Membership type (immediate, effective, or composite)
- Complete chain of intermediate groups
- Composite group operations (intersection/complement)
- Cycle detection warnings
- Depth limit warnings

**Membership Types:**
- **Immediate**: Subject is directly added to the group
- **Effective**: Subject is member through one or more intermediate groups
- **Composite**: Subject is member through composite group operations

**Example Usage:**
```
Trace membership for user jdoe in group app:security:admin
Show how subject 12345 is a member of org:staff:faculty
Trace membership path with maximum depth of 3
Debug why user has access to a specific group
Understand complex membership hierarchies
Visualize composite group relationships
```

**Use Cases:**
- Debug why a user has access to a group
- Understand complex membership hierarchies
- Visualize composite group relationships
- Audit membership paths for compliance

---

## Privilege Management

### 🔐 grouper_assign_privilege

Grant or revoke one or more privileges on a group or stem for one or more subjects.

**Parameters:**
- **`groupName`** (string) - The full name of the group to assign privileges on (use this OR stemName, not both)
- **`stemName`** (string) - The full name of the stem to assign privileges on (use this OR groupName, not both)
- **`subjectId`** (string) - Subject ID for single subject operation (use this OR subjects array, not both). For user subjects, use their Subject ID. For group subjects, use the group UUID.
- **`subjectSourceId`** (optional, string) - Optional subject source ID for single subject. Not needed when using a group UUID as subjectId.
- **`subjectIdentifier`** (optional, string) - Optional subject identifier for single subject
- **`subjects`** (array) - Array of subjects for batch operation (use this OR subjectId, not both). Each subject can be a user or a group. For groups, use the group UUID as subjectId. Each subject object can have: subjectId (required), subjectSourceId (optional, not needed for group UUIDs), subjectIdentifier (optional)
- **`privilegeNames`** (required, array of strings) - Array of privilege names to assign
- **`allowed`** (string) - Set to "T" to grant privileges (default), "F" to revoke privileges

**Important Note on Group Subjects:**
Subjects can be either users or groups. When assigning privileges to a group as a subject, use the group's UUID as the subjectId (the group name will not work). Grouper will automatically recognize the UUID as a group without needing to specify subjectSourceId.

**Access Privileges (for groups):**
- `read` - View group membership
- `view` - View group metadata
- `update` - Modify group properties
- `admin` - Full administrative access
- `optin` - Allow users to opt into the group
- `optout` - Allow users to opt out of the group
- `groupAttrRead` - Read group attributes
- `groupAttrUpdate` - Update group attributes

**Naming Privileges (for stems):**
- `stem` - Basic stem access
- `create` - Create groups/stems under this stem
- `stemAdmin` - Full stem administrative access
- `stemView` - View stem metadata
- `stemAttrRead` - Read stem attributes
- `stemAttrUpdate` - Update stem attributes

**Returns:** Formatted results showing success/failure for each privilege assignment with group/stem details.

**Example Usage:**
```json
// Grant admin privilege on a group to a single user
{
  "groupName": "app:my-application:admins",
  "subjectId": "jdoe",
  "privilegeNames": ["admin"],
  "allowed": "T"
}

// Grant admin privilege to a group (using group UUID)
{
  "groupName": "app:my-application:data",
  "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "privilegeNames": ["admin"],
  "allowed": "T"
}

// Revoke read privilege from multiple users
{
  "groupName": "app:my-application:data",
  "subjects": [
    {"subjectId": "user1"},
    {"subjectId": "user2"}
  ],
  "privilegeNames": ["read"],
  "allowed": "F"
}

// Grant naming privileges on a stem
{
  "stemName": "app:my-application",
  "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "privilegeNames": ["stemAdmin", "create"],
  "allowed": "T"
}
```

**Use Cases:**
- Grant administrative access to group managers
- Delegate stem management to departmental administrators
- Revoke privileges when access is no longer needed
- Batch assign privileges to multiple users
- Set up fine-grained access control

---

### 🔍 grouper_get_privileges

Get privileges on a group or stem, optionally filtered by subject or privilege name.

**Parameters:**
- **`groupName`** (string) - The full name of the group to query privileges on (use this OR stemName, not both)
- **`stemName`** (string) - The full name of the stem to query privileges on (use this OR groupName, not both)
- **`subjectId`** (optional, string) - Filter results to a specific subject ID
- **`subjectSourceId`** (optional, string) - Subject source ID for filtering
- **`subjectIdentifier`** (optional, string) - Subject identifier for filtering
- **`privilegeName`** (optional, string) - Filter to a specific privilege name (e.g., "admin", "read")

**Returns:** Formatted list showing all privileges with subject information, privilege type, and whether they are revokable.

**Important Note on Results:**
Results may include both user subjects (from sources like 'jdbc2_test' or 'ldap') and group subjects (from source 'g:gsa'). Group subjects are identified by their UUID as the Subject ID and their group name as the Subject Name. This allows you to see when groups themselves have been granted privileges on other groups or stems.

**Example Usage:**
```json
// Get all privileges on a group
{
  "groupName": "app:my-application:admins"
}

// Get privileges for a specific subject
{
  "groupName": "app:my-application:admins",
  "subjectId": "jdoe"
}

// Get only admin privileges on a stem
{
  "stemName": "app:my-application",
  "privilegeName": "stemAdmin"
}
```

**Use Cases:**
- Audit who has access to manage a group
- Check if a specific user has admin privileges
- Review privilege assignments before making changes
- Generate access reports for compliance

---

## Attribute Management

### 🏷️ grouper_assign_attribute

Assign an attribute to a group.

**Parameters:**
- **`groupName`** (required, string) - The full name of the group
- **`attributeName`** (required, string) - The full path of the attribute definition to assign (e.g., "etc:attribute:attestation:attestation")
- **`value`** (optional, string) - Optional value to assign to the attribute. Leave empty for marker attributes (boolean-like flags that are just assigned/unassigned). If you get an error about marker attributes not accepting values, omit this parameter.

**Returns:** Status of the attribute assignment operation.

**Example Usage:**
```
Assign attribute "classification" with value "academic" to group "edu:department:engineering:students"
```

---

## Subject Management

### 🆔 grouper_get_subject_by_id

Get detailed information about subjects by subject ID using Grouper's native lookup functionality.

**Parameters:**
- **`subjectId`** (required, string) - The subject ID to retrieve
- **`subjectSourceId`** (optional, string) - Optional subject source ID to limit search scope

**Returns:** Comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes, or "Subject not found" if the subject ID does not exist.

**Example Usage:**
```
Get details for subject with ID "jdoe123"
```

---

### 🔖 grouper_get_subject_by_identifier

Get detailed information about subjects by subject identifier using Grouper's native lookup functionality.

**Parameters:**
- **`subjectIdentifier`** (required, string) - The subject identifier to retrieve
- **`subjectSourceId`** (optional, string) - Optional subject source ID to limit search scope

**Returns:** Comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes, or "Subject not found" if the subject identifier does not exist.

**Example Usage:**
```
Get details for subject with identifier "jdoe"
```

---

### 🔍 grouper_search_subjects

Search for subjects using Grouper's native text search functionality (searchString).

**Parameters:**
- **`searchString`** (required, string) - Search string to find subjects (searches across names, identifiers, and other subject data using Grouper's native search capabilities)
- **`subjectSourceId`** (optional, string) - Optional subject source ID to limit search scope

**Returns:** Comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes. Uses Grouper's native searchString capability for flexible text matching.

**Example Usage:**
```
Search for subjects containing "Smith" in their name or other searchable fields
```

---

### 👥 grouper_get_subject_groups

Get all group memberships for a specific subject/user.

**Parameters:**
- **`subjectId`** (required, string) - The subject ID of the user to retrieve group memberships for
- **`subjectSourceId`** (optional, string) - Optional subject source ID to limit search scope
- **`subjectIdentifier`** (optional, string) - Optional subject identifier (alternative to subjectId)
- **`memberFilter`** (optional, string) - Filter for membership type: "All", "Effective", "Immediate", "Composite", "NonImmediate" (default: "All")
- **`enabled`** (optional, string) - Filter for enabled groups: "T" for enabled only, "F" for disabled only, or omit for all (default: all)

**Returns:** Formatted text with comprehensive information about each group the subject is a member of, including group details, membership type (immediate/effective), and enabled status. Returns "No group memberships found" if the subject is not a member of any groups.

**Example Usage:**
```
Get all groups for user jdoe
Get immediate group memberships for subject ID 12345
Get enabled group memberships for subject identifier jsmith@example.edu
```

---

## Common Response Format

All tools return comprehensive information when applicable, including:

### Group Information
- **name** - Full group name/path
- **displayName** - Human-readable display name (full path)
- **description** - Group purpose description
- **uuid** - Unique identifier
- **extension** - Short name (rightmost part after last colon)
- **displayExtension** - Human-readable version of extension
- **typeOfGroup** - Type (group|role|entity)
- **idIndex** - Numeric ID
- **enabled** - Enabled status

### Stem/Folder Information
- **name** - Full stem name/path
- **displayName** - Human-readable display name (full path)
- **description** - Stem purpose description
- **uuid** - Unique identifier
- **extension** - Short name (rightmost part after last colon)
- **displayExtension** - Human-readable version of extension
- **idIndex** - Numeric ID

### Detailed Metadata
- **hasComposite** - Whether group has composite membership
- **createTime** - When the group was created
- **modifyTime** - When the group was last modified
- **createSubjectId** - Who created the group
- **modifySubjectId** - Who last modified the group
- **compositeType** - Type of composite (if applicable)
- **typeNames** - Associated type names
- **attributeNames** - Assigned attribute names
- **attributeValues** - Assigned attribute values
- **leftGroup/rightGroup** - Composite group information (if applicable)

### Subject/Member Information
- **Subject ID** - Unique subject identifier
- **Display Name** - Human-readable name
- **Description** - Subject description
- **Identifier** - Subject identifier (alternative lookup)
- **Login ID** - Login identifier
- **Email** - Email address
- **Source** - Subject source system
- **Member ID** - Membership identifier (for group membership operations)
- **Result Code** - Success/failure status for subject operations
- **Additional Attributes** - Any requested additional subject attributes

---

## Error Handling

All tools include comprehensive error handling:
- Clear error messages for common issues
- Detailed context for troubleshooting
- Appropriate error codes when available
- "Not found" responses for missing resources

---

## Notes

- **Group Names**: Use full path notation with colons (e.g., "edu:department:engineering:students")
- **Stem Names**: Use full path notation with colons (e.g., "edu:apps:webapps"). Stems are the organizational folders that contain groups
- **Hierarchical Structure**: Stems form a tree structure where stems can contain other stems and groups
- **Subject Sources**: Most operations default to the main subject source if not specified
- **Permissions**: Operations require appropriate Grouper permissions for the authenticated user
- **Case Sensitivity**: Group names, stem names, and subject IDs are typically case-sensitive
- **Attribute Definitions**: Must use full path notation for attribute names
