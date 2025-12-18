import { GrouperClient } from './grouper-client.js';
import { MembershipTraceNode, MembershipTraceResult } from './types.js';
import { logger } from './logger.js';

const DEFAULT_MAX_DEPTH = 10;
const ABSOLUTE_MAX_DEPTH = 20;

export class MembershipTracer {
  private client: GrouperClient;
  private visitedGroups: Set<string>;
  private maxDepth: number;

  constructor(client: GrouperClient, maxDepth?: number) {
    this.client = client;
    this.visitedGroups = new Set();
    this.maxDepth = Math.min(maxDepth || DEFAULT_MAX_DEPTH, ABSOLUTE_MAX_DEPTH);
  }

  /**
   * Trace membership from subject to target group
   */
  async trace(
    subjectId: string,
    targetGroupName: string,
    options?: {
      subjectSourceId?: string;
    }
  ): Promise<MembershipTraceResult> {
    logger.debug('Starting membership trace', { subjectId, targetGroupName });

    // Reset visited groups for each trace
    this.visitedGroups.clear();

    // Check if subject is member of target group
    const membershipDetails = await this.client.getMembershipDetails(
      subjectId,
      targetGroupName,
      options
    );

    const memberships = membershipDetails.wsMemberships || [];
    const subject = membershipDetails.wsSubjects?.[0];
    const group = membershipDetails.wsGroups?.[0];

    if (memberships.length === 0) {
      // Not a member
      return {
        subjectId,
        subjectName: subject?.name,
        targetGroupName,
        targetGroupDisplayName: group?.displayName,
        isMember: false,
        paths: [],
      };
    }

    // Subject is a member - trace the path(s)
    const membership = memberships[0];
    const groups = membershipDetails.wsGroups || [];
    const paths = await this.traceMembershipRecursive(
      subjectId,
      targetGroupName,
      membership,
      groups,
      0,
      options
    );

    // Extract actual cycles detected during traversal (nodes with type 'cycle_detected')
    const detectedCycles = this.extractCyclesFromPaths(paths);

    return {
      subjectId,
      subjectName: subject?.name,
      targetGroupName,
      targetGroupDisplayName: group?.displayName,
      isMember: true,
      paths,
      cycles: detectedCycles.length > 0 ? detectedCycles : undefined,
    };
  }

