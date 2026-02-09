# Use Case: AI-Assisted Cohort Definition Using Set Theory

**Source:** Michael Hodges (University of Hawaii) - Slack conversation, 2026-02-02
**Status:** Implemented (GMCP-15, GMCP-16)
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
| Search/browse available basis groups | `grouper_find_groups_by_name_approximate`, `grouper_find_stems_by_name_approximate` | Can search by approximate name match; supports `stemName`/`stemScope` for hierarchical browsing |
| Get group details & metadata | `grouper_get_group_by_exact_name`, `grouper_get_group_by_uuid` | Returns comprehensive group info including composite details |
| View group membership | `grouper_get_members` | Lists all members with filtering options |
| Trace membership paths | `grouper_trace_membership` | Shows how a user is a member (direct, effective, composite) |
| See a user's group memberships | `grouper_get_subject_groups` | Lists all groups a subject belongs to |
| Create/update/delete groups | `grouper_create_group`, `grouper_update_group`, `grouper_delete_group_*` | Standard group lifecycle operations |
| Create/manage composite groups | `grouper_create_group`, `grouper_update_group` | UNION, INTERSECTION, COMPLEMENT operations via `compositeType`, `leftGroupName`, `rightGroupName` |
| Remove composite definition | `grouper_update_group` | Convert composite back to regular group via `removeComposite: true` |
| Browse groups within a stem | `grouper_find_groups_by_name_approximate` | List all groups in a stem with `stemName` param; supports `ONE_LEVEL` or `ALL_IN_SUBTREE` scope |

#### Previously Identified Gaps — Now Resolved ✅

**1. Composite Group Creation/Management** — IMPLEMENTED ([GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15))

The `grouper_create_group` and `grouper_update_group` tools now support composite group operations via `compositeType`, `leftGroupName`, and `rightGroupName` parameters. Additionally, `grouper_update_group` supports `removeComposite` to convert a composite group back to a regular group.

Supported operations:
- Create composite groups (UNION, INTERSECTION, COMPLEMENT)
- Define left and right factor groups for composites
- Convert an existing group to a composite via update
- Change factor groups or composite type on an existing composite
- Remove composite configuration (convert back to regular group)

**2. Stem Children Listing** — IMPLEMENTED ([GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16))

The `grouper_find_groups_by_name_approximate` tool now accepts `stemName` and `stemScope` parameters, enabling hierarchical browsing:
- `{ "stemName": "edu:college:basis" }` — list all groups recursively under a stem
- `{ "stemName": "edu:college:basis", "stemScope": "ONE_LEVEL" }` — list direct children only
- `{ "query": "faculty", "stemName": "edu:college:basis" }` — search within a stem

#### Remaining Gaps

**3. Membership Preview/Simulation** (NICE TO HAVE)

No way to preview what members would result from a proposed set operation before actually creating the composite group. This can be handled at the AI agent level using existing tools (see Recommendations below).

#### Recommendations

The core capabilities for this use case are now implemented. Remaining recommendation:

1. ~~**Add composite group support**~~ — **DONE** ([GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15))

2. ~~**Add stem children listing**~~ — **DONE** ([GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16))

3. **(Optional) Add membership preview** - Allow simulating set operations to preview resulting membership
   - Can be handled at AI agent level using existing `grouper_get_members` tool to fetch members of both factor groups and compute the set operation in memory

#### API Endpoint Investigation

**Investigation Date:** 2026-02-03

The Grouper Web Services API (v4) was analyzed to determine what operations are available for the identified gaps.

---

##### 1. Composite Group Creation - **IMPLEMENTED** ✅

**Finding:** The existing **Group Save** (`/groups` POST with `WsRestGroupSaveRequest`) endpoint supports creating and managing composite groups. Composite configuration is passed via the `WsGroup.detail` object. Composite removal is supported by setting `hasComposite` to `"F"`.

**Implementation:** The `grouper_create_group` and `grouper_update_group` tools were extended with optional parameters:
- `compositeType` (string): "UNION", "INTERSECTION", or "COMPLEMENT"
- `leftGroupName` (string): Name of the left factor group
- `rightGroupName` (string): Name of the right factor group
- `removeComposite` (boolean, update only): Set to `true` to remove composite definition

**Composite Types Supported:**
- `UNION` - All members from both groups (A ∪ B)
- `INTERSECTION` - Members in both groups (A ∩ B)
- `COMPLEMENT` - Members in left but not in right (A - B)

**Constraints:**
- The composite group must be empty of members when created (composite groups cannot have direct members)
- Requires VIEW/READ privilege on factor groups
- UPDATE GROUP privilege required on the composite group

**Sources:**
- [Grouper: About Composite Groups (UMN)](https://it.umn.edu/services-technologies/how-tos/grouper-about-composite-groups)
- [Create a composite group - Internet2 Wiki](https://spaces.at.internet2.edu/pages/viewpage.action?pageId=16549118)

---

##### 2. Stem Children Listing - **IMPLEMENTED** ✅

**Finding:** The existing **Find Groups** (`/groups` POST with `WsRestFindGroupsRequest`) endpoint supports querying groups within a stem using the `FIND_BY_STEM_NAME` query filter type.

**Implementation:** The `grouper_find_groups_by_name_approximate` tool was extended with optional parameters:
- `stemName` (string): Stem to search within
- `stemScope` (string): "ONE_LEVEL" or "ALL_IN_SUBTREE" (default: "ALL_IN_SUBTREE")

Supports three modes: stem browsing only, name search only, or combined (search within a stem).

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

| Gap | Status | Implementation | Jira |
|-----|--------|---------------|------|
| Composite group creation | ✅ **Implemented** | Extended `grouper_create_group` and `grouper_update_group` with `compositeType`, `leftGroupName`, `rightGroupName` params. Added `removeComposite` to `grouper_update_group`. | [GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15) |
| Stem children listing | ✅ **Implemented** | Extended `grouper_find_groups_by_name_approximate` with `stemName`, `stemScope` parameters | [GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16) |
| Membership preview | ⏳ Not yet implemented | Can be handled at AI agent level using existing `grouper_get_members` tool | N/A |

**Key Principle:** Existing tools were extended rather than creating new ones, keeping the tool count manageable and the API surface intuitive.

The `grouper_update_group` tool supports the full composite lifecycle:
- Converting an existing group to a composite
- Changing factor groups of an existing composite
- Changing composite type (e.g., INTERSECTION → COMPLEMENT)
- Removing composite configuration via `removeComposite: true` (convert back to regular group)