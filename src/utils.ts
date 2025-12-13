import { GrouperGroup, GrouperStem, BatchMemberResult, GrouperMember } from './types.js';
import { config } from './config.js';

/**
 * Check if the server is running in read-only mode
 * Priority: config/grouper-mcp.properties > READ_ONLY env var > false
 */
export function isReadOnlyMode(): boolean {
  return config.getBoolean('grouper-mcp.readOnly', 'READ_ONLY', false);
}

/**
 * List of tool names that perform write operations
 */
export const WRITE_TOOLS = [
  'grouper_create_group',
  'grouper_update_group',
  'grouper_delete_group_by_name',
  'grouper_delete_group_by_uuid',
  'grouper_delete_group_by_id_index',
  'grouper_add_member',
  'grouper_remove_member',
  'grouper_assign_attribute',
] as const;

/**
 * Check if a tool name is a write operation
 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.includes(toolName as any);
}

export function formatSingleGroupDetails(group: GrouperGroup): string {
  let detailText = `Group: ${group.name}\nDisplay Name: ${group.displayName || 'N/A'}\nDescription: ${group.description || 'N/A'}\nUUID: ${group.uuid || 'N/A'}\nExtension: ${group.extension || 'N/A'}\nDisplay Extension: ${group.displayExtension || 'N/A'}\nType of Group: ${group.typeOfGroup || 'N/A'}\nID Index: ${group.idIndex || 'N/A'}\nEnabled: ${group.enabled || 'N/A'}`;
  
  if (group.enabledTime) detailText += `\nEnabled Time: ${group.enabledTime}`;
  if (group.disabledTime) detailText += `\nDisabled Time: ${group.disabledTime}`;
  if (group.alternateName) detailText += `\nAlternate Name: ${group.alternateName}`;
  
  if (group.detail) {
    detailText += '\n\n--- Detailed Information ---';
    if (group.detail.createTime) detailText += `\nCreated: ${group.detail.createTime}`;
    if (group.detail.createSubjectId) detailText += `\nCreated By: ${group.detail.createSubjectId}`;
    if (group.detail.modifyTime) detailText += `\nModified: ${group.detail.modifyTime}`;
    if (group.detail.modifySubjectId) detailText += `\nModified By: ${group.detail.modifySubjectId}`;
    if (group.detail.hasComposite) detailText += `\nHas Composite: ${group.detail.hasComposite}`;
    if (group.detail.compositeType) detailText += `\nComposite Type: ${group.detail.compositeType}`;
    if (group.detail.leftGroup) detailText += `\nLeft Group: ${group.detail.leftGroup}`;
    if (group.detail.rightGroup) detailText += `\nRight Group: ${group.detail.rightGroup}`;
    if (group.detail.isCompositeFactor) detailText += `\nIs Composite Factor: ${group.detail.isCompositeFactor}`;
    if (group.detail.typeNames && group.detail.typeNames.length > 0) {
      detailText += `\nType Names: ${group.detail.typeNames.join(', ')}`;
    }
    if (group.detail.attributeNames && group.detail.attributeNames.length > 0) {
      detailText += `\nAttribute Names: ${group.detail.attributeNames.join(', ')}`;
    }
    if (group.detail.attributeValues && group.detail.attributeValues.length > 0) {
      detailText += `\nAttribute Values: ${group.detail.attributeValues.join(', ')}`;
    }
  }
  
  return detailText;
}

export function formatGroupCollectionDetails(group: any): string {
  let detailText = `• ${group.name}${group.displayName ? ` (${group.displayName})` : ''}`;
  if (group.description) detailText += `\n  Description: ${group.description}`;
  if (group.uuid) detailText += `\n  UUID: ${group.uuid}`;
  if (group.extension) detailText += `\n  Extension: ${group.extension}`;
  if (group.typeOfGroup) detailText += `\n  Type: ${group.typeOfGroup}`;
  if (group.enabled) detailText += `\n  Enabled: ${group.enabled}`;
  
  if (group.detail) {
    if (group.detail.createTime) detailText += `\n  Created: ${group.detail.createTime}`;
    if (group.detail.createSubjectId) detailText += `\n  Created By: ${group.detail.createSubjectId}`;
    if (group.detail.modifyTime) detailText += `\n  Modified: ${group.detail.modifyTime}`;
    if (group.detail.hasComposite && group.detail.hasComposite === 'T') {
      detailText += `\n  Composite: ${group.detail.compositeType || 'Yes'}`;
      if (group.detail.leftGroup) detailText += ` (${group.detail.leftGroup}`;
      if (group.detail.rightGroup) detailText += ` ${group.detail.compositeType?.toLowerCase() || 'with'} ${group.detail.rightGroup})`;
    }
  }
  return detailText;
}

export function formatMemberResults(result: any, includeGroupDetail?: boolean, includeSubjectDetail?: boolean): string {
  const members = result.wsSubjects || [];
  const group = result.wsGroup;
  
  let output = '';
  
  // Add group information - show basic info if available, detailed if requested
  if (group) {
    output += '=== GROUP INFORMATION ===\n';
    if (includeGroupDetail) {
      // Show full detailed information
      output += formatSingleGroupDetails(group);
    } else {
      // Show basic group information that's always available
      output += `Group: ${group.name || 'N/A'}\n`;
      output += `Display Name: ${group.displayName || 'N/A'}\n`;
      output += `Description: ${group.description || 'N/A'}\n`;
      output += `UUID: ${group.uuid || 'N/A'}\n`;
      output += `Type: ${group.typeOfGroup || 'N/A'}\n`;
      output += `Enabled: ${group.enabled || 'N/A'}\n`;
      if (group.idIndex) output += `ID Index: ${group.idIndex}\n`;
    }
    output += '\n';
  }
  
  // Add members information
  output += `=== MEMBERS (${members.length} total) ===\n`;
  
  if (members.length === 0) {
    output += 'No members found.';
    return output;
  }
  
  members.forEach((member: any, index: number) => {
    output += `\n${index + 1}. Subject ID: ${member.id || member.identifier || 'Unknown ID'}`;
    
    if (member.name) {
      output += ` (${member.name})`;
    }
    
    if (member.sourceId) {
      output += `\n   Source: ${member.sourceId}`;
    }
    
    if (member.memberId) {
      output += `\n   Member ID: ${member.memberId}`;
    }
    
    // Display subject attributes - we always request display_name, login_id, email_address
    if (member.attributeValues && member.attributeValues.length > 0) {
      // The attributeValues array corresponds to the requested subjectAttributeNames
      // Since we always request "display_name, login_id, email_address" first, we can map them
      const attrs = member.attributeValues;
      if (attrs.length >= 3) {
        if (attrs[0]) output += `\n   Display Name: ${attrs[0]}`;
        if (attrs[1]) output += `\n   Login ID: ${attrs[1]}`;
        if (attrs[2]) output += `\n   Email: ${attrs[2]}`;
        
        // Show any additional attributes if requested via includeSubjectDetail
        if (includeSubjectDetail && attrs.length > 3) {
          output += '\n   Additional Attributes:';
          for (let i = 3; i < attrs.length; i++) {
            if (attrs[i]) {
              output += `\n     - ${attrs[i]}`;
            }
          }
        }
      } else {
        // Fallback: show all attributes if we don't have the expected 3
        if (includeSubjectDetail) {
          output += '\n   Attributes:';
          attrs.forEach((attr: string) => {
            if (attr) {
              output += `\n     - ${attr}`;
            }
          });
        }
      }
    }
    
    // Always show result status if it's not SUCCESS or if there are issues
    if (member.resultCode) {
      if (member.resultCode !== 'SUCCESS' || member.success === 'F') {
        output += `\n   Status: ${member.resultCode}`;
        if (member.success === 'F') {
          output += ' (Failed)';
        }
      }
    }
  });

  return output;
}

// Stem (folder) formatting functions

export function formatSingleStemDetails(stem: GrouperStem): string {
  let detailText = `Stem: ${stem.name}\nDisplay Name: ${stem.displayName || 'N/A'}\nDescription: ${stem.description || 'N/A'}\nUUID: ${stem.uuid || 'N/A'}\nExtension: ${stem.extension || 'N/A'}\nDisplay Extension: ${stem.displayExtension || 'N/A'}\nID Index: ${stem.idIndex || 'N/A'}`;

  return detailText;
}

export function formatStemCollectionDetails(stem: GrouperStem): string {
  let detailText = `• ${stem.name}${stem.displayName ? ` (${stem.displayName})` : ''}`;
  if (stem.description) detailText += `\n  Description: ${stem.description}`;
  if (stem.uuid) detailText += `\n  UUID: ${stem.uuid}`;
  if (stem.extension) detailText += `\n  Extension: ${stem.extension}`;
  if (stem.idIndex) detailText += `\n  ID Index: ${stem.idIndex}`;

  return detailText;
}

export function formatSubjectMemberships(result: any): string {
  const memberships = result.wsMemberships || [];
  const groups = result.wsGroups || [];
  const subject = result.wsSubjects?.[0];

  let output = '';

  // Add subject information if available
  if (subject) {
    output += '=== SUBJECT INFORMATION ===\n';
    output += `Subject ID: ${subject.id || 'N/A'}\n`;
    if (subject.name) output += `Name: ${subject.name}\n`;
    if (subject.sourceId) output += `Source: ${subject.sourceId}\n`;
    output += '\n';
  }

  // Add membership count
  output += `=== GROUP MEMBERSHIPS (${memberships.length}) ===\n\n`;

  if (memberships.length === 0) {
    output += 'No group memberships found for this subject.\n';
    return output;
  }

  // Create a map of groups by ID for quick lookup
  const groupMap = new Map();
  groups.forEach((group: any) => {
    if (group.uuid) {
      groupMap.set(group.uuid, group);
    }
  });

  // Format each group membership
  memberships.forEach((membership: any, index: number) => {
    // Find the corresponding group
    const group = groupMap.get(membership.groupId);

    if (group) {
      output += `${index + 1}. ${formatGroupCollectionDetails(group)}\n`;

      // Add membership-specific information
      if (membership.membershipType) {
        output += `   Membership Type: ${membership.membershipType}\n`;
      }
      if (membership.enabled) {
        output += `   Enabled: ${membership.enabled}\n`;
      }

      output += '\n';
    } else {
      // Fallback if group details not found - show basic info from membership
      output += `${index + 1}. ${membership.groupName || 'Unknown Group'}\n`;
      if (membership.membershipType) {
        output += `   Membership Type: ${membership.membershipType}\n`;
      }
      if (membership.enabled) {
        output += `   Enabled: ${membership.enabled}\n`;
      }
      output += '\n';
    }
  });

  return output;
}

/**
 * Format batch member operation results (add/remove members)
 */
