import { GrouperGroup } from './types.js';

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