import { GrouperConfig, GrouperGroup, GrouperMember, GrouperAttribute, GrouperSubject, GrouperSubjectLookup, GrouperSubjectSearchResult } from './types.js';
import { GrouperError, handleGrouperError, logError } from './error-handler.js';
import { logger } from './logger.js';

export class GrouperClient {
  private config: GrouperConfig;

  constructor(config: GrouperConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add basic authentication if credentials are provided
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    if (this.config.actAsSubjectId) {
      headers['X-Grouper-actAsSubjectId'] = this.config.actAsSubjectId;
    }
    if (this.config.actAsSubjectSourceId) {
      headers['X-Grouper-actAsSubjectSourceId'] = this.config.actAsSubjectSourceId;
    }
    if (this.config.actAsSubjectIdentifier) {
      headers['X-Grouper-actAsSubjectIdentifier'] = this.config.actAsSubjectIdentifier;
    }

    // Log the request
    logger.logRequest(method, url, headers, body);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get response body for logging
    const responseText = await response.text();
    let responseBody: any = null;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    // Log the response
    logger.logResponse(url, response.status, response.statusText, responseBody);

    if (!response.ok) {
      let errorMessage = `Grouper API error: ${response.status} ${response.statusText}`;
      
      if (typeof responseBody === 'object' && (responseBody.error || responseBody.message)) {
        errorMessage = responseBody.error || responseBody.message;
      } else if (typeof responseBody === 'string' && responseBody) {
        errorMessage = responseBody;
      }
      
      const error = new GrouperError(errorMessage, response.status);
      logError(error, 'API Request');
      throw error;
    }

    return responseBody;
  }

  async findGroups(query: string): Promise<GrouperGroup[]> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestFindGroupsRequest: {
          wsQueryFilter: {
            queryFilterType: 'FIND_BY_GROUP_NAME_APPROXIMATE',
            groupName: query
          }
        }
      });
      return response.WsFindGroupsResults?.groupResults || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findGroups');
      throw grouperError;
    }
  }

  async getGroup(groupName: string): Promise<GrouperGroup | null> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestFindGroupsRequest: {
          wsQueryFilter: {
            queryFilterType: 'FIND_BY_GROUP_NAME_EXACT',
            groupName: groupName
          }
        }
      });
      const results = response.WsFindGroupsResults?.groupResults || [];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      return null;
    }
  }

  async createGroup(group: GrouperGroup): Promise<GrouperGroup> {
    const response = await this.makeRequest('/groups', 'POST', {
      WsRestGroupSaveRequest: {
        wsGroupToSaves: [{
          wsGroupLookup: { groupName: group.name },
          wsGroup: group
        }]
      }
    });
    return response.WsGroupSaveResults?.results[0]?.wsGroup;
  }

  async updateGroup(groupName: string, updates: Partial<GrouperGroup>): Promise<GrouperGroup> {
    const response = await this.makeRequest('/groups', 'POST', {
      WsRestGroupSaveRequest: {
        wsGroupToSaves: [{
          wsGroupLookup: { groupName },
          wsGroup: { name: groupName, ...updates }
        }]
      }
    });
    return response.WsGroupSaveResults?.results[0]?.wsGroup;
  }

  async deleteGroup(groupName: string): Promise<boolean> {
    try {
      await this.makeRequest('/groups', 'POST', {
        WsRestGroupDeleteRequest: {
          wsGroupLookups: [{ groupName }]
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async addMember(groupName: string, member: GrouperMember): Promise<boolean> {
    try {
      await this.makeRequest('/groups', 'POST', {
        WsRestAddMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: [member]
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteMember(groupName: string, member: GrouperMember): Promise<boolean> {
    try {
      await this.makeRequest('/groups', 'POST', {
        WsRestDeleteMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: [member]
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getMembers(groupName: string): Promise<GrouperSubject[]> {
    const response = await this.makeRequest('/groups', 'POST', {
      WsRestGetMembersRequest: {
        wsGroupLookups: [{ groupName }]
      }
    });
    return response.WsGetMembersResults?.results?.[0]?.wsSubjects || [];
  }

  async assignAttribute(groupName: string, attribute: GrouperAttribute): Promise<boolean> {
    try {
      await this.makeRequest('/attributeAssignments/assignAttributes', 'POST', {
        WsRestAssignAttributesRequest: {
          wsOwnerGroupLookup: { groupName },
          wsAttributeDefNameLookups: [{ name: attribute.nameOfAttributeDefName }],
          values: [attribute.value]
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findSubjects(searchQuery: string, sourceId?: string): Promise<GrouperSubject[]> {
    try {
      const requestBody: any = {
        WsRestGetSubjectsRequest: {
          wsSubjectLookups: [{
            subjectIdentifier: searchQuery
          }]
        }
      };

      if (sourceId) {
        requestBody.WsRestGetSubjectsRequest.wsSubjectLookups[0].subjectSourceId = sourceId;
      }

      const response = await this.makeRequest('/subjects', 'POST', requestBody);
      return response.WsGetSubjectsResults?.wsSubjects || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findSubjects');
      throw grouperError;
    }
  }

  async getSubject(subjectLookup: GrouperSubjectLookup): Promise<GrouperSubject | null> {
    try {
      const response = await this.makeRequest('/subjects', 'POST', {
        WsRestGetSubjectsRequest: {
          wsSubjectLookups: [subjectLookup]
        }
      });
      const subjects = response.WsGetSubjectsResults?.wsSubjects || [];
      return subjects.length > 0 ? subjects[0] : null;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getSubject');
      return null;
    }
  }

  async getSubjectById(subjectId: string, sourceId?: string): Promise<GrouperSubject | null> {
    const lookup: GrouperSubjectLookup = { subjectId };
    if (sourceId) {
      lookup.subjectSourceId = sourceId;
    }
    return this.getSubject(lookup);
  }

  async getSubjectByIdentifier(identifier: string, sourceId?: string): Promise<GrouperSubject | null> {
    const lookup: GrouperSubjectLookup = { subjectIdentifier: identifier };
    if (sourceId) {
      lookup.subjectSourceId = sourceId;
    }
    return this.getSubject(lookup);
  }

  async searchSubjectsByText(searchText: string, sourceId?: string): Promise<GrouperSubject[]> {
    try {
      // Use multiple specific lookups to simulate text search
      const lookups = [
        { subjectIdentifier: searchText },
        { subjectId: searchText }
      ];

      if (sourceId) {
        lookups.forEach(lookup => (lookup as any).subjectSourceId = sourceId);
      }

      const requestBody = {
        WsRestGetSubjectsRequest: {
          wsSubjectLookups: lookups
        }
      };

      const response = await this.makeRequest('/subjects', 'POST', requestBody);
      const subjects = response.WsGetSubjectsResults?.wsSubjects || [];
      
      // Filter out null results and duplicates
      const validSubjects = subjects.filter((s: GrouperSubject) => s && (s.id || s.identifier));
      const uniqueSubjects = validSubjects.filter((subject: GrouperSubject, index: number, self: GrouperSubject[]) => 
        index === self.findIndex(s => (s.id === subject.id || s.identifier === subject.identifier))
      );
      
      return uniqueSubjects;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'searchSubjectsByText');
      throw grouperError;
    }
  }
}