export function formatBatchMemberResults(
  result: BatchMemberResult,
  operation: 'added' | 'removed',
  groupName: string,
  inputMembers: GrouperMember[]
): string {
  const totalCount = inputMembers.length;
  let output = '';

  // Summary line
  if (totalCount === 1) {
    // Single member operation - use original format for backward compatibility
    if (result.successCount === 1) {
      const subjectId = inputMembers[0].subjectId;
      output = `Successfully ${operation} member "${subjectId}" ${operation === 'added' ? 'to' : 'from'} group "${groupName}"\n\n`;
    } else {
      const subjectId = inputMembers[0].subjectId;
      const errorMsg = result.results[0]?.resultMessage || 'Unknown error';
      output = `Failed to ${operation === 'added' ? 'add' : 'remove'} member "${subjectId}" ${operation === 'added' ? 'to' : 'from'} group "${groupName}": ${errorMsg}\n\n`;
    }
  } else {
    // Batch operation
    output = `${operation === 'added' ? 'Added' : 'Removed'} ${result.successCount} of ${totalCount} members ${operation === 'added' ? 'to' : 'from'} group "${groupName}"\n\n`;
  }

  // Group details
  if (result.group) {
    output += `Group Details:\n${formatSingleGroupDetails(result.group)}\n\n`;
  }

  // Member results - show individual results for batch operations or details for single
  if (totalCount > 1) {
    output += `Member Results:\n`;
    result.results.forEach((r, index) => {
      const status = r.success ? '+' : 'x';
      const subjectId = r.subject?.id || inputMembers[index]?.subjectId || 'Unknown';
      const displayName = r.subject?.name || '';
      output += `${status} ${subjectId}`;
      if (displayName) {
        output += ` - ${displayName}`;
      }
      if (!r.success && r.resultMessage) {
        output += ` (${r.resultMessage})`;
      }
      output += '\n';
    });
    output += '\n';
  }

  // Detailed subject information for successful operations
  const successfulResults = result.results.filter(r => r.success);
  if (successfulResults.length > 0) {
    if (totalCount === 1) {
      output += `${operation === 'added' ? 'Added' : 'Removed'} Member Details:\n`;
    } else if (successfulResults.length < result.results.length) {
      output += `Successfully ${operation === 'added' ? 'Added' : 'Removed'} Members:\n`;
    }

    successfulResults.forEach((r, index) => {
      const subject = r.subject;
      if (totalCount > 1) {
        output += `${index + 1}. `;
      }
      output += `- Subject ID: ${subject.id || 'N/A'}\n`;
      output += `- Display Name: ${subject.name || 'N/A'}\n`;
      output += `- Source: ${subject.sourceId || 'N/A'}\n`;

      // Map attribute values using the attribute names if available
      if (subject.attributeValues && result.subjectAttributeNames) {
        const attrNames = result.subjectAttributeNames;
        const attrValues = Object.values(subject.attributeValues);
        attrNames.forEach((attrName: string, i: number) => {
          const value = attrValues[i] || 'N/A';
          if (attrName !== 'name' && value !== 'N/A') {
            output += `- ${attrName}: ${value}\n`;
          }
        });
      }

      if (totalCount > 1 && index < successfulResults.length - 1) {
        output += '\n';
      }
    });
  }

  return output.trim();
}