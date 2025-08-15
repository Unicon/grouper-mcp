import { GrouperConfig, GrouperGroup, GrouperMember, GrouperAttribute, GrouperSubject } from './types.js';
export declare class GrouperClient {
    private config;
    constructor(config: GrouperConfig);
    private makeRequest;
    findGroups(query: string): Promise<GrouperGroup[]>;
    getGroup(groupName: string): Promise<GrouperGroup | null>;
    createGroup(group: GrouperGroup): Promise<GrouperGroup>;
    updateGroup(groupName: string, updates: Partial<GrouperGroup>): Promise<GrouperGroup>;
    deleteGroup(groupName: string): Promise<boolean>;
    addMember(groupName: string, member: GrouperMember): Promise<boolean>;
    deleteMember(groupName: string, member: GrouperMember): Promise<boolean>;
    getMembers(groupName: string): Promise<GrouperSubject[]>;
    assignAttribute(groupName: string, attribute: GrouperAttribute): Promise<boolean>;
}
//# sourceMappingURL=grouper-client.d.ts.map