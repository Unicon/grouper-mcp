# Use Case: AI-Assisted Cohort Definition Using Set Theory

**Source:** Michael Hodges (University of Hawaii) - Slack conversation, 2026-02-02
**Status:** Planning
**Jira Tickets:** [GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15), [GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16)

### Problem Statement

End users struggle with building complex cohorts using basis groups. Defining the right combination of groups using set theory (unions, intersections, complements) is challenging for non-technical users.

### Proposed Solution

Leverage agentic AI to help Groupings owners:
1. Describe a cohort in natural language
2. Have the AI research available Grouper basis groups
3. Apply set theory to determine the correct group composition
4. Present a solution and allow iteration until the user gets exactly what they need

### Context

From Slack posts:

> "I'm interested in the possibility of MCP assisting a user with applying set theory against the Basis groups to define a group for a cohort of interest to them."

> "I am interested in leveraging agentic AI to help Grouper users leverage our existing stock of basis groups to determine the requirement for the basis group for their respective groupings, which means that they would need to be able to describe a cohort to our agent, it would research our grouper basis groups, apply set theory, and present a solution, and allow them to iterate until they get exactly what they need. This functionality would be useful in the Grouper UI too since I image that end users will always struggle with building the more complex cohorts."

### Technical Considerations

- Would require MCP tools to:
  - Search/browse available basis groups
  - Understand group membership and relationships
  - Construct composite group definitions (include/exclude)
  - Preview resulting membership before committing
- Natural language understanding of cohort descriptions
- Iterative refinement workflow

### Potential Value

- Lower barrier for non-technical users to create complex groups
- Reduce errors in group composition
- Speed up the process of defining cohorts
- Could be integrated into Grouper UI or as a standalone assistant

---

### MCP Tool Coverage Analysis

**Analysis Date:** 2026-02-03

#### Currently Supported ✅

| Capability | Tool(s) | Notes |
|-----------|---------|-------|
| Search/browse available basis groups | `grouper_find_groups_by_name_approximate`, `grouper_find_stems_by_name_approximate` | Can search by approximate name match |
| Get group details & metadata | `grouper_get_group_by_exact_name`, `grouper_get_group_by_uuid` | Returns comprehensive group info including composite details |
| View group membership | `grouper_get_members` | Lists all members with filtering options |
| Trace membership paths | `grouper_trace_membership` | Shows how a user is a member (direct, effective, composite) |
| See a user's group memberships | `grouper_get_subject_groups` | Lists all groups a subject belongs to |
| Create/update/delete groups | `grouper_create_group`, `grouper_update_group`, `grouper_delete_group_*` | Standard group lifecycle operations |

#### Gaps Identified ❌

**1. Composite Group Creation/Management** (CRITICAL)

This is the core requirement for the use case. The MCP currently cannot:
- Create composite groups (union, intersection, complement)
- Define left and right factor groups for composites
- Modify existing composite group definitions

The existing tools *return* composite information (`hasComposite`, `compositeType`, `leftGroup`, `rightGroup`) when querying groups, but there's no tool to **create or manage** composite groups.

**2. Stem Children Listing** (MODERATE)

No way to list all groups/sub-stems within a stem/folder. Users can search by name, but can't browse hierarchically. For example:
- "Show me all basis groups in `edu:college:basis`"
- "What groups exist under `app:myapp`"

**3. Membership Preview/Simulation** (NICE TO HAVE)

No way to preview what members would result from a proposed set operation before actually creating the composite group. This would help users validate their cohort definition before committing.

#### Recommendations

To fully support this use case:

1. **Add composite group support** - Either extend existing tools or add new capability to create/manage composite groups with union, intersection, and complement operations
   - **Jira:** [GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15)

2. **Add stem children listing** - Enable browsing the group hierarchy by listing contents of a stem
   - **Jira:** [GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16)

3. **(Optional) Add membership preview** - Allow simulating set operations to preview resulting membership
   - Can be handled at AI agent level using existing `grouper_get_members` tool

#### API Endpoint Investigation

**Investigation Date:** 2026-02-03

The Grouper Web Services API (v4) was analyzed to determine what operations are available for the identified gaps.

---

##### 1. Composite Group Creation - **API SUPPORTS THIS** ✅

**Finding:** The existing **Group Save** (`/groups` POST with `WsRestGroupSaveRequest`) endpoint already supports creating composite groups. Composite configuration is passed via the `WsGroup.detail` object.

