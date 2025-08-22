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
}

export interface GrouperGroup {
  name: string;
  uuid?: string;
  displayName?: string;
  description?: string;
  extension?: string;
  displayExtension?: string;
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

export interface GrouperAttribute {
  nameOfAttributeDefName: string;
  value: string;
}

export interface GrouperPermission {
  permissionName: string;
  role: string;
  action: string;
}