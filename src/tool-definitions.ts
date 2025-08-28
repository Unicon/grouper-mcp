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
        displayName: {
          type: 'string',
          description: 'Human-readable display name for the group',
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
        displayName: {
          type: 'string',
          description: 'New display name for the group',
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
    description: 'Add a member to a group and return detailed information about both the group and the added member. Returns formatted text with comprehensive group information including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata. Also includes detailed subject information for the added member including: Subject ID, Display Name, Login ID, Email, Source, Member ID, and additional subject attributes when available.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        subjectId: {
          type: 'string',
          description: 'The subject ID of the member to add',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID (defaults to main source)',
        },
        subjectIdentifier: {
          type: 'string',
          description: 'Optional subject identifier (alternative to subjectId)',
        },
      },
      required: ['groupName', 'subjectId'],
    },
  },
  {
    name: 'grouper_remove_member',
    description: 'Remove a member from a group and return detailed information about both the group and the removed member. Returns formatted text with comprehensive group information including: name (full group name), displayName (human-readable display name), description (group purpose), uuid (unique identifier), extension (short name), displayExtension (short display name), typeOfGroup (group|role|entity), idIndex (numeric ID), enabled status, and detailed metadata. Also includes detailed subject information for the removed member including: Subject ID, Display Name, Login ID, Email, Source, Member ID, and additional subject attributes when available.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        subjectId: {
          type: 'string',
          description: 'The subject ID of the member to remove',
        },
        subjectSourceId: {
          type: 'string',
          description: 'Optional subject source ID',
        },
        subjectIdentifier: {
          type: 'string',
          description: 'Optional subject identifier (alternative to subjectId)',
        },
      },
      required: ['groupName', 'subjectId'],
    },
  },
  {
    name: 'grouper_get_members',
    description: 'Get all members of a group with detailed information about both the group and its members. Always includes member display name, login ID, and email address. Returns formatted text with member information including: Subject ID, Display Name, Login ID, Email, Source, Member ID, and when detailed information is requested: full group details and additional subject attributes.',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        includeGroupDetail: {
          type: 'boolean',
          description: 'Include detailed information about the group (default: false)',
        },
        includeSubjectDetail: {
          type: 'boolean',
          description: 'Include detailed information about each member/subject (default: false)',
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
    description: 'Assign an attribute to a group',
    inputSchema: {
      type: 'object',
      properties: {
        groupName: {
          type: 'string',
          description: 'The full name of the group',
        },
        attributeName: {
          type: 'string',
          description: 'The name of the attribute definition to assign',
        },
        value: {
          type: 'string',
          description: 'The value to assign to the attribute',
        },
      },
      required: ['groupName', 'attributeName', 'value'],
    },
  },
];