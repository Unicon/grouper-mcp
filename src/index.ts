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

const server = new Server(
  {
    name: 'grouper-mcp',
    version: '1.0.0',
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
        name: 'grouper_find_groups',
        description: 'Search for groups in Grouper by name or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for group names or descriptions',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'grouper_get_group',
        description: 'Get detailed information about a specific group',
        inputSchema: {
          type: 'object',
          properties: {
            groupName: {
              type: 'string',
              description: 'The full name of the group to retrieve',
            },
          },
          required: ['groupName'],
        },
      },
      {
        name: 'grouper_create_group',
        description: 'Create a new group in Grouper',
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
        description: 'Update an existing group\'s properties',
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
        name: 'grouper_delete_group',
        description: 'Delete a group from Grouper',
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
      {
        name: 'grouper_find_subjects',
        description: 'Search for subjects across all sources or a specific source',
        inputSchema: {
          type: 'object',
          properties: {
            searchQuery: {
              type: 'string',
              description: 'Search query for subject identifiers',
            },
            sourceId: {
              type: 'string',
              description: 'Optional source ID to limit search to specific source',
            },
          },
          required: ['searchQuery'],
        },
      },
      {
        name: 'grouper_get_subject',
        description: 'Get detailed information about a specific subject by ID',
        inputSchema: {
          type: 'object',
          properties: {
            subjectId: {
              type: 'string',
              description: 'The subject ID to retrieve',
            },
            sourceId: {
              type: 'string',
              description: 'Optional source ID where the subject exists',
            },
          },
          required: ['subjectId'],
        },
      },
      {
        name: 'grouper_get_subject_by_identifier',
        description: 'Get detailed information about a specific subject by identifier',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'The subject identifier to retrieve (e.g., username, email)',
            },
            sourceId: {
              type: 'string',
              description: 'Optional source ID where the subject exists',
            },
          },
          required: ['identifier'],
        },
      },
      {
        name: 'grouper_search_subjects_by_text',
        description: 'Search for subjects by text matching their identifiers or names',
        inputSchema: {
          type: 'object',
          properties: {
            searchText: {
              type: 'string',
              description: 'Text to search for in subject identifiers and names',
            },
            sourceId: {
              type: 'string',
              description: 'Optional source ID to limit search to specific source',
            },
          },
          required: ['searchText'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = initializeGrouperClient();
  
  switch (request.params.name) {
    case 'grouper_find_groups': {
      const { query } = request.params.arguments as { query: string };
      try {
        const groups = await client.findGroups(query);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${groups.length} groups matching "${query}":\n\n${groups
                .map(g => `• ${g.name}${g.displayName ? ` (${g.displayName})` : ''}${g.description ? `\n  ${g.description}` : ''}`)
                .join('\n')}`,
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

    case 'grouper_get_group': {
      const { groupName } = request.params.arguments as { groupName: string };
      try {
        const group = await client.getGroup(groupName);
        logger.debug('Group retrieved', { groupName, group });
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
        return {
          content: [
            {
              type: 'text',
              text: `Group: ${group.name}\nDisplay Name: ${group.displayName || 'N/A'}\nDescription: ${group.description || 'N/A'}\nUUID: ${group.uuid || 'N/A'}\nEnabled: ${group.enabled || 'N/A'}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_group tool', { groupName, error });
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

        await client.updateGroup(groupName, updates);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated group "${groupName}"`,
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

    case 'grouper_delete_group': {
      const { groupName } = request.params.arguments as { groupName: string };
      try {
        const success = await client.deleteGroup(groupName);
        if (success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully deleted group "${groupName}"`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to delete group "${groupName}"`,
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

    case 'grouper_find_subjects': {
      const { searchQuery, sourceId } = request.params.arguments as {
        searchQuery: string;
        sourceId?: string;
      };
      try {
        const subjects = await client.findSubjects(searchQuery, sourceId);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${subjects.length} subjects matching "${searchQuery}"${sourceId ? ` in source "${sourceId}"` : ''}:\n\n${subjects
                .map(s => `• ${s.id || s.identifier}${s.name ? ` (${s.name})` : ''}${s.sourceId ? ` [${s.sourceId}]` : ''}${s.description ? `\n  ${s.description}` : ''}`)
                .join('\n')}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching subjects: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_subject': {
      const { subjectId, sourceId } = request.params.arguments as {
        subjectId: string;
        sourceId?: string;
      };
      try {
        const subject = await client.getSubjectById(subjectId, sourceId);
        if (!subject) {
          return {
            content: [
              {
                type: 'text',
                text: `Subject "${subjectId}" not found${sourceId ? ` in source "${sourceId}"` : ''}`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `Subject ID: ${subject.id || 'N/A'}\nIdentifier: ${subject.identifier || 'N/A'}\nName: ${subject.name || 'N/A'}\nSource: ${subject.sourceId || 'N/A'}\nDescription: ${subject.description || 'N/A'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving subject: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_subject_by_identifier': {
      const { identifier, sourceId } = request.params.arguments as {
        identifier: string;
        sourceId?: string;
      };
      try {
        const subject = await client.getSubjectByIdentifier(identifier, sourceId);
        if (!subject) {
          return {
            content: [
              {
                type: 'text',
                text: `Subject with identifier "${identifier}" not found${sourceId ? ` in source "${sourceId}"` : ''}`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `Subject ID: ${subject.id || 'N/A'}\nIdentifier: ${subject.identifier || 'N/A'}\nName: ${subject.name || 'N/A'}\nSource: ${subject.sourceId || 'N/A'}\nDescription: ${subject.description || 'N/A'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving subject: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_search_subjects_by_text': {
      const { searchText, sourceId } = request.params.arguments as {
        searchText: string;
        sourceId?: string;
      };
      try {
        const subjects = await client.searchSubjectsByText(searchText, sourceId);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${subjects.length} subjects matching text "${searchText}"${sourceId ? ` in source "${sourceId}"` : ''}:\n\n${subjects
                .map(s => `• ${s.id || s.identifier}${s.name ? ` (${s.name})` : ''}${s.sourceId ? ` [${s.sourceId}]` : ''}${s.description ? `\n  ${s.description}` : ''}`)
                .join('\n')}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching subjects: ${error instanceof Error ? error.message : 'Unknown error'}`,
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