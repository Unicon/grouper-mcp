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
  displayName?: string;
  description?: string;
  extension?: string;
  displayExtension?: string;
  typeOfGroup?: string;
  idIndex?: string;
  enabled?: string;
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