# Grouper MCP Tools Documentation

This document provides comprehensive documentation for all available tools in the Grouper MCP server.

## Overview

The Grouper MCP server provides **19 core tools** for essential Grouper operations, organized into five main categories:

- **[Group Management](#group-management)** (8 tools) - Search, create, retrieve, update, and delete groups
- **[Stem/Folder Management](#stemfolder-management)** (3 tools) - Search and browse organizational hierarchy
- **[Member Management](#member-management)** (3 tools) - Add, remove, and list group members
- **[Attribute Management](#attribute-management)** (1 tool) - Assign attributes to groups
- **[Subject Management](#subject-management)** (4 tools) - Search for and retrieve information about subjects and their group memberships

---

## Group Management

### 🔍 grouper_find_groups_by_name_approximate

Search for groups by approximate name matching.

**Parameters:**
- **`query`** (required, string) - Search query for approximate group name matching

**Returns:** Formatted text with comprehensive group information for each matching group, including count of found groups and detailed metadata.

**Example Usage:**
```
Find all groups containing "engineering" in their name
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

Create a new group in Grouper.

**Parameters:**
- **`name`** (required, string) - The full name of the group (e.g., "edu:example:mygroup")
- **`displayExtension`** (optional, string) - Human-readable display name for the group extension (rightmost part after the last colon). For example, if name is "test:groupFolder:groupName", displayExtension would be shown as "groupName"
- **`description`** (optional, string) - Optional description of the group

**Returns:** Detailed information about the created group.

**Example Usage:**
```
Create a group named "edu:department:engineering:students" with displayExtension "Engineering Students" and description "Students in the Engineering Department"
```

---

### ✏️ grouper_update_group

Update an existing group's properties.

**Parameters:**
- **`groupName`** (required, string) - The current name of the group to update
- **`displayExtension`** (optional, string) - New display extension for the group (human-readable name for the rightmost part after the last colon)
- **`description`** (optional, string) - New description for the group

**Returns:** Detailed information about the updated group.

**Example Usage:**
```
Update group "edu:department:engineering:students" with new description "All students enrolled in Engineering programs"
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

Add a member to a group.

**Parameters:**
- **`groupName`** (required, string) - The full name of the group
- **`subjectId`** (required, string) - The subject ID of the member to add
- **`subjectSourceId`** (optional, string) - Optional subject source ID (defaults to main source)
- **`subjectIdentifier`** (optional, string) - Optional subject identifier (alternative to subjectId)

**Returns:** Detailed information about both the group and the added member, including subject details like Subject ID, Display Name, Login ID, Email, Source, Member ID, and additional subject attributes.

**Example Usage:**
```
Add user "jdoe" to group "edu:department:engineering:students"
```

---

### ➖ grouper_remove_member

Remove a member from a group.

**Parameters:**
- **`groupName`** (required, string) - The full name of the group
- **`subjectId`** (required, string) - The subject ID of the member to remove
- **`subjectSourceId`** (optional, string) - Optional subject source ID
- **`subjectIdentifier`** (optional, string) - Optional subject identifier (alternative to subjectId)

**Returns:** Detailed information about both the group and the removed member, including comprehensive subject details.

**Example Usage:**
```
Remove user "jdoe" from group "edu:department:engineering:students"
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