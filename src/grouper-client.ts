import { GrouperConfig, GrouperGroup, GrouperMember, GrouperAttribute, GrouperSubject } from './types.js';
import { GrouperError, handleGrouperError, logError } from './error-handler.js';

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

    if (this.config.actAsSubjectId) {
      headers['X-Grouper-actAsSubjectId'] = this.config.actAsSubjectId;
    }
    if (this.config.actAsSubjectSourceId) {
      headers['X-Grouper-actAsSubjectSourceId'] = this.config.actAsSubjectSourceId;
    }
    if (this.config.actAsSubjectIdentifier) {
      headers['X-Grouper-actAsSubjectIdentifier'] = this.config.actAsSubjectIdentifier;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Grouper API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error || errorJson.message) {
          errorMessage = errorJson.error || errorJson.message;
        }
      } catch {
        // If not JSON, use the text as is
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      const error = new GrouperError(errorMessage, response.status);
      logError(error, 'API Request');
      throw error;
    }

    return response.json();
  }

  async findGroups(query: string): Promise<GrouperGroup[]> {
    try {
      const response = await this.makeRequest(`/groups?q=${encodeURIComponent(query)}`);
      return response.WsGroupsQueryResults?.groups || [];
    } catch (error) {
      const grouperError = handleGrouperError(error);
      logError(grouperError, 'findGroups');
      throw grouperError;
    }
  }

  async getGroup(groupName: string): Promise<GrouperGroup | null> {
    try {
      const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`);
      return response.WsGetGroupResult?.group || null;
    } catch (error) {
      return null;
    }
  }

  async createGroup(group: GrouperGroup): Promise<GrouperGroup> {
    const response = await this.makeRequest('/groups', 'POST', {
      WsRestGroupSaveRequest: {
        wsGroupToSaves: [group]
      }
    });
    return response.WsGroupSaveResults?.results[0]?.wsGroup;
  }

  async updateGroup(groupName: string, updates: Partial<GrouperGroup>): Promise<GrouperGroup> {
    const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`, 'PUT', {
      WsRestGroupSaveRequest: {
        wsGroupToSaves: [{ name: groupName, ...updates }]
      }
    });
    return response.WsGroupSaveResults?.results[0]?.wsGroup;
  }

  async deleteGroup(groupName: string): Promise<boolean> {
    try {
      await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`, 'DELETE');
      return true;
    } catch (error) {
      return false;
    }
  }

  async addMember(groupName: string, member: GrouperMember): Promise<boolean> {
    try {
      await this.makeRequest('/groups/addMember', 'POST', {
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
      await this.makeRequest('/groups/deleteMember', 'POST', {
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
    const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}/members`);
    return response.WsGetMembersResults?.results || [];
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
}