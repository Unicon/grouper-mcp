export interface GrouperConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  actAsSubjectId?: string;
  actAsSubjectSourceId?: string;
  actAsSubjectIdentifier?: string;
}

export interface GrouperSubject {
  id?: string;
  sourceId?: string;
  identifier?: string;
  name?: string;
  description?: string;
  attributeValues?: Record<string, string>;
  success?: string;
  resultCode?: string;
}

export interface GrouperSubjectLookup {
  subjectId?: string;
  subjectSourceId?: string;
  subjectIdentifier?: string;
}

export interface GrouperSubjectSearchResult {
  wsSubjects?: GrouperSubject[];
  resultMetadata?: {
    resultCode?: string;
    resultMessage?: string;
    success?: string;
  };
}

export interface GrouperGroup {
  name: string;
  uuid?: string;
  displayName?: string; // Read-only: full path returned by API, not used for saves
  description?: string;
  extension?: string;
  displayExtension?: string; // Used for saves: human-readable name for the rightmost part after last colon
  typeOfGroup?: string;
  idIndex?: string;
  enabled?: string;
  alternateName?: string;
  enabledTime?: string;
  disabledTime?: string;
  detail?: {
    hasComposite?: string;
    leftGroup?: string;
    rightGroup?: string;
    typeNames?: string[];
    attributeNames?: string[];
    attributeValues?: string[];
    compositeType?: string;
    params?: Array<{
      paramName: string;
      paramValue: string;
    }>;
    createSubjectId?: string;
    createTime?: string;
    isCompositeFactor?: string;
    modifySource?: string;
    modifySubjectId?: string;
    modifyTime?: string;
  };
}

export interface GrouperMember {
  subjectId: string;
  subjectSourceId?: string;
  subjectIdentifier?: string;
}

export interface MemberOperationResult {
  subject: GrouperSubject;
  success: boolean;
  resultCode?: string;
  resultMessage?: string;
}

export interface BatchMemberResult {
  success: boolean;
  group?: GrouperGroup;
  results: MemberOperationResult[];
  subjectAttributeNames?: string[];
  successCount: number;
  failureCount: number;
}

export interface GrouperAttribute {
  nameOfAttributeDefName: string;
  value?: string;
}

export interface GrouperPermission {
  permissionName: string;
  role: string;
  action: string;
}

export interface GrouperStem {
  name: string;
  uuid?: string;
  displayName?: string;
  description?: string;
  extension?: string;
  displayExtension?: string;
  idIndex?: string;
}

export interface MembershipTraceNode {
  type: 'immediate' | 'effective' | 'composite' | 'cycle_detected' | 'max_depth_reached';
  groupName: string;
  groupDisplayName?: string;
  groupDescription?: string;
  membershipType?: string;
  compositeType?: string;
  compositeLeftGroup?: string;
  compositeRightGroup?: string;
  intermediateGroups?: MembershipTraceNode[];
  depth: number;
}

export interface MembershipTraceResult {
  subjectId: string;
  subjectName?: string;
  targetGroupName: string;
  targetGroupDisplayName?: string;
  isMember: boolean;
  paths: MembershipTraceNode[];
  cycles?: string[];
  maxDepthReached?: boolean;
}

export interface GrouperPrivilegeResult {
  wsSubject?: GrouperSubject;
  wsGroup?: GrouperGroup;
  wsStem?: GrouperStem;
  privilegeName: string;
  privilegeType: string;  // "access" or "naming"
  allowed: string;        // "T" or "F"
  revokable?: string;     // "T" or "F"
  ownerSubject?: GrouperSubject;
}

export interface PrivilegeOperationResult {
  subject: GrouperSubject;
  privilegeName: string;
  privilegeType: string;
  allowed: string;
  success: boolean;
  resultCode?: string;
  resultMessage?: string;
}

export interface BatchPrivilegeResult {
  success: boolean;
  group?: GrouperGroup;
  stem?: GrouperStem;
  results: PrivilegeOperationResult[];
  successCount: number;
  failureCount: number;
}