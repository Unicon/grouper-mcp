import { GrouperClient } from './grouper-client.js';
import { GrouperGroup, GrouperMember } from './types.js';
import { logger } from './logger.js';
import { formatSingleGroupDetails, formatGroupCollectionDetails, formatMemberResults, formatSingleStemDetails, formatStemCollectionDetails, formatSubjectMemberships, formatBatchMemberResults, isReadOnlyMode, isWriteTool } from './utils.js';

export async function handleTool(request: any, client: GrouperClient): Promise<any> {
  const args = request.params.arguments || {};
  const toolName = request.params.name;

  // Runtime check: block write operations in read-only mode
  if (isReadOnlyMode() && isWriteTool(toolName)) {
    logger.info(`Write operation blocked in read-only mode: ${toolName}`);
    return {
      content: [
        {
          type: 'text',
          text: `Operation not allowed: Server is running in read-only mode. The tool "${toolName}" performs write operations and cannot be executed.`,
        },
      ],
      isError: true,
    };
  }

  switch (toolName) {

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
      const { groupName, subjectId, subjectSourceId, subjectIdentifier, subjects } = args as {
        groupName: string;
        subjectId?: string;
        subjectSourceId?: string;
        subjectIdentifier?: string;
        subjects?: GrouperMember[];
      };
      try {
        // Build members array - either from subjects array or single subject params
        let members: GrouperMember[];
        if (subjects && Array.isArray(subjects) && subjects.length > 0) {
          members = subjects;
        } else if (subjectId) {
          members = [{ subjectId, subjectSourceId, subjectIdentifier }];
        } else {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Either subjectId or subjects array is required',
              },
            ],
            isError: true,
          };
        }

        const result = await client.addMembers(groupName, members);
        const responseText = formatBatchMemberResults(result, 'added', groupName, members);

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
          isError: !result.success,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error adding member(s): ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_remove_member': {
      const { groupName, subjectId, subjectSourceId, subjectIdentifier, subjects } = args as {
        groupName: string;
        subjectId?: string;
        subjectSourceId?: string;
        subjectIdentifier?: string;
        subjects?: GrouperMember[];
      };
      try {
        // Build members array - either from subjects array or single subject params
        let members: GrouperMember[];
        if (subjects && Array.isArray(subjects) && subjects.length > 0) {
          members = subjects;
        } else if (subjectId) {
          members = [{ subjectId, subjectSourceId, subjectIdentifier }];
        } else {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Either subjectId or subjects array is required',
              },
            ],
            isError: true,
          };
        }

        const result = await client.deleteMembers(groupName, members);
        const responseText = formatBatchMemberResults(result, 'removed', groupName, members);

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
          isError: !result.success,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error removing member(s): ${error instanceof Error ? error.message : 'Unknown error'}`,
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

    case 'grouper_get_subject_by_id': {
      const { subjectId, subjectSourceId } = args as {
        subjectId: string;
        subjectSourceId?: string;
      };
      try {
        const subjects = await client.getSubjects({ subjectId, subjectSourceId });

        if (subjects.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Subject with ID "${subjectId}" not found`,
              },
            ],
          };
        }

        let responseText = `Found ${subjects.length} subject(s) with ID "${subjectId}":\n\n`;

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
              text: `Error retrieving subject: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_subject_by_identifier': {
      const { subjectIdentifier, subjectSourceId } = args as {
        subjectIdentifier: string;
        subjectSourceId?: string;
      };
      try {
        const subjects = await client.getSubjects({ subjectIdentifier, subjectSourceId });

        if (subjects.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Subject with identifier "${subjectIdentifier}" not found`,
              },
            ],
          };
        }

        let responseText = `Found ${subjects.length} subject(s) with identifier "${subjectIdentifier}":\n\n`;

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
              text: `Error retrieving subject: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_search_subjects': {
      const { searchString, subjectSourceId } = args as {
        searchString: string;
        subjectSourceId?: string;
      };
      try {
        const subjects = await client.getSubjects({ searchString, subjectSourceId });

        if (subjects.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No subjects found matching "${searchString}"`,
              },
            ],
          };
        }

        let responseText = `Found ${subjects.length} subject(s) matching "${searchString}":\n\n`;

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

    case 'grouper_find_stems_by_name_approximate': {
      const { query } = args as { query: string };
      try {
        const stems = await client.findStemsByNameApproximate(query);

        if (stems.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No stems found matching "${query}"`,
              },
            ],
          };
        }

        const formattedStems = stems.map(formatStemCollectionDetails).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${stems.length} stem(s) matching "${query}":\n\n${formattedStems}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching stems: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_stem_by_exact_name': {
      const { stemName } = args as { stemName: string };
      try {
        const stem = await client.findStemByFilter({ stemName }, 'FIND_BY_STEM_NAME');
        logger.debug('Stem retrieved by exact name', { stemName, stem });
        if (!stem) {
          return {
            content: [
              {
                type: 'text',
                text: `Stem "${stemName}" not found`,
              },
            ],
          };
        }

        const detailText = formatSingleStemDetails(stem);

        return {
          content: [
            {
              type: 'text',
              text: detailText,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_stem_by_exact_name tool', { stemName, error });
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving stem: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_stem_by_uuid': {
      const { stemUuid } = args as { stemUuid: string };
      try {
        const stem = await client.findStemByFilter({ stemUuid }, 'FIND_BY_STEM_UUID');
        logger.debug('Stem retrieved by UUID', { stemUuid, stem });
        if (!stem) {
          return {
            content: [
              {
                type: 'text',
                text: `Stem with UUID "${stemUuid}" not found`,
              },
            ],
          };
        }

        const detailText = formatSingleStemDetails(stem);

        return {
          content: [
            {
              type: 'text',
              text: detailText,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_stem_by_uuid tool', { stemUuid, error });
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving stem: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'grouper_get_subject_groups': {
      const {
        subjectId,
        subjectSourceId,
        subjectIdentifier,
        memberFilter,
        enabled
      } = args as {
        subjectId: string;
        subjectSourceId?: string;
        subjectIdentifier?: string;
        memberFilter?: string;
        enabled?: string;
      };

      try {
        const result = await client.getSubjectMemberships(subjectId, {
          subjectSourceId,
          subjectIdentifier,
          memberFilter,
          enabled,
        });

        logger.debug('Subject memberships retrieved', { subjectId, result });

        const formattedOutput = formatSubjectMemberships(result);

        return {
          content: [
            {
              type: 'text',
              text: formattedOutput,
            },
          ],
        };
      } catch (error) {
        logger.error('Error in grouper_get_subject_groups tool', { subjectId, error });
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving subject memberships: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}