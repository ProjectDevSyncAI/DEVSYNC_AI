export type MemberRole =
  | "owner"
  | "admin"
  | "manager"
  | "developer"
  | "designer"
  | "viewer";

export type MemberStatus = "active" | "invited" | "suspended";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
  status: MemberStatus;
  organizationId: string;
  joinedAt?: string;
  lastActiveAt?: string;
}

export interface MemberInvitation {
  id: string;
  email: string;
  role: MemberRole;
  organizationId: string;
  invitedBy: string;
  expiresAt: string;
}

<<<<<<< HEAD
export type CanonicalOrgRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ENGINEER"
  | "VIEWER";

export const CANONICAL_ORG_ROLES: CanonicalOrgRole[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "ENGINEER",
  "VIEWER",
];

export function canManageMembers(role: MemberRole | string): boolean {
  const norm = role?.toLowerCase();
  return norm === "owner" || norm === "admin";
}

export function canEditProject(role: MemberRole | string): boolean {
  const norm = role?.toLowerCase();
  return ["owner", "admin", "manager", "developer", "engineer"].includes(norm);
}

/**
 * Determine if current user can modify target member's role.
 * Rules:
 * - Cannot change own role.
 * - Cannot demote canonical owner.
 * - OWNER can modify anyone (except canonical owner) to ADMIN, MANAGER, ENGINEER, VIEWER.
 * - ADMIN can only modify MANAGER, ENGINEER, VIEWER to MANAGER, ENGINEER, VIEWER.
 * - Other roles cannot modify roles.
 */
export function canModifyRole(
  currentUserRole: string | undefined,
  targetCurrentRole: string,
  targetIsCanonicalOwner: boolean,
  isSelf: boolean,
): boolean {
  if (isSelf) return false;
  if (targetIsCanonicalOwner) return false;

  const cur = currentUserRole?.toUpperCase();
  const tgt = targetCurrentRole?.toUpperCase();

  if (cur === "OWNER") {
    return true;
  }

  if (cur === "ADMIN") {
    return ["MANAGER", "ENGINEER", "VIEWER"].includes(tgt);
  }

  return false;
}

/**
 * Get available roles that current user can assign.
 */
export function getAllowedAssignableRoles(
  currentUserRole: string | undefined,
): CanonicalOrgRole[] {
  const cur = currentUserRole?.toUpperCase();
  if (cur === "OWNER") {
    // OWNER can assign ADMIN, MANAGER, ENGINEER, VIEWER (never OWNER via ordinary update)
    return ["ADMIN", "MANAGER", "ENGINEER", "VIEWER"];
  }
  if (cur === "ADMIN") {
    // ADMIN can only assign MANAGER, ENGINEER, VIEWER (cannot assign OWNER or ADMIN)
    return ["MANAGER", "ENGINEER", "VIEWER"];
  }
  return [];
}

/**
 * Determine if current user can remove target member.
 * Rules:
 * - Cannot remove canonical owner.
 * - Cannot remove self (must use self-leave).
 * - OWNER can remove non-canonical members (subject to last-owner check on backend).
 * - ADMIN can only remove MANAGER, ENGINEER, VIEWER (cannot remove OWNER or ADMIN).
 * - Other roles cannot remove members.
 */
export function canRemoveMember(
  currentUserRole: string | undefined,
  targetRole: string,
  targetIsCanonicalOwner: boolean,
  isSelf: boolean,
): boolean {
  if (isSelf) return false;
  if (targetIsCanonicalOwner) return false;

  const cur = currentUserRole?.toUpperCase();
  const tgt = targetRole?.toUpperCase();

  if (cur === "OWNER") {
    return true;
  }

  if (cur === "ADMIN") {
    return ["MANAGER", "ENGINEER", "VIEWER"].includes(tgt);
  }

  return false;
}

/**
 * Determine if current user can invite new members.
 */
export function canInviteMembers(currentUserRole: string | undefined): boolean {
  const cur = currentUserRole?.toUpperCase();
  return cur === "OWNER" || cur === "ADMIN";
}

/**
 * Get roles that current user is permitted to invite.
 */
export function getAllowedInviteRoles(
  currentUserRole: string | undefined,
): CanonicalOrgRole[] {
  const cur = currentUserRole?.toUpperCase();
  if (cur === "OWNER") {
    return ["ADMIN", "MANAGER", "ENGINEER", "VIEWER"];
  }
  if (cur === "ADMIN") {
    return ["MANAGER", "ENGINEER", "VIEWER"];
  }
  return [];
}
=======
export function canManageMembers(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}

export function canEditProject(role: MemberRole): boolean {
  return ["owner", "admin", "manager", "developer"].includes(role);
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
