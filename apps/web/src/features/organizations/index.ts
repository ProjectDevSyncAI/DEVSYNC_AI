export type OrganizationPlan =
  | "free"
  | "starter"
  | "professional"
  | "enterprise";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  plan: OrganizationPlan;
  ownerId: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  organizationId: string;
  allowInvites: boolean;
  requireApproval: boolean;
  defaultRole: string;
  timezone: string;
  defaultProjectVisibility: "private" | "internal" | "public";
}

export function createOrganizationSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPlanLimit(plan: OrganizationPlan): number {
  switch (plan) {
    case "free":
      return 5;
    case "starter":
      return 25;
    case "professional":
      return 100;
    case "enterprise":
      return Infinity;
  }
}