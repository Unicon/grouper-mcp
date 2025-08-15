import { GrouperError, handleGrouperError, logError } from './error-handler.js';
export class GrouperClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async makeRequest(endpoint, method = 'GET', body) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const headers = {
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
            }
            catch {
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
    async findGroups(query) {
        try {
            const response = await this.makeRequest(`/groups?q=${encodeURIComponent(query)}`);
            return response.WsGroupsQueryResults?.groups || [];
        }
        catch (error) {
            const grouperError = handleGrouperError(error);
            logError(grouperError, 'findGroups');
            throw grouperError;
        }
    }
    async getGroup(groupName) {
        try {
            const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`);
            return response.WsGetGroupResult?.group || null;
        }
        catch (error) {
            return null;
        }
    }
    async createGroup(group) {
        const response = await this.makeRequest('/groups', 'POST', {
            WsRestGroupSaveRequest: {
                wsGroupToSaves: [group]
            }
        });
        return response.WsGroupSaveResults?.results[0]?.wsGroup;
    }
    async updateGroup(groupName, updates) {
        const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`, 'PUT', {
            WsRestGroupSaveRequest: {
                wsGroupToSaves: [{ name: groupName, ...updates }]
            }
        });
        return response.WsGroupSaveResults?.results[0]?.wsGroup;
    }
    async deleteGroup(groupName) {
        try {
            await this.makeRequest(`/groups/${encodeURIComponent(groupName)}`, 'DELETE');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async addMember(groupName, member) {
        try {
            await this.makeRequest('/groups/addMember', 'POST', {
                WsRestAddMemberRequest: {
                    wsGroupLookup: { groupName },
                    subjectLookups: [member]
                }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async deleteMember(groupName, member) {
        try {
            await this.makeRequest('/groups/deleteMember', 'POST', {
                WsRestDeleteMemberRequest: {
                    wsGroupLookup: { groupName },
                    subjectLookups: [member]
                }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getMembers(groupName) {
        const response = await this.makeRequest(`/groups/${encodeURIComponent(groupName)}/members`);
        return response.WsGetMembersResults?.results || [];
    }
    async assignAttribute(groupName, attribute) {
        try {
            await this.makeRequest('/attributeAssignments/assignAttributes', 'POST', {
                WsRestAssignAttributesRequest: {
                    wsOwnerGroupLookup: { groupName },
                    wsAttributeDefNameLookups: [{ name: attribute.nameOfAttributeDefName }],
                    values: [attribute.value]
                }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=grouper-client.js.map