**API Structure:**
```json
{
  "WsRestGroupSaveRequest": {
    "wsGroupToSaves": [{
      "wsGroupLookup": { "groupName": "stem:path:newCompositeGroup" },
      "wsGroup": {
        "name": "stem:path:newCompositeGroup",
        "description": "Intersection of group1 and group2",
        "detail": {
          "hasComposite": "T",
          "compositeType": "INTERSECTION",
          "leftGroup": { "name": "stem:path:group1" },
          "rightGroup": { "name": "stem:path:group2" }
        }
      }
    }],
    "includeGroupDetail": "T"
  }
}
```

**Composite Types Supported:**
- `UNION` - All members from both groups (A ∪ B)
- `INTERSECTION` - Members in both groups (A ∩ B)
- `COMPLEMENT` - Members in left but not in right (A - B)

**Implementation Approach:** Extend the existing `grouper_create_group` tool to accept optional parameters:
- `compositeType` (string): "UNION", "INTERSECTION", or "COMPLEMENT"
- `leftGroupName` (string): Name of the left factor group
- `rightGroupName` (string): Name of the right factor group

When these parameters are provided, the tool would construct the `detail` object with composite configuration.

**Constraints:**
- The composite group must be empty of members when created (composite groups cannot have direct members)
- Requires VIEW/READ privilege on factor groups
- UPDATE GROUP privilege required on the composite group

**Sources:**
- [Grouper: About Composite Groups (UMN)](https://it.umn.edu/services-technologies/how-tos/grouper-about-composite-groups)
- [Create a composite group - Internet2 Wiki](https://spaces.at.internet2.edu/pages/viewpage.action?pageId=16549118)

---

##### 2. Stem Children Listing - **API SUPPORTS THIS** ✅

**Finding:** The existing **Find Groups** (`/groups` POST with `WsRestFindGroupsRequest`) endpoint supports querying groups within a stem using the `FIND_BY_STEM_NAME` query filter type.

**API Structure:**
```json
{
  "WsRestFindGroupsRequest": {
    "wsQueryFilter": {
      "queryFilterType": "FIND_BY_STEM_NAME",
      "stemName": "edu:hawaii:basis",
      "stemNameScope": "ONE_LEVEL"
    },
    "includeGroupDetail": "T"
  }
}
```

**Scope Options:**
- `ONE_LEVEL` - Only groups directly in the specified stem
- `ALL_IN_SUBTREE` - Groups in the stem and all sub-stems (recursive)

**Implementation Approach:** Extend the existing `grouper_find_groups_by_name_approximate` tool to accept optional parameters:
- `stemName` (string): Stem to search within
- `stemScope` (string): "ONE_LEVEL" or "ALL_IN_SUBTREE" (default: "ALL_IN_SUBTREE")

When `stemName` is provided, the tool would use `queryFilterType: "FIND_BY_STEM_NAME"` instead of `FIND_BY_GROUP_NAME_APPROXIMATE`.

**Alternative:** The `findStems` endpoint also supports `parentStemName` and `parentStemNameScope` for listing sub-stems within a stem.

---

##### 3. Membership Preview/Simulation - **NOT DIRECTLY SUPPORTED** ❌

**Finding:** The Grouper API does not have a dedicated endpoint to simulate/preview the result of a composite operation without actually creating the group.

**Workaround Options:**
1. **Manual simulation**: The AI agent could use existing tools to:
   - Get members of the left group (`grouper_get_members`)
   - Get members of the right group (`grouper_get_members`)
   - Apply set operations in memory to compute the result
   - Present the preview to the user

2. **Temporary group approach**: Create a temporary composite group, inspect membership, then delete if not wanted (not recommended - clutters the system)

**Recommendation:** Implement preview functionality at the AI agent level using existing membership tools rather than adding a new MCP tool. This keeps the MCP focused on direct Grouper API operations.

---

#### Implementation Summary

| Gap | API Support | Recommended Approach | Jira |
|-----|-------------|---------------------|------|
| Composite group creation | ✅ Fully supported | **Extend `grouper_create_group`** and **`grouper_update_group`** to accept `compositeType`, `leftGroupName`, `rightGroupName` | [GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15) |
| Stem children listing | ✅ Fully supported | **Extend `grouper_find_groups_by_name_approximate`** to accept `stemName`, `stemScope` parameters | [GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16) |
| Membership preview | ❌ Not supported | Handle at AI agent level using existing `grouper_get_members` tool | N/A |

**Key Principle:** Prefer extending existing tools over creating new ones to keep the tool count manageable and the API surface intuitive.

**Note:** The `grouper_update_group` tool must also be extended to support composite operations, enabling:
- Converting an existing group to a composite
- Changing factor groups of an existing composite
- Changing composite type (e.g., INTERSECTION → COMPLEMENT)
- Removing composite configuration (convert back to regular group)