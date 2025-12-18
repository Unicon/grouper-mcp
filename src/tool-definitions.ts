export const toolDefinitions = [
  {
    name: 'grouper_find_groups_by_name_approximate',
    description: 'Search for groups in Grouper by approximate name match. Returns formatted text with comprehensive group information for each matching group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup). Returns count of found groups and formatted details for each match.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for approximate group name matching',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'grouper_get_group_by_exact_name',
    description: 'Get detailed information about a specific group by exact name match. Returns formatted text with comprehensive group information including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup). Returns "Group not found" if the exact group name does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The exact full name of the group to retrieve',
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_get_group_by_uuid',
    description: 'Get detailed information about a specific group by UUID. Returns formatted text with comprehensive group information including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup). Returns "Group not found" if the UUID does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        groupUuid: {
          type: 'string',
          description: 'The UUID of the group to retrieve',
        },
      },
      required: ['groupUuid'],
    },
  },
  {
    name: 'grouper_create_group',
    description: 'Create a new group in Grouper and return detailed information about the created group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The full name of the group (e.g., "edu:example:mygroup")',
        },
        displayExtension: {
          type: 'string',
          description: 'Human-readable display name for the group extension (rightmost part after the last colon). For example, if name is "test:groupFolder:groupName", displayExtension would be shown as "groupName"',
        },
        description: {
          type: 'string',
          description: 'Optional description of the group',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'grouper_update_group',
    description: 'Update an existing group\'s properties and return detailed information about the updated group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup).',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The current name of the group to update',
        },
        displayExtension: {
          type: 'string',
          description: 'New display extension for the group (human-readable name for the rightmost part after the last colon)',
        },
        description: {
          type: 'string',
          description: 'New description for the group',
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_delete_group_by_name',
    description: 'Delete a group from Grouper by name and return detailed information about the deleted group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup).',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group to delete',
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_delete_group_by_uuid',
    description: 'Delete a group from Grouper by UUID and return detailed information about the deleted group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup).',
    inputSchema: {
      type: 'object',
      properties: {
        groupUuid: {
          type: 'string',
          description: 'The UUID of the group to delete',
        },
      },
      required: ['groupUuid'],
    },
  },
  {
    name: 'grouper_delete_group_by_id_index',
    description: 'Delete a group from Grouper by ID index and return detailed information about the deleted group including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata including: hasComposite, createTime, modifyTime, createSubjectId, modifySubjectId, compositeType, typeNames, attributeNames, attributeValues, and composite group information (leftGroup, rightGroup).',
    inputSchema: {
      type: 'object',
      properties: {
        idIndex: {
          type: 'string',
          description: 'The ID index of the group to delete',
        },
      },
      required: ['idIndex'],
    },
  },
  {
    name: 'grouper_add_member',
    description: 'Add one or more members to a group. Supports batch operations - pass multiple subjects in the "subjects" array for efficiency instead of making multiple calls. Returns detailed information about the group and results for each member added. For single member additions, you can use either the "subjectId" parameter OR the "subjects" array.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        subjectId: {
          type: 'string',
          description: 'The subject ID of a single member to add (use this OR subjects array, not both)',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID for single member (used with subjectId)',
        },
        subjectIdentifier: {
          type: 'string',
          description: 'Optional subject identifier for single member (used with subjectId)',
        },
        subjects: {
          type: 'array',
          description: 'Array of subjects to add in a single batch operation. More efficient than multiple calls. Each object requires subjectId, with optional subjectSourceId and subjectIdentifier.',
          items: {
            type: 'object',
            properties: {
              subjectId: {
                type: 'string',
                description: 'Subject ID (required)',
              },
              subjectSourceId: {
                type: 'string',
                description: 'Subject source ID (optional)',
              },
              subjectIdentifier: {
                type: 'string',
                description: 'Subject identifier (optional)',
              },
            },
            required: ['subjectId'],
          },
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_remove_member',
    description: 'Remove one or more members from a group. Supports batch operations - pass multiple subjects in the "subjects" array for efficiency instead of making multiple calls. Returns detailed information about the group and results for each member removed. For single member removals, you can use either the "subjectId" parameter OR the "subjects" array.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        subjectId: {
          type: 'string',
          description: 'The subject ID of a single member to remove (use this OR subjects array, not both)',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID for single member (used with subjectId)',
        },
        subjectIdentifier: {
          type: 'string',
          description: 'Optional subject identifier for single member (used with subjectId)',
        },
        subjects: {
          type: 'array',
          description: 'Array of subjects to remove in a single batch operation. More efficient than multiple calls. Each object requires subjectId, with optional subjectSourceId and subjectIdentifier.',
          items: {
            type: 'object',
            properties: {
              subjectId: {
                type: 'string',
                description: 'Subject ID (required)',
              },
              subjectSourceId: {
                type: 'string',
                description: 'Subject source ID (optional)',
              },
              subjectIdentifier: {
                type: 'string',
                description: 'Subject identifier (optional)',
              },
            },
            required: ['subjectId'],
          },
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_get_members',
    description: 'Get all members of a group with detailed information about both the group and its members. Always includes comprehensive group details and member information including: Subject ID, Display Name, Login ID, Email, Source, Member ID, and additional subject attributes.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        subjectAttributeNames: {
          type: 'string',
          description: 'Comma-separated list of additional subject attribute names to include beyond the default display_name, login_id, email_address (e.g., "lastName,firstName,department")',
        },
        memberFilter: {
          type: 'string',
          description: 'Filter for membership type: "All", "Effective", "Immediate", "Composite", "NonImmediate" (default: "All")',
        },
      },
      required: ['groupName'],
    },
  },
  {
    name: 'grouper_assign_attribute',
    description: 'Assign an attribute to a group and return status of the attribute assignment operation.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        attributeName: {
          type: 'string',
          description: 'The full path of the attribute definition to assign (e.g., "etc:attribute:attestation:attestation")',
        },
        value: {
          type: 'string',
          description: 'Optional value to assign to the attribute. Leave empty for marker attributes (boolean-like flags that are just assigned/unassigned). If you get an error about marker attributes not accepting values, omit this parameter.',
        },
      },
      required: ['groupName', 'attributeName'],
    },
  },
  {
    name: 'grouper_get_subject_by_id',
    description: 'Get detailed information about a specific subject by subject ID. Returns comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes, or "Subject not found" if the subject ID does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectId: {
          type: 'string',
          description: 'The subject ID to retrieve',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID to limit search scope',
        },
      },
      required: ['subjectId'],
    },
  },
  {
    name: 'grouper_get_subject_by_identifier',
    description: 'Get detailed information about a specific subject by subject identifier. Returns comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes, or "Subject not found" if the subject identifier does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectIdentifier: {
          type: 'string',
          description: 'The subject identifier to retrieve',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID to limit search scope',
        },
      },
      required: ['subjectIdentifier'],
    },
  },
  {
    name: 'grouper_search_subjects',
    description: 'Search for subjects using Grouper\'s text search functionality. Returns comprehensive subject information for all matching subjects including Subject ID, Display Name, Description, Source, and additional attributes. Uses Grouper\'s native searchString capability for flexible text matching.',
    inputSchema: {
      type: 'object',
      properties: {
        searchString: {
          type: 'string',
          description: 'Search string to find subjects (searches across names, identifiers, and other subject data)',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID to limit search scope',
        },
      },
      required: ['searchString'],
    },
  },
  {
    name: 'grouper_find_stems_by_name_approximate',
    description: 'Search for stems/folders in Grouper by approximate name match. Stems are organizational folders that contain groups and other stems, forming a hierarchical structure. Returns formatted text with comprehensive stem information for each matching stem including: name (full stem path), displayName (human-readable display name), description (stem purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), and idIndex (numeric ID). Returns count of found stems and formatted details for each match.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for approximate stem name matching',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'grouper_get_stem_by_exact_name',
    description: 'Get detailed information about a specific stem/folder by exact name match. Returns formatted text with comprehensive stem information including: name (full stem path), displayName (human-readable display name), description (stem purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), and idIndex (numeric ID). Returns "Stem not found" if the exact stem name does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        stemName: {
          type: 'string',
          description: 'The exact full name of the stem to retrieve (e.g., "edu:apps" or "org:departments")',
        },
      },
      required: ['stemName'],
    },
  },
  {
    name: 'grouper_get_stem_by_uuid',
    description: 'Get detailed information about a specific stem/folder by UUID. Returns formatted text with comprehensive stem information including: name (full stem path), displayName (human-readable display name), description (stem purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), and idIndex (numeric ID). Returns "Stem not found" if the UUID does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        stemUuid: {
          type: 'string',
          description: 'The UUID of the stem to retrieve',
        },
      },
      required: ['stemUuid'],
    },
  },
  {
    name: 'grouper_get_subject_groups',
    description: 'Get all group memberships for a specific subject/user. Returns formatted text with comprehensive information about each group the subject is a member of, including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, membership type (immediate/effective), and detailed metadata when available. Returns "No group memberships found" if the subject is not a member of any groups.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectId: {
          type: 'string',
          description: 'The subject ID of the user to retrieve group memberships for',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID to limit search scope',
        },
        subjectIdentifier: {
          type: 'string',
          description: 'Optional subject identifier (alternative to subjectId)',
        },
        memberFilter: {
          type: 'string',
          description: 'Filter for membership type: "All", "Effective", "Immediate", "Composite", "NonImmediate" (default: "All")',
        },
        enabled: {
          type: 'string',
          description: 'Filter for enabled groups: "T" for enabled only, "F" for disabled only, or omit for all (default: all)',
        },
      },
      required: ['subjectId'],
    },
  },
  {
    name: 'grouper_trace_membership',
    description: 'Trace how a subject (user) is a member of a group, showing the complete membership path. This tool identifies whether membership is direct (immediate), through intermediate groups (effective), or through composite group operations (union/intersection). Returns a detailed trace showing the chain of memberships from the subject to the target group, including intermediate groups, membership types, and composite operations. Useful for debugging access issues, understanding complex membership hierarchies, and auditing group membership paths. Maximum recursion depth is 10 levels to prevent timeout.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectId: {
          type: 'string',
          description: 'The subject ID of the user to trace membership for',
        },
        groupName: {
          type: 'string',
          description: 'The full group name to trace membership to (e.g., "app:security:admin")',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID (e.g., "ldap", "jdbc"). If not specified, Grouper will search across all sources.',
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum recursion depth for tracing (1-20). Default: 10. Higher values may timeout for complex hierarchies.',
        },
      },
      required: ['subjectId', 'groupName'],
    },
  },
];