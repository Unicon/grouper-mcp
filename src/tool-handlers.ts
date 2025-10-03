import { GrouperClient } from './grouper-client.js';
import { GrouperGroup } from './types.js';
import { logger } from './logger.js';
import { formatSingleGroupDetails, formatGroupCollectionDetails, formatMemberResults } from './utils.js';

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
      const { name, displayExtension, description } = args as {
        name: string;
        displayExtension?: string;
        description?: string;
      };
      try {
        const newGroup = await client.createGroup({ name, displayExtension, description });
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created group "${name}"${displayExtension ? ` with display extension "${displayExtension}"` : ''}`,
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
      const { groupName, displayExtension, description } = args as {
        groupName: string;
        displayExtension?: string;
        description?: string;
      };
      try {
        const updates: Partial<GrouperGroup> = {};
        if (displayExtension !== undefined) updates.displayExtension = displayExtension;
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
        const result: { success: boolean; group?: any; members?: any[]; subjectAttributeNames?: string[] } = await client.addMember(groupName, member);
        
        if (result.success) {
          let responseText = `Successfully added member "${subjectId}" to group "${groupName}"\n\n`;
          
          // Add group details if available
          if (result.group) {
            responseText += `Group Details:\n${formatSingleGroupDetails(result.group)}\n\n`;
          }
          
          // Add member/subject details if available
          if (result.members && result.members.length > 0) {
            responseText += `Added Member Details:\n`;
            result.members.forEach((subject: any) => {
              responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
              responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
              responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
              
              // Map attribute values using the attribute names if available
              if (subject.attributeValues && result.subjectAttributeNames) {
                result.subjectAttributeNames.forEach((attrName: string, index: number) => {
                  const value = subject.attributeValues[index] || 'N/A';
                  responseText += `- ${attrName}: ${value}\n`;
                });
              }
            });
          }
          
          return {
            content: [
              {
                type: 'text',
                text: responseText.trim(),
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
        const result: { success: boolean; group?: any; members?: any[]; subjectAttributeNames?: string[] } = await client.deleteMember(groupName, member);
        
        if (result.success) {
          let responseText = `Successfully removed member "${subjectId}" from group "${groupName}"\n\n`;
          
          // Add group details if available
          if (result.group) {
            responseText += `Group Details:\n${formatSingleGroupDetails(result.group)}\n\n`;
          }
          
          // Add member/subject details if available
          if (result.members && result.members.length > 0) {
            responseText += `Removed Member Details:\n`;
            result.members.forEach((subject: any) => {
              responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
              responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
              responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
              
              // Map attribute values using the attribute names if available
              if (subject.attributeValues && result.subjectAttributeNames) {
                result.subjectAttributeNames.forEach((attrName: string, index: number) => {
                  const value = subject.attributeValues[index] || 'N/A';
                  responseText += `- ${attrName}: ${value}\n`;
                });
              }
            });
          }
          
          return {
            content: [
              {
                type: 'text',
                text: responseText.trim(),
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
      const { groupName, subjectAttributeNames, memberFilter } = args as {
        groupName: string;
        subjectAttributeNames?: string;
        memberFilter?: string;
      };
      try {
        const options = {
          subjectAttributeNames,
          memberFilter: memberFilter || 'All'
        };
        
        const result = await client.getMembers(groupName, options);
        const formattedText = formatMemberResults(result, true, true);
        
        return {
          content: [
            {
              type: 'text',
              text: formattedText,
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
        value?: string;
      };
      try {
        const attribute = { nameOfAttributeDefName: attributeName, value };
        await client.assignAttribute(groupName, attribute);
        const valueText = value ? ` with value "${value}"` : '';
        return {
          content: [
            {
              type: 'text',
              text: `Successfully assigned attribute "${attributeName}"${valueText} to group "${groupName}"`,
            },
          ],
        };
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
      const { searchQuery, sourceId } = args as {
        searchQuery: string;
        sourceId?: string;
      };
      try {
        const subjects = await client.findSubjects(searchQuery, sourceId);

        if (subjects.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No subjects found matching "${searchQuery}"`,
              },
            ],
          };
        }

        let responseText = `Found ${subjects.length} subjects matching "${searchQuery}":\n\n`;

        subjects.forEach((subject, index) => {
          responseText += `Subject ${index + 1}:\n`;
          responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
          responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
          responseText += `- Description: ${subject.description || 'N/A'}\n`;
          responseText += `- Identifier: ${subject.identifier || 'N/A'}\n`;
          responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
          responseText += `- Result Code: ${subject.resultCode || 'N/A'}\n`;

          if (subject.attributeValues && Object.keys(subject.attributeValues).length > 0) {
            responseText += `- Additional Attributes:\n`;
            Object.entries(subject.attributeValues).forEach(([key, value]) => {
              responseText += `  - ${key}: ${value}\n`;
            });
          }
          responseText += '\n';
        });

        return {
          content: [
            {
              type: 'text',
              text: responseText.trim(),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error finding subjects: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_subject': {
      const { subjectId, subjectIdentifier, subjectSourceId } = args as {
        subjectId?: string;
        subjectIdentifier?: string;
        subjectSourceId?: string;
      };
      try {
        const lookup = { subjectId, subjectIdentifier, subjectSourceId };
        const subject = await client.getSubject(lookup);

        if (!subject) {
          return {
            content: [
              {
                type: 'text',
                text: `Subject not found`,
              },
            ],
          };
        }

        let responseText = `Subject Details:\n`;
        responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
        responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
        responseText += `- Description: ${subject.description || 'N/A'}\n`;
        responseText += `- Identifier: ${subject.identifier || 'N/A'}\n`;
        responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
        responseText += `- Result Code: ${subject.resultCode || 'N/A'}\n`;

        if (subject.attributeValues && Object.keys(subject.attributeValues).length > 0) {
          responseText += `- Additional Attributes:\n`;
          Object.entries(subject.attributeValues).forEach(([key, value]) => {
            responseText += `  - ${key}: ${value}\n`;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
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

    case 'grouper_get_subject_by_id': {
      const { subjectId, sourceId } = args as {
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
                text: `Subject with ID "${subjectId}" not found`,
              },
            ],
          };
        }

        let responseText = `Subject Details:\n`;
        responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
        responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
        responseText += `- Description: ${subject.description || 'N/A'}\n`;
        responseText += `- Identifier: ${subject.identifier || 'N/A'}\n`;
        responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
        responseText += `- Result Code: ${subject.resultCode || 'N/A'}\n`;

        if (subject.attributeValues && Object.keys(subject.attributeValues).length > 0) {
          responseText += `- Additional Attributes:\n`;
          Object.entries(subject.attributeValues).forEach(([key, value]) => {
            responseText += `  - ${key}: ${value}\n`;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
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
      const { searchText, sourceId } = args as {
        searchText: string;
        sourceId?: string;
      };
      try {
        const subjects = await client.searchSubjectsByText(searchText, sourceId);

        if (subjects.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No subjects found containing "${searchText}" in their name or identifier`,
              },
            ],
          };
        }

        let responseText = `Found ${subjects.length} subjects containing "${searchText}":\n\n`;

        subjects.forEach((subject, index) => {
          responseText += `Subject ${index + 1}:\n`;
          responseText += `- Subject ID: ${subject.id || 'N/A'}\n`;
          responseText += `- Display Name: ${subject.name || 'N/A'}\n`;
          responseText += `- Description: ${subject.description || 'N/A'}\n`;
          responseText += `- Identifier: ${subject.identifier || 'N/A'}\n`;
          responseText += `- Source: ${subject.sourceId || 'N/A'}\n`;
          responseText += `- Result Code: ${subject.resultCode || 'N/A'}\n`;

          if (subject.attributeValues && Object.keys(subject.attributeValues).length > 0) {
            responseText += `- Additional Attributes:\n`;
            Object.entries(subject.attributeValues).forEach(([key, value]) => {
              responseText += `  - ${key}: ${value}\n`;
            });
          }
          responseText += '\n';
        });

        return {
          content: [
            {
              type: 'text',
              text: responseText.trim(),
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
}