#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GrouperClient } from './grouper-client.js';
import { GrouperConfig, GrouperGroup } from './types.js';
import { logger } from './logger.js';
import { formatSingleGroupDetails, formatGroupCollectionDetails } from './utils.js';


const server = new Server(
  {
    name: 'grouper-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let grouperClient: GrouperClient | null = null;

function initializeGrouperClient(): GrouperClient {
  if (!grouperClient) {
    const config: GrouperConfig = {
      baseUrl: process.env.GROUPER_BASE_URL || 'https://grouperdemo.internet2.edu/grouper-ws/servicesRest/json/v4_0_000',
      username: process.env.GROUPER_USERNAME,
      password: process.env.GROUPER_PASSWORD,
      actAsSubjectId: process.env.GROUPER_ACT_AS_SUBJECT_ID,
      actAsSubjectSourceId: process.env.GROUPER_ACT_AS_SUBJECT_SOURCE_ID,
      actAsSubjectIdentifier: process.env.GROUPER_ACT_AS_SUBJECT_IDENTIFIER,
    };
    grouperClient = new GrouperClient(config);
  }
  return grouperClient;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
        description: 'Add a member to a group',
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
        description: 'Remove a member from a group',
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
        description: 'Get all members of a group',
        inputSchema: {
          type: 'object',
          properties: {
            groupName: {
              type: 'string',
              description: 'The full name of the group',
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = initializeGrouperClient();
  
  switch (request.params.name) {

    case 'grouper_find_groups_by_name_approximate': {
      const { query } = request.params.arguments as { query: string };
      try {
        const groups = await client.findGroupsByNameApproximate(query);
        
        if (groups.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No groups found matching "${query}"`,
              },
            ],
          };
        }
        
        const formattedGroups = groups.map(formatGroupCollectionDetails).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${groups.length} groups matching "${query}":\n\n${formattedGroups}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching groups: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_group_by_exact_name': {
      const { groupName } = request.params.arguments as { groupName: string };
      try {
        const group = await client.findGroupByFilter({ groupName }, 'FIND_BY_GROUP_NAME_EXACT');
        logger.debug('Group retrieved by exact name', { groupName, group });
        if (!group) {
          return {
            content: [
              {
                type: 'text',
                text: `Group "${groupName}" not found`,
              },
            ],
          };
        }
        
        const detailText = formatSingleGroupDetails(group);
        
        return {
          content: [
            {
              type: 'text',
              text: detailText,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_group_by_exact_name tool', { groupName, error });
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_group_by_uuid': {
      const { groupUuid } = request.params.arguments as { groupUuid: string };
      try {
        const group = await client.findGroupByFilter({ groupUuid }, 'FIND_BY_GROUP_UUID');
        logger.debug('Group retrieved by UUID', { groupUuid, group });
        if (!group) {
          return {
            content: [
              {
                type: 'text',
                text: `Group with UUID "${groupUuid}" not found`,
              },
            ],
          };
        }
        
        const detailText = formatSingleGroupDetails(group);
        
        return {
          content: [
            {
              type: 'text',
              text: detailText,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_group_by_uuid tool', { groupUuid, error });
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_create_group': {
      const { name, displayName, description } = request.params.arguments as {
        name: string;
        displayName?: string;
        description?: string;
      };
      try {
        const newGroup = await client.createGroup({ name, displayName, description });
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created group "${name}"${displayName ? ` with display name "${displayName}"` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_update_group': {
      const { groupName, displayName, description } = request.params.arguments as {
        groupName: string;
        displayName?: string;
        description?: string;
      };
      try {
        const updates: Partial<GrouperGroup> = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (description !== undefined) updates.description = description;

        const updatedGroup = await client.updateGroup(groupName, updates);
        
        const detailText = formatSingleGroupDetails(updatedGroup);
        
        return {
          content: [
            {
              type: 'text',
              text: detailText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_delete_group_by_name': {
      const { groupName } = request.params.arguments as { groupName: string };
      try {
        const deletedGroup = await client.deleteGroupByFilter({ groupName });
        if (deletedGroup) {
          const detailText = formatSingleGroupDetails(deletedGroup);
          return {
            content: [
              {
                type: 'text',
                text: `Successfully deleted group:\n\n${detailText}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to delete group "${groupName}" - no group details returned`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_delete_group_by_uuid': {
      const { groupUuid } = request.params.arguments as { groupUuid: string };
      try {
        const deletedGroup = await client.deleteGroupByFilter({ uuid: groupUuid });
        if (deletedGroup) {
          const detailText = formatSingleGroupDetails(deletedGroup);
          return {
            content: [
              {
                type: 'text',
                text: `Successfully deleted group:\n\n${detailText}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to delete group with UUID "${groupUuid}" - no group details returned`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_delete_group_by_id_index': {
      const { idIndex } = request.params.arguments as { idIndex: string };
      try {
        const deletedGroup = await client.deleteGroupByFilter({ idIndex });
        if (deletedGroup) {
          const detailText = formatSingleGroupDetails(deletedGroup);
          return {
            content: [
              {
                type: 'text',
                text: `Successfully deleted group:\n\n${detailText}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to delete group with ID index "${idIndex}" - no group details returned`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting group: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_add_member': {
      const { groupName, subjectId, subjectSourceId, subjectIdentifier } = request.params.arguments as {
        groupName: string;
        subjectId: string;
        subjectSourceId?: string;
        subjectIdentifier?: string;
      };
      try {
        const member = { subjectId, subjectSourceId, subjectIdentifier };
        const success = await client.addMember(groupName, member);
        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully added member "${subjectId}" to group "${groupName}"`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to add member "${subjectId}" to group "${groupName}"`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error adding member: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_remove_member': {
      const { groupName, subjectId, subjectSourceId, subjectIdentifier } = request.params.arguments as {
        groupName: string;
        subjectId: string;
        subjectSourceId?: string;
        subjectIdentifier?: string;
      };
      try {
        const member = { subjectId, subjectSourceId, subjectIdentifier };
        const success = await client.deleteMember(groupName, member);
        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully removed member "${subjectId}" from group "${groupName}"`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to remove member "${subjectId}" from group "${groupName}"`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error removing member: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_members': {
      const { groupName } = request.params.arguments as { groupName: string };
      try {
        const members = await client.getMembers(groupName);
        return {
          content: [
            {
              type: 'text',
              text: `Members of group "${groupName}" (${members.length} total):\n\n${members
                .map(m => `• ${m.id || m.identifier}${m.name ? ` (${m.name})` : ''}${m.sourceId ? ` [${m.sourceId}]` : ''}`)
                .join('\n')}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving members: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_assign_attribute': {
      const { groupName, attributeName, value } = request.params.arguments as {
        groupName: string;
        attributeName: string;
        value: string;
      };
      try {
        const attribute = { nameOfAttributeDefName: attributeName, value };
        const success = await client.assignAttribute(groupName, attribute);
        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully assigned attribute "${attributeName}" with value "${value}" to group "${groupName}"`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to assign attribute "${attributeName}" to group "${groupName}"`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error assigning attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

async function main() {
  logger.info('Starting Grouper MCP server');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Grouper MCP server connected and running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
