import { GrouperClient } from './grouper-client.js';
import { GrouperGroup } from './types.js';
import { logger } from './logger.js';
import { formatSingleGroupDetails, formatGroupCollectionDetails } from './utils.js';

export async function handleTool(request: any, client: GrouperClient): Promise<any> {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {

    case 'grouper_find_groups_by_name_approximate': {
      const { query } = args as { query: string };
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
      const { groupName } = args as { groupName: string };
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
      const { groupUuid } = args as { groupUuid: string };
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
      const { name, displayName, description } = args as {
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
      const { groupName, displayName, description } = args as {
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
      const { groupName } = args as { groupName: string };
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
      const { groupUuid } = args as { groupUuid: string };
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
      const { idIndex } = args as { idIndex: string };
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
      const { groupName, subjectId, subjectSourceId, subjectIdentifier } = args as {
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
      const { groupName, subjectId, subjectSourceId, subjectIdentifier } = args as {
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
      const { groupName } = args as { groupName: string };
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
      const { groupName, attributeName, value } = args as {
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
}