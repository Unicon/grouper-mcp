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
      // Create error object with full context for handleGrouperError to parse
      const errorContext = {
        message: `Grouper API error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        url: url
      };
      
      const grouperError = handleGrouperError(errorContext);
      logError(grouperError, 'API Request');
      throw grouperError;
    }

    return responseBody;
  }


  async findGroupsByNameApproximate(query: string): Promise<GrouperGroup[]> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestFindGroupsRequest: {
          wsQueryFilter: {
            queryFilterType: 'FIND_BY_GROUP_NAME_APPROXIMATE',
            groupName: query
          },
          includeGroupDetail: "T"
        }
      });
      return response.WsFindGroupsResults?.groupResults || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findGroupsByNameApproximate', { query });
      throw grouperError;
    }
  }


  async findGroupByFilter(filter: { groupName?: string; groupUuid?: string }, queryFilterType: string): Promise<GrouperGroup | null> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestFindGroupsRequest: {
          wsQueryFilter: {
            queryFilterType,
            ...filter
          },
          includeGroupDetail: "T"
        }
      });
      const results = response.WsFindGroupsResults?.groupResults || [];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findGroupByFilter', { filter, queryFilterType });
      throw grouperError;
    }
  }

  async createGroup(group: GrouperGroup): Promise<GrouperGroup> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestGroupSaveRequest: {
          wsGroupToSaves: [{
            wsGroupLookup: { groupName: group.name },
            wsGroup: group
          }],
          includeGroupDetail: "T"
        }
      });
      return response.WsGroupSaveResults?.results[0]?.wsGroup;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'createGroup', { groupName: group.name, displayExtension: group.displayExtension });
      throw grouperError;
    }
  }

  async updateGroup(groupName: string, updates: Partial<GrouperGroup>): Promise<GrouperGroup> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestGroupSaveRequest: {
          wsGroupToSaves: [{
            wsGroupLookup: { groupName },
            wsGroup: { name: groupName, ...updates }
          }],
          includeGroupDetail: "T"
        }
      });
      return response.WsGroupSaveResults?.results[0]?.wsGroup;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'updateGroup', { groupName, updates });
      throw grouperError;
    }
  }

  async deleteGroupByFilter(filter: { groupName?: string; uuid?: string; idIndex?: string }): Promise<GrouperGroup | null> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestGroupDeleteRequest: {
          wsGroupLookups: [filter],
          includeGroupDetail: "T"
        }
      });
      const results = response.WsGroupDeleteResults?.results || [];
      
      if (results.length > 0) {
        const result = results[0];
        const resultCode = result.resultMetadata?.resultCode;
        
        // Check if group was not found
        if (resultCode === 'SUCCESS_GROUP_NOT_FOUND') {
          const filterDesc = filter.groupName || filter.uuid || filter.idIndex;
          throw new Error(`Group "${filterDesc}" not found`);
        }
        
        // Check for other non-success result codes
        if (result.resultMetadata?.success !== 'T') {
          const message = result.resultMetadata?.resultMessage || 'Unknown error';
          throw new Error(`Failed to delete group: ${message}`);
        }
        
        return result.wsGroup || null;
      }
      
      return null;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'deleteGroupByFilter', { filter });
      throw grouperError;
    }
  }

  async addMember(groupName: string, member: GrouperMember): Promise<{ success: boolean; group?: GrouperGroup; members?: any[]; subjectAttributeNames?: string[] }> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestAddMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: [member],
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
          subjectAttributeNames: ['display_name', 'login_id', 'email_address']
        }
      });

      const result = response?.WsAddMemberResults || response;
      
      const wsGroup = result?.wsGroupAssigned;
      const wsSubjects = result?.results?.map((r: any) => r.wsSubject) || [];
      const subjectAttributeNames = result?.subjectAttributeNames || [];

      return {
        success: true,
        group: wsGroup,
        members: wsSubjects,
        subjectAttributeNames
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'addMember', { groupName, member });
      return { success: false };
    }
  }

  async deleteMember(groupName: string, member: GrouperMember): Promise<{ success: boolean; group?: GrouperGroup; members?: any[]; subjectAttributeNames?: string[] }> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestDeleteMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: [member],
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
          subjectAttributeNames: ['display_name', 'login_id', 'email_address']
        }
      });

      const result = response?.WsDeleteMemberResults || response;
      
      const wsGroup = result?.wsGroupAssigned;
      const wsSubjects = result?.results?.map((r: any) => r.wsSubject) || [];
      const subjectAttributeNames = result?.subjectAttributeNames || [];

      return {
        success: true,
        group: wsGroup,
        members: wsSubjects,
        subjectAttributeNames
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'deleteMember', { groupName, member });
      return { success: false };
    }
  }

  async getMembers(
    groupName: string, 
    options?: {
      subjectAttributeNames?: string;
      memberFilter?: string;
    }
  ): Promise<any> {
    try {
      // Always request these common subject attributes, plus any additional ones specified
      let subjectAttributesList = ["display_name", "login_id", "email_address"];
      if (options?.subjectAttributeNames) {
        // Split the comma-separated string and add to our list
        const additionalAttrs = options.subjectAttributeNames.split(',').map(attr => attr.trim());
        subjectAttributesList = subjectAttributesList.concat(additionalAttrs);
      }

      const request: any = {
        WsRestGetMembersRequest: {
          wsGroupLookups: [{ groupName }],
          includeGroupDetail: "T",
          includeSubjectDetail: "T",
          subjectAttributeNames: subjectAttributesList
        }
      };
      
      if (options?.memberFilter) {
        request.WsRestGetMembersRequest.memberFilter = options.memberFilter;
      }

      const response = await this.makeRequest('/groups', 'POST', request);
      
      // Return the full result to allow detailed formatting in the handler
      return response.WsGetMembersResults?.results?.[0] || { wsSubjects: [] };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getMembers', { groupName, options });
      throw grouperError;
    }
  }

  async assignAttribute(groupName: string, attribute: GrouperAttribute): Promise<boolean> {
    try {
      const request: any = {
        WsRestAssignAttributesRequest: {
          attributeAssignType: 'group',
          wsAttributeDefNameLookups: [{ name: attribute.nameOfAttributeDefName }],
          wsOwnerGroupLookups: [{ groupName: groupName }],
          attributeAssignOperation: 'assign_attr'
        }
      };

      // Only include values if a value is provided
      if (attribute.value) {
        request.WsRestAssignAttributesRequest.values = [{ valueSystem: attribute.value }];
        request.WsRestAssignAttributesRequest.attributeAssignValueOperation = 'assign_value';
      }

      await this.makeRequest('/attributeAssignments', 'POST', request);
      return true;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'assignAttribute', { groupName, attributeName: attribute.nameOfAttributeDefName, value: attribute.value });
      throw grouperError;
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