  /**
   * Recursively trace membership path
   */
  private async traceMembershipRecursive(
    subjectId: string,
    groupName: string,
    membership: any,
    groups: any[],
    depth: number,
    options?: {
      subjectSourceId?: string;
    }
  ): Promise<MembershipTraceNode[]> {
    // Look up the group details from the groups array by matching groupId to uuid
    const group = groups.find((g: any) => g.uuid === membership.groupId);

    // Check depth limit
    if (depth >= this.maxDepth) {
      logger.info('Max depth reached during trace', { groupName, depth });
      return [{
        type: 'max_depth_reached',
        groupName,
        groupDisplayName: group?.displayName,
        depth,
      }];
    }

    // Check for cycles
    if (this.visitedGroups.has(groupName)) {
      logger.info('Cycle detected during trace', { groupName, depth });
      return [{
        type: 'cycle_detected',
        groupName,
        groupDisplayName: group?.displayName,
        depth,
      }];
    }

    this.visitedGroups.add(groupName);

    const membershipType = membership.membershipType?.toLowerCase();

    // Handle immediate (direct) membership
    if (membershipType === 'immediate') {
      return [{
        type: 'immediate',
        groupName,
        groupDisplayName: group?.displayName,
        groupDescription: group?.description,
        membershipType: 'immediate',
        depth,
      }];
    }

    // Handle composite membership
    if (membershipType === 'composite' && group?.detail?.hasComposite === 'T') {
      const detail = group.detail;
      const compositeType = detail.compositeType?.toUpperCase();
      // leftGroup and rightGroup are objects from the API, extract their names
      const leftGroupName = detail.leftGroup?.name;
      const rightGroupName = detail.rightGroup?.name;

      logger.debug('Processing composite membership', {
        compositeType,
        leftGroupName,
        rightGroupName,
      });

      const node: MembershipTraceNode = {
        type: 'composite',
        groupName,
        groupDisplayName: group?.displayName,
        groupDescription: group?.description,
        membershipType: 'composite',
        compositeType,
        compositeLeftGroup: leftGroupName,
        compositeRightGroup: rightGroupName,
        intermediateGroups: [],
        depth,
      };

      // Trace through composite branches
      if (compositeType === 'INTERSECTION' && leftGroupName && rightGroupName) {
        // Must be in both left and right
        const [leftPaths, rightPaths] = await Promise.all([
          this.traceToGroup(subjectId, leftGroupName, depth + 1, options),
          this.traceToGroup(subjectId, rightGroupName, depth + 1, options),
        ]);
        node.intermediateGroups = [...leftPaths, ...rightPaths];
      } else if (compositeType === 'UNION' && leftGroupName) {
        // Can be in left or right (trace left first)
        const leftPaths = await this.traceToGroup(subjectId, leftGroupName, depth + 1, options);
        if (leftPaths.length > 0) {
          node.intermediateGroups = leftPaths;
        } else if (rightGroupName) {
          const rightPaths = await this.traceToGroup(subjectId, rightGroupName, depth + 1, options);
          node.intermediateGroups = rightPaths;
        }
      } else if (compositeType === 'COMPLEMENT' && leftGroupName) {
        // In left but not in right
        const leftPaths = await this.traceToGroup(subjectId, leftGroupName, depth + 1, options);
        node.intermediateGroups = leftPaths;
      }

      return [node];
    }

    // Handle effective membership (through intermediate groups)
    if (membershipType === 'effective') {
      logger.debug('Processing effective membership', { groupName });

      // Get all groups the subject is directly a member of
      const subjectMemberships = await this.client.getSubjectDirectMemberships(
        subjectId,
        options
      );

      // Get all direct members of the target group
      const groupMembers = await this.client.getGroupDirectMembers(groupName);

      // Find intermediate groups (intersection)
      // We need to build a map of UUID -> name for subject's group memberships
      // Include immediate, effective, AND composite memberships - all need to be
      // traced recursively to find the deeper path (e.g., A → B → C → target requires
      // finding B even though subject only has effective/composite membership in B)
      // Note: The membership object has groupId and groupName directly (not nested in wsGroup)
      const subjectGroupUUIDs = new Map<string, string>();
      (subjectMemberships.wsMemberships || [])
        .filter((m: any) => {
          const type = m.membershipType?.toLowerCase();
          // Include immediate, effective, and composite memberships
          // Exclude the target group to avoid self-recursion
          return (type === 'immediate' || type === 'effective' || type === 'composite') && m.groupName !== groupName;
        })
        .forEach((m: any) => {
          const uuid = m.groupId;
          const name = m.groupName;
          if (uuid && name) {
            subjectGroupUUIDs.set(uuid, name);
          }
        });

      // Extract members from the response structure
      const targetGroupMembers = groupMembers.results?.[0]?.wsSubjects || [];
      const intermediateGroupNames = targetGroupMembers
        .filter((s: any) => s.sourceId === 'g:gsa') // Group members only
        .map((s: any) => s.id) // This is the UUID for groups
        .filter((uuid: string) => subjectGroupUUIDs.has(uuid))
        .map((uuid: string) => subjectGroupUUIDs.get(uuid))
        .filter(Boolean) as string[];

      if (intermediateGroupNames.length === 0) {
        logger.info('No intermediate groups found for effective membership', {
          groupName,
          subjectId,
        });
        return [{
          type: 'effective',
          groupName,
          groupDisplayName: group?.displayName,
          membershipType: 'effective',
          intermediateGroups: [],
          depth,
        }];
      }

      // Recursively trace through each intermediate group
      const intermediateTraces = await Promise.all(
        intermediateGroupNames.map((intGroupName: string) =>
          this.traceToGroup(subjectId, intGroupName, depth + 1, options)
        )
      );

      return [{
        type: 'effective',
        groupName,
        groupDisplayName: group?.displayName,
        groupDescription: group?.description,
        membershipType: 'effective',
        intermediateGroups: intermediateTraces.flat(),
        depth,
      }];
    }

    // Unknown membership type
    logger.info('Unknown membership type', { membershipType, groupName });
    return [{
      type: membershipType as any,
      groupName,
      groupDisplayName: group?.displayName,
      membershipType,
      depth,
    }];
  }

  /**
   * Helper to trace to a specific group
   */
  private async traceToGroup(
    subjectId: string,
    groupName: string,
    depth: number,
    options?: {
      subjectSourceId?: string;
    }
  ): Promise<MembershipTraceNode[]> {
    try {
      const membershipDetails = await this.client.getMembershipDetails(
        subjectId,
        groupName,
        options
      );

      const memberships = membershipDetails.wsMemberships || [];
      if (memberships.length === 0) {
        return [];
      }

      const groups = membershipDetails.wsGroups || [];

      return await this.traceMembershipRecursive(
        subjectId,
        groupName,
        memberships[0],
        groups,
        depth,
        options
      );
    } catch (error) {
      logger.error('Error tracing to group', { groupName, error });
      return [];
    }
  }

  /**
   * Extract group names from cycle_detected nodes in the paths
   */
  private extractCyclesFromPaths(paths: MembershipTraceNode[]): string[] {
    const cycles: string[] = [];

    const collectCycles = (nodes: MembershipTraceNode[]) => {
      for (const node of nodes) {
        if (node.type === 'cycle_detected' && node.groupName) {
          cycles.push(node.groupName);
        }
        if (node.intermediateGroups) {
          collectCycles(node.intermediateGroups);
        }
      }
    };

    collectCycles(paths);
    return cycles;
  }
}
