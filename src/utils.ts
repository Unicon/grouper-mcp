import { GrouperGroup } from './types.js';
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