import { GrouperConfig, GrouperGroup, GrouperMember, GrouperAttribute, GrouperSubject, GrouperSubjectLookup, GrouperSubjectSearchResult, GrouperStem, BatchMemberResult, MemberOperationResult, BatchPrivilegeResult, PrivilegeOperationResult, GrouperPrivilegeResult } from './types.js';
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

  async addMembers(groupName: string, members: GrouperMember[]): Promise<BatchMemberResult> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestAddMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: members,
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
          subjectAttributeNames: ['display_name', 'login_id', 'email_address']
        }
      });

      const result = response?.WsAddMemberResults || response;

      const wsGroup = result?.wsGroupAssigned;
      const subjectAttributeNames = result?.subjectAttributeNames || [];

      // Parse individual results
      const operationResults: MemberOperationResult[] = (result?.results || []).map((r: any) => {
        const isSuccess = r.resultMetadata?.success === 'T';
        return {
          subject: r.wsSubject || {},
          success: isSuccess,
          resultCode: r.resultMetadata?.resultCode,
          resultMessage: r.resultMetadata?.resultMessage
        };
      });

      const successCount = operationResults.filter(r => r.success).length;
      const failureCount = operationResults.length - successCount;

      return {
        success: failureCount === 0,
        group: wsGroup,
        results: operationResults,
        subjectAttributeNames,
        successCount,
        failureCount
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'addMembers', { groupName, memberCount: members.length });
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: members.length
      };
    }
  }

  async deleteMembers(groupName: string, members: GrouperMember[]): Promise<BatchMemberResult> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        WsRestDeleteMemberRequest: {
          wsGroupLookup: { groupName },
          subjectLookups: members,
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
          subjectAttributeNames: ['display_name', 'login_id', 'email_address']
        }
      });

      const result = response?.WsDeleteMemberResults || response;

      // Note: Delete response uses 'wsGroup' instead of 'wsGroupAssigned'
      const wsGroup = result?.wsGroup;
      const subjectAttributeNames = result?.subjectAttributeNames || [];

      // Parse individual results
      const operationResults: MemberOperationResult[] = (result?.results || []).map((r: any) => {
        const isSuccess = r.resultMetadata?.success === 'T';
        return {
          subject: r.wsSubject || {},
          success: isSuccess,
          resultCode: r.resultMetadata?.resultCode,
          resultMessage: r.resultMetadata?.resultMessage
        };
      });

      const successCount = operationResults.filter(r => r.success).length;
      const failureCount = operationResults.length - successCount;

      return {
        success: failureCount === 0,
        group: wsGroup,
        results: operationResults,
        subjectAttributeNames,
        successCount,
        failureCount
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'deleteMembers', { groupName, memberCount: members.length });
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: members.length
      };
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

  async getSubjects(params: {
    subjectId?: string;
    subjectIdentifier?: string;
    searchString?: string;
    subjectSourceId?: string;
  }): Promise<GrouperSubject[]> {
    try {
      const requestBody: any = {
        WsRestGetSubjectsRequest: {
          includeSubjectDetail: 'T'
        }
      };

      // Handle search string approach (different API structure)
      if (params.searchString) {
        requestBody.WsRestGetSubjectsRequest.searchString = params.searchString;

        if (params.subjectSourceId) {
          requestBody.WsRestGetSubjectsRequest.sourceIds = params.subjectSourceId;
        }
      } else {
        // Handle lookup-based approach (by ID or identifier)
        const lookup: any = {};

        if (params.subjectId) {
          lookup.subjectId = params.subjectId;
        }

        if (params.subjectIdentifier) {
          lookup.subjectIdentifier = params.subjectIdentifier;
        }

        if (params.subjectSourceId) {
          lookup.subjectSourceId = params.subjectSourceId;
        }

        requestBody.WsRestGetSubjectsRequest.wsSubjectLookups = [lookup];
      }

      const response = await this.makeRequest('/subjects', 'POST', requestBody);
      const subjects = response.WsGetSubjectsResults?.wsSubjects || [];

      // Filter out failed results
      return subjects.filter((s: GrouperSubject) =>
        s && s.success === 'T' && s.resultCode !== 'SUBJECT_NOT_FOUND'
      );
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getSubjects');
      throw grouperError;
    }
  }

  // Stem (folder) operations

  async findStemsByNameApproximate(query: string): Promise<GrouperStem[]> {
    try {
      const response = await this.makeRequest('/stems', 'POST', {
        WsRestFindStemsRequest: {
          wsStemQueryFilter: {
            stemQueryFilterType: 'FIND_BY_STEM_NAME_APPROXIMATE',
            stemName: query
          }
        }
      });
      return response.WsFindStemsResults?.stemResults || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findStemsByNameApproximate', { query });
      throw grouperError;
    }
  }

  async findStemByFilter(filter: { stemName?: string; stemUuid?: string }, queryFilterType: string): Promise<GrouperStem | null> {
    try {
      const response = await this.makeRequest('/stems', 'POST', {
        WsRestFindStemsRequest: {
          wsStemQueryFilter: {
            stemQueryFilterType: queryFilterType,
            ...filter
          }
        }
      });
      const results = response.WsFindStemsResults?.stemResults || [];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findStemByFilter', { filter, queryFilterType });
      throw grouperError;
    }
  }

  async getSubjectMemberships(
    subjectId: string,
    options?: {
      subjectSourceId?: string;
      subjectIdentifier?: string;
      memberFilter?: string;
      enabled?: string;
    }
  ): Promise<any> {
    try {
      const wsSubjectLookup: any = {
        subjectId: subjectId,
      };

      if (options?.subjectSourceId) {
        wsSubjectLookup.subjectSourceId = options.subjectSourceId;
      }

      if (options?.subjectIdentifier) {
        wsSubjectLookup.subjectIdentifier = options.subjectIdentifier;
      }

      const requestBody: any = {
        WsRestGetMembershipsRequest: {
          wsSubjectLookups: [wsSubjectLookup],
          includeGroupDetail: "T",
          includeSubjectDetail: "T",
        }
      };

      if (options?.memberFilter) {
        requestBody.WsRestGetMembershipsRequest.memberFilter = options.memberFilter;
      }

      if (options?.enabled) {
        requestBody.WsRestGetMembershipsRequest.enabled = options.enabled;
      }

      const response = await this.makeRequest('/memberships', 'POST', requestBody);

      return response.WsGetMembershipsResults || {};
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getSubjectMemberships', { subjectId, options });
      throw grouperError;
    }
  }

  /**
   * Check if a subject is a member of a group and get membership details
   */
  async getMembershipDetails(
    subjectId: string,
    groupName: string,
    options?: {
      subjectSourceId?: string;
      membershipFilter?: string;
    }
  ): Promise<any> {
    try {
      const wsSubjectLookup: any = {
        subjectId: subjectId,
      };

      if (options?.subjectSourceId) {
        wsSubjectLookup.subjectSourceId = options.subjectSourceId;
      }

      const requestBody: any = {
        WsRestGetMembershipsRequest: {
          wsSubjectLookups: [wsSubjectLookup],
          wsGroupLookups: [{ groupName: groupName }],
          wsMembershipFilter: options?.membershipFilter || 'All',
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
        }
      };

      const response = await this.makeRequest('/memberships', 'POST', requestBody);

      return response.WsGetMembershipsResults || {};
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getMembershipDetails', { subjectId, groupName, options });
      throw grouperError;
    }
  }

  /**
   * Get all groups that a subject is a direct member of
   */
  async getSubjectDirectMemberships(
    subjectId: string,
    options?: {
      subjectSourceId?: string;
    }
  ): Promise<any> {
    try {
      const wsSubjectLookup: any = {
        subjectId: subjectId,
      };

      if (options?.subjectSourceId) {
        wsSubjectLookup.subjectSourceId = options.subjectSourceId;
      }

      const requestBody: any = {
        WsRestGetMembershipsRequest: {
          wsSubjectLookups: [wsSubjectLookup],
          wsMembershipFilter: 'Immediate',
          includeGroupDetail: 'T',
        }
      };

      const response = await this.makeRequest('/memberships', 'POST', requestBody);

      return response.WsGetMembershipsResults || {};
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getSubjectDirectMemberships', { subjectId, options });
      throw grouperError;
    }
  }

  /**
   * Get direct members of a group (both subjects and groups)
   */
  async getGroupDirectMembers(groupName: string): Promise<any> {
    try {
      const requestBody = {
        WsRestGetMembersRequest: {
          wsGroupLookups: [{ groupName }],
          memberFilter: 'Immediate',
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T',
        }
      };

      const response = await this.makeRequest('/groups', 'POST', requestBody);

      return response.WsGetMembersResults || {};
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getGroupDirectMembers', { groupName });
      throw grouperError;
    }
  }

  /**
   * Assign or revoke privileges on a group for one or more subjects
   */
  async assignGroupPrivileges(
    groupName: string,
    subjects: GrouperSubjectLookup[],
    privilegeNames: string[],
    allowed: boolean = true
  ): Promise<BatchPrivilegeResult> {
    try {
      const response = await this.makeRequest('/grouperPrivileges', 'POST', {
        WsRestAssignGrouperPrivilegesRequest: {
          wsGroupLookup: { groupName },
          wsSubjectLookups: subjects,
          privilegeType: 'access',
          privilegeNames: privilegeNames,
          allowed: allowed ? 'T' : 'F',
          includeGroupDetail: 'T',
          includeSubjectDetail: 'T'
        }
      });

      const result = response?.WsAssignGrouperPrivilegesResults || response;
      const wsGroup = result?.wsGroup;

      // Parse individual results
      const operationResults: PrivilegeOperationResult[] = (result?.results || []).map((r: any) => {
        const isSuccess = r.resultMetadata?.success === 'T';
        return {
          subject: r.wsSubject || {},
          privilegeName: r.privilegeName || '',
          privilegeType: r.privilegeType || 'access',
          allowed: r.allowed || (allowed ? 'T' : 'F'),
          success: isSuccess,
          resultCode: r.resultMetadata?.resultCode,
          resultMessage: r.resultMetadata?.resultMessage
        };
      });

      const successCount = operationResults.filter(r => r.success).length;
      const failureCount = operationResults.length - successCount;

      return {
        success: failureCount === 0,
        group: wsGroup,
        results: operationResults,
        successCount,
        failureCount
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'assignGroupPrivileges', { groupName, subjectCount: subjects.length, privilegeNames });
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: subjects.length * privilegeNames.length
      };
    }
  }

  /**
   * Assign or revoke privileges on a stem for one or more subjects
   */
  async assignStemPrivileges(
    stemName: string,
    subjects: GrouperSubjectLookup[],
    privilegeNames: string[],
    allowed: boolean = true
  ): Promise<BatchPrivilegeResult> {
    try {
      const response = await this.makeRequest('/grouperPrivileges', 'POST', {
        WsRestAssignGrouperPrivilegesRequest: {
          wsStemLookup: { stemName },
          wsSubjectLookups: subjects,
          privilegeType: 'naming',
          privilegeNames: privilegeNames,
          allowed: allowed ? 'T' : 'F',
          includeStemDetail: 'T',
          includeSubjectDetail: 'T'
        }
      });

      const result = response?.WsAssignGrouperPrivilegesResults || response;
      const wsStem = result?.wsStem;

      // Parse individual results
      const operationResults: PrivilegeOperationResult[] = (result?.results || []).map((r: any) => {
        const isSuccess = r.resultMetadata?.success === 'T';
        return {
          subject: r.wsSubject || {},
          privilegeName: r.privilegeName || '',
          privilegeType: r.privilegeType || 'naming',
          allowed: r.allowed || (allowed ? 'T' : 'F'),
          success: isSuccess,
          resultCode: r.resultMetadata?.resultCode,
          resultMessage: r.resultMetadata?.resultMessage
        };
      });

      const successCount = operationResults.filter(r => r.success).length;
      const failureCount = operationResults.length - successCount;

      return {
        success: failureCount === 0,
        stem: wsStem,
        results: operationResults,
        successCount,
        failureCount
      };
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'assignStemPrivileges', { stemName, subjectCount: subjects.length, privilegeNames });
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: subjects.length * privilegeNames.length
      };
    }
  }

  /**
   * Get privileges on a group, optionally filtered by subject
   */
  async getGroupPrivileges(
    groupName: string,
    options?: {
      subjectId?: string;
      subjectSourceId?: string;
      subjectIdentifier?: string;
      privilegeName?: string;
    }
  ): Promise<GrouperPrivilegeResult[]> {
    try {
      const params: any = {
        groupName,
        privilegeType: 'access',
        includeGroupDetail: 'T',
        includeSubjectDetail: 'T'
      };

      if (options?.subjectId) params.subjectId = options.subjectId;
      if (options?.subjectSourceId) params.subjectSourceId = options.subjectSourceId;
      if (options?.subjectIdentifier) params.subjectIdentifier = options.subjectIdentifier;
      if (options?.privilegeName) params.privilegeName = options.privilegeName;

      // Build query string for lite endpoint
      const queryString = new URLSearchParams(params).toString();

      const response = await this.makeRequest(
        `/grouperPrivileges?${queryString}`,
        'POST'
      );

      const result = response?.WsGetGrouperPrivilegesLiteResult || response;
      return result?.privilegeResults || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getGroupPrivileges', { groupName, options });
      throw grouperError;
    }
  }

  /**
   * Get privileges on a stem, optionally filtered by subject
   */
  async getStemPrivileges(
    stemName: string,
    options?: {
      subjectId?: string;
      subjectSourceId?: string;
      subjectIdentifier?: string;
      privilegeName?: string;
    }
  ): Promise<GrouperPrivilegeResult[]> {
    try {
      const params: any = {
        stemName,
        privilegeType: 'naming',
        includeStemDetail: 'T',
        includeSubjectDetail: 'T'
      };

      if (options?.subjectId) params.subjectId = options.subjectId;
      if (options?.subjectSourceId) params.subjectSourceId = options.subjectSourceId;
      if (options?.subjectIdentifier) params.subjectIdentifier = options.subjectIdentifier;
      if (options?.privilegeName) params.privilegeName = options.privilegeName;

      // Build query string for lite endpoint
      const queryString = new URLSearchParams(params).toString();

      const response = await this.makeRequest(
        `/grouperPrivileges?${queryString}`,
        'POST'
      );

      const result = response?.WsGetGrouperPrivilegesLiteResult || response;
      return result?.privilegeResults || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'getStemPrivileges', { stemName, options });
      throw grouperError;
    }
  }
}