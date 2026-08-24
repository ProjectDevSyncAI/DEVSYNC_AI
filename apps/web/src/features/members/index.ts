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

export function canManageMembers(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}

export function canEditProject(role: MemberRole): boolean {
  return ["owner", "admin", "manager", "developer"].includes(role);
}