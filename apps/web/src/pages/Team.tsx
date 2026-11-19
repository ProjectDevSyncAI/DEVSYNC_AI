<<<<<<< HEAD
import { useEffect, useMemo, useState, type FormEvent } from "react";
=======

import { useMemo, useState, type FormEvent } from "react";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
import {
  Search,
  Plus,
  Users,
  UserCheck,
<<<<<<< HEAD
  Mail,
  X,
  LayoutGrid,
  List,
  Building,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Trash2,
  Edit2,
  LogOut,
  Check,
  Copy,
  Clock,
  Key,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  organizationApi,
  type Organization,
  type OrganizationWithDetails,
  type OrganizationMemberInfo,
  type OrganizationInvitationItem,
  type OrganizationInvitationCreated,
  type CanonicalOrgRole,
} from "../lib/api";
import {
  canModifyRole,
  getAllowedAssignableRoles,
  canRemoveMember,
  canInviteMembers,
  getAllowedInviteRoles,
} from "../features/members";
import { useAuthStore } from "../store/auth.store";
import { useProjectStore } from "../store/project.store";

interface TeamMemberDisplay {
  id: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  rawRole: string;
  department: string;
  color: string;
  initials: string;
  joinedAt: string;
  isCanonicalOwner: boolean;
  isSelf: boolean;
}
=======
  BriefcaseBusiness,
  Clock3,
  Mail,
  MoreHorizontal,
  X,
  LayoutGrid,
  List,
} from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Away";
  tasks: number;
  completed: number;
  color: string;
  initials: string;
};

const initialMembers: TeamMember[] = [
  {
    id: 1,
    name: "Deepanshu Mittal",
    email: "deepanshu@example.com",
    role: "Project Lead",
    department: "Management",
    status: "Active",
    tasks: 12,
    completed: 9,
    color: "bg-blue-100 text-blue-700",
    initials: "DM",
  },
  {
    id: 2,
    name: "Aarav Sharma",
    email: "aarav@example.com",
    role: "Frontend Developer",
    department: "Engineering",
    status: "Active",
    tasks: 10,
    completed: 7,
    color: "bg-violet-100 text-violet-700",
    initials: "AS",
  },
  {
    id: 3,
    name: "Riya Singh",
    email: "riya@example.com",
    role: "UI/UX Designer",
    department: "Design",
    status: "Active",
    tasks: 8,
    completed: 6,
    color: "bg-pink-100 text-pink-700",
    initials: "RS",
  },
  {
    id: 4,
    name: "Karan Verma",
    email: "karan@example.com",
    role: "Backend Developer",
    department: "Engineering",
    status: "Away",
    tasks: 11,
    completed: 5,
    color: "bg-emerald-100 text-emerald-700",
    initials: "KV",
  },
  {
    id: 5,
    name: "Ananya Gupta",
    email: "ananya@example.com",
    role: "QA Engineer",
    department: "Quality Assurance",
    status: "Active",
    tasks: 9,
    completed: 8,
    color: "bg-orange-100 text-orange-700",
    initials: "AG",
  },
  {
    id: 6,
    name: "Rahul Meena",
    email: "rahul@example.com",
    role: "AI Engineer",
    department: "AI & Data",
    status: "Away",
    tasks: 7,
    completed: 3,
    color: "bg-cyan-100 text-cyan-700",
    initials: "RM",
  },
];

const roles = [
  "Project Lead",
  "Frontend Developer",
  "Backend Developer",
  "UI/UX Designer",
  "QA Engineer",
  "AI Engineer",
  "Other",
];

const departments = [
  "Management",
  "Engineering",
  "Design",
  "Quality Assurance",
  "AI & Data",
  "Other",
];
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
];

<<<<<<< HEAD
function getInitials(name: string): string {
=======
function getInitials(name: string) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

<<<<<<< HEAD
function mapRoleToDisplay(rawRole: string): { role: string; department: string } {
  switch (rawRole?.toUpperCase()) {
    case "OWNER":
      return { role: "Owner", department: "Leadership" };
    case "ADMIN":
      return { role: "Admin", department: "Leadership" };
    case "MANAGER":
      return { role: "Project Manager", department: "Product & Management" };
    case "VIEWER":
      return { role: "Viewer", department: "Product & Management" };
    case "ENGINEER":
    default:
      return { role: "Software Engineer", department: "Engineering" };
  }
}

export default function Team() {
  const currentUser = useAuthStore((state) => state.user);

  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [currentOrgDetails, setCurrentOrgDetails] = useState<OrganizationWithDetails | null>(null);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Tab state: members vs invitations vs accept
  const [activeTab, setActiveTab] = useState<"members" | "invitations" | "accept">("members");

  // Members listing state (paginated)
  const [members, setMembers] = useState<TeamMemberDisplay[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit, setMemberLimit] = useState(20);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invitations listing state (paginated)
  const [invitations, setInvitations] = useState<OrganizationInvitationItem[]>([]);
  const [invitationPage, setInvitationPage] = useState(1);
  const [invitationLimit, setInvitationLimit] = useState(20);
  const [invitationTotal, setInvitationTotal] = useState(0);
  const [invitationTotalPages, setInvitationTotalPages] = useState(0);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CanonicalOrgRole>("ENGINEER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // One-time token view state (CONFIDENTIAL: component memory only, never stored in localStorage/sessionStorage/Zustand)
  const [createdInvitation, setCreatedInvitation] = useState<OrganizationInvitationCreated | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Role modification modal state
  const [targetMemberForRole, setTargetMemberForRole] = useState<TeamMemberDisplay | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<CanonicalOrgRole>("ENGINEER");
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

  // Member removal modal state
  const [targetMemberForRemoval, setTargetMemberForRemoval] = useState<TeamMemberDisplay | null>(null);
  const [removalSubmitting, setRemovalSubmitting] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  // Self-leave modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Revoke invitation modal state
  const [targetInvitationForRevocation, setTargetInvitationForRevocation] = useState<OrganizationInvitationItem | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Accept invitation form state
  const [acceptTokenInput, setAcceptTokenInput] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState<string | null>(null);

  // Derive current user's role in the currently selected organization
  const currentUserRole = useMemo(() => {
    if (!currentOrgDetails) return undefined;
    return currentOrgDetails.currentUserRole || currentOrgDetails.role || "MEMBER";
  }, [currentOrgDetails]);

  const isCanonicalOwner = useMemo(() => {
    if (!currentOrgDetails || !currentUser) return false;
    return currentOrgDetails.ownerId === currentUser.id;
  }, [currentOrgDetails, currentUser]);

  // Load organizations
  async function loadOrganizations() {
    setLoadingOrgs(true);
    setError(null);
    try {
      const orgList = await organizationApi.list();
      setOrganizations(orgList || []);
      if (orgList && orgList.length > 0) {
        setSelectedOrgId((current) => {
          if (current && orgList.some((o) => o.id === current)) {
            return current;
          }
          return orgList[0].id;
        });
      } else {
        setSelectedOrgId(null);
        setCurrentOrgDetails(null);
        setMembers([]);
        setInvitations([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load organizations.");
      setOrganizations([]);
      setSelectedOrgId(null);
      setCurrentOrgDetails(null);
      setMembers([]);
    } finally {
      setLoadingOrgs(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  // When selected organization changes, fetch its details and members
  useEffect(() => {
    if (!selectedOrgId) {
      setCurrentOrgDetails(null);
      setMembers([]);
      setInvitations([]);
      setMemberTotal(0);
      setInvitationTotal(0);
      return;
    }

    // Reset page to 1 on organization switch to prevent stale deep-offset queries
    setMemberPage(1);
    setInvitationPage(1);
    setError(null);
    setNotice(null);
    setCreatedInvitation(null); // Clean up confidential one-time tokens on org switch

    loadOrgDetails(selectedOrgId);
    loadMembers(selectedOrgId, 1, memberLimit);
  }, [selectedOrgId]);

  // When memberPage or memberLimit changes, reload members
  useEffect(() => {
    if (selectedOrgId) {
      loadMembers(selectedOrgId, memberPage, memberLimit);
    }
  }, [memberPage, memberLimit]);

  // When invitationPage, invitationLimit, or activeTab changes, reload invitations if authorized
  useEffect(() => {
    if (selectedOrgId && activeTab === "invitations" && canInviteMembers(currentUserRole)) {
      loadInvitations(selectedOrgId, invitationPage, invitationLimit);
    }
  }, [selectedOrgId, activeTab, invitationPage, invitationLimit, currentUserRole]);

  async function loadOrgDetails(orgId: string) {
    try {
      const details = await organizationApi.get(orgId);
      setCurrentOrgDetails(details);
    } catch (err: any) {
      // Non-fatal if details fail; membership will still load
      console.warn("Failed to fetch organization details:", err);
    }
  }

  async function loadMembers(orgId: string, page: number, limit: number) {
    setLoadingMembers(true);
    setError(null);
    try {
      const res = await organizationApi.listMembers(orgId, { page, limit });
      const orgOwnerId = currentOrgDetails?.ownerId;

      const mapped: TeamMemberDisplay[] = (res.items || []).map((m: OrganizationMemberInfo, idx: number) => {
        const u = m.user;
        const fullName =
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          u?.username ||
          "Team Member";
        const { role, department } = mapRoleToDisplay(m.role);
        const isTargetCanonicalOwner = m.userId === orgOwnerId;
        const isSelf = Boolean(currentUser?.id && m.userId === currentUser.id);

        return {
          id: m.id,
          userId: m.userId,
          name: fullName,
          username: u?.username || "",
          email: u?.email || "No email available",
          role,
          rawRole: m.role,
          department,
          color: avatarColors[idx % avatarColors.length],
          initials: getInitials(fullName) || "TM",
          joinedAt: m.joinedAt
            ? new Date(m.joinedAt).toLocaleDateString()
            : "Recently",
          isCanonicalOwner: isTargetCanonicalOwner,
          isSelf,
        };
      });

      setMembers(mapped);
      setMemberTotal(res.total || 0);
      setMemberTotalPages(res.totalPages || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load organization members.");
      setMembers([]);
      setMemberTotal(0);
      setMemberTotalPages(0);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadInvitations(orgId: string, page: number, limit: number) {
    setLoadingInvitations(true);
    try {
      const res = await organizationApi.listInvitations(orgId, { page, limit });
      setInvitations(res.items || []);
      setInvitationTotal(res.total || 0);
      setInvitationTotalPages(res.totalPages || 0);
    } catch (err: any) {
      // If 403, user doesn't have permission to view invitations
      if (err?.status !== 403) {
        setError(err?.message || "Failed to load pending invitations.");
      }
      setInvitations([]);
      setInvitationTotal(0);
      setInvitationTotalPages(0);
    } finally {
      setLoadingInvitations(false);
    }
  }

  // Filter members on current page for client search
=======
export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Frontend Developer",
    department: "Engineering",
  });

  const activeCount = members.filter(
    (member) => member.status === "Active"
  ).length;

  const totalTasks = members.reduce((sum, member) => sum + member.tasks, 0);

  const completedTasks = members.reduce(
    (sum, member) => sum + member.completed,
    0
  );

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
<<<<<<< HEAD
        member.username.toLowerCase().includes(query) ||
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All roles" || member.role === roleFilter;

<<<<<<< HEAD
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  // Handler: Open role update modal
  function handleOpenRoleModal(member: TeamMemberDisplay) {
    setTargetMemberForRole(member);
    const allowed = getAllowedAssignableRoles(currentUserRole);
    setNewSelectedRole(allowed[0] || "ENGINEER");
    setRoleUpdateError(null);
  }

  // Handler: Submit role update
  async function handleSubmitRoleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !targetMemberForRole) return;

    setRoleUpdating(true);
    setRoleUpdateError(null);
    try {
      await organizationApi.updateMemberRole(selectedOrgId, targetMemberForRole.userId, {
        role: newSelectedRole,
      });

      setNotice(`Updated ${targetMemberForRole.name}'s role to ${newSelectedRole}.`);
      setTargetMemberForRole(null);
      await loadMembers(selectedOrgId, memberPage, memberLimit);
    } catch (err: any) {
      setRoleUpdateError(err?.message || "Failed to update member role.");
    } finally {
      setRoleUpdating(false);
    }
  }

  // Handler: Open removal modal
  function handleOpenRemovalModal(member: TeamMemberDisplay) {
    setTargetMemberForRemoval(member);
    setRemovalError(null);
  }

  // Handler: Submit member removal
  async function handleSubmitRemoval(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !targetMemberForRemoval) return;

    setRemovalSubmitting(true);
    setRemovalError(null);
    try {
      await organizationApi.removeMember(selectedOrgId, targetMemberForRemoval.userId);
      setNotice(`Removed ${targetMemberForRemoval.name} from the organization.`);
      setTargetMemberForRemoval(null);
      await loadMembers(selectedOrgId, memberPage, memberLimit);
    } catch (err: any) {
      setRemovalError(err?.message || "Failed to remove member.");
    } finally {
      setRemovalSubmitting(false);
    }
  }

  // Handler: Submit self-leave
  async function handleSubmitLeave(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId) return;

    setLeaveSubmitting(true);
    setLeaveError(null);
    try {
      await organizationApi.leave(selectedOrgId);
      setNotice("You have successfully left the organization.");
      setShowLeaveModal(false);

      // Clear project store stale cache
      useProjectStore.getState().clearProjects();

      // Refresh organizations
      const updatedOrgs = organizations.filter((o) => o.id !== selectedOrgId);
      setOrganizations(updatedOrgs);
      if (updatedOrgs.length > 0) {
        setSelectedOrgId(updatedOrgs[0].id);
      } else {
        setSelectedOrgId(null);
        setCurrentOrgDetails(null);
        setMembers([]);
        setInvitations([]);
      }
    } catch (err: any) {
      setLeaveError(err?.message || "Failed to leave organization.");
    } finally {
      setLeaveSubmitting(false);
    }
  }

  // Handler: Submit create invitation
  async function handleSubmitInvite(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !inviteEmail.trim()) return;

    setInviteSubmitting(true);
    setInviteError(null);
    try {
      const created = await organizationApi.createInvitation(selectedOrgId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      // Switch to one-time token view
      setCreatedInvitation(created);
      setInviteEmail("");
      setCopiedToken(false);

      // Refresh invitations list if on invitations tab
      if (activeTab === "invitations") {
        loadInvitations(selectedOrgId, invitationPage, invitationLimit);
      }
    } catch (err: any) {
      setInviteError(err?.message || "Failed to create organization invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  }

  // Handler: Copy invitation link/token
  function handleCopyToken() {
    if (!createdInvitation) return;
    const inviteUrl = `${window.location.origin}/invite#token=${encodeURIComponent(createdInvitation.rawToken)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  }

  // Handler: Close one-time invitation dialog (CLEARS TOKEN IMMEDIATELY)
  function handleCloseInviteModal() {
    setShowInviteModal(false);
    setCreatedInvitation(null);
    setCopiedToken(false);
    setInviteError(null);
    setInviteEmail("");
  }

  // Handler: Resend invitation with token rotation
  async function handleResendInvitation(inv: OrganizationInvitationItem) {
    if (!selectedOrgId || resendingId) return;
    setResendingId(inv.id);
    setError(null);

    try {
      const res = await organizationApi.resendInvitation(selectedOrgId, inv.id);
      await loadInvitations(selectedOrgId, invitationPage, invitationLimit);
      setCreatedInvitation(res);
      setShowInviteModal(true);
      setNotice(`Invitation resent successfully for ${inv.email}. A new 7-day token has been generated.`);
    } catch (err: any) {
      setError(err?.message || "Failed to resend invitation.");
    } finally {
      setResendingId(null);
    }
  }

  // Handler: Revoke invitation
  async function handleSubmitRevocation(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !targetInvitationForRevocation) return;

    setRevoking(true);
    setRevokeError(null);
    try {
      await organizationApi.revokeInvitation(selectedOrgId, targetInvitationForRevocation.id);
      setNotice(`Revoked invitation for ${targetInvitationForRevocation.email}.`);
      setTargetInvitationForRevocation(null);
      await loadInvitations(selectedOrgId, invitationPage, invitationLimit);
    } catch (err: any) {
      setRevokeError(err?.message || "Failed to revoke invitation.");
    } finally {
      setRevoking(false);
    }
  }

  // Handler: Accept invitation
  async function handleAcceptInvitation(e: FormEvent) {
    e.preventDefault();
    if (!acceptTokenInput.trim()) return;

    setAccepting(true);
    setAcceptError(null);
    setAcceptSuccess(null);
    try {
      const res = await organizationApi.acceptInvitation({ token: acceptTokenInput.trim() });
      setAcceptSuccess(res.message || "Invitation accepted successfully! You have joined the organization.");
      setAcceptTokenInput("");
      await loadOrganizations();
    } catch (err: any) {
      setAcceptError(err?.message || "Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  }

  const allowedInviteRoles = useMemo(
    () => getAllowedInviteRoles(currentUserRole),
    [currentUserRole],
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Heading & Organization Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <Users size={15} />
            <span>ORGANIZATION & TEAM MANAGEMENT</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team & Members
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Real multi-tenant organization administration, role hierarchy, and secure invitations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {organizations.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
              <Building size={14} className="text-slate-500" />
              <label htmlFor="team-org-select" className="sr-only">Select organization</label>
              <select
                id="team-org-select"
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.role ? `(${org.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canInviteMembers(currentUserRole) && (
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteRole(allowedInviteRoles[0] || "ENGINEER");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Invite Member</span>
            </button>
          )}

          {selectedOrgId && (
            <button
              onClick={() => {
                setShowLeaveModal(true);
                setLeaveError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              title="Leave this organization"
            >
              <LogOut size={14} />
              <span>Leave Org</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts & Notices */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Operation Error</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedOrgId) {
                loadMembers(selectedOrgId, memberPage, memberLimit);
              } else {
                loadOrganizations();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Loading state for organization list */}
      {loadingOrgs && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <span>Loading organization membership...</span>
        </div>
      )}

      {!loadingOrgs && organizations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={26} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            No Organizations Available
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">
            You are not part of an organization yet. If you have received an invitation token, you can accept it below.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setActiveTab("accept")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Key size={14} />
              <span>Accept Invitation</span>
            </button>
          </div>
        </div>
      )}

      {selectedOrgId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Members</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {memberTotal}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">In {currentOrgDetails?.name}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Users size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Your Current Role</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    {currentUserRole || "MEMBER"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isCanonicalOwner ? "Primary Canonical Owner" : "Active tenant role"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Shield size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Pending Invitations</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {canInviteMembers(currentUserRole) ? invitationTotal : "—"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {canInviteMembers(currentUserRole) ? "Awaiting recipient acceptance" : "Admin view only"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Mail size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Workspace Slug</p>
                  <p className="mt-2 text-base font-mono font-bold tracking-tight text-slate-900 truncate max-w-[140px]">
                    {currentOrgDetails?.slug || "—"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Tenant identifier</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Building size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
                activeTab === "members"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={15} />
              <span>Active Members</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {memberTotal}
              </span>
            </button>

            {canInviteMembers(currentUserRole) && (
              <button
                onClick={() => setActiveTab("invitations")}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
                  activeTab === "invitations"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail size={15} />
                <span>Pending Invitations</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {invitationTotal}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("accept")}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
                activeTab === "accept"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Key size={15} />
              <span>Accept Invitation</span>
            </button>
          </div>

          {/* TAB 1: MEMBERS DIRECTORY */}
          {activeTab === "members" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Directory Filter Bar */}
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Team Directory
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Showing {filteredMembers.length} matching of {members.length} members on this page ({memberTotal} total in {currentOrgDetails?.name})
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 inline-block">
                      Current-page filtering only. Bounded server pagination loads 20 members per page.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <div className="relative sm:w-64">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter current page (name, email, role)..."
                        aria-label="Filter current page"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 cursor-pointer"
                      aria-label="Filter by role"
                    >
                      <option>All roles</option>
                      <option>Owner</option>
                      <option>Admin</option>
                      <option>Project Manager</option>
                      <option>Software Engineer</option>
                      <option>Viewer</option>
                    </select>

                    <div className="flex rounded-xl border border-slate-200 p-0.5">
                      <button
                        onClick={() => setView("grid")}
                        aria-label="Grid view"
                        className={`rounded-lg p-1.5 ${
                          view === "grid"
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <LayoutGrid size={15} />
                      </button>
                      <button
                        onClick={() => setView("list")}
                        aria-label="List view"
                        className={`rounded-lg p-1.5 ${
                          view === "list"
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <List size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members Loading */}
              {loadingMembers && (
                <div className="flex items-center justify-center gap-3 p-16 text-xs text-slate-500">
                  <Loader2 className="animate-spin text-blue-600" size={18} />
                  <span>Fetching organization members from server...</span>
                </div>
              )}

              {/* Empty State */}
              {!loadingMembers && filteredMembers.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Users className="mx-auto mb-3 text-slate-400" size={32} />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {members.length === 0
                      ? "No members found in this organization"
                      : "No members match your filter criteria"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {members.length === 0
                      ? "Use the Invite Member button to add team members."
                      : "Try adjusting your search query or role filter."}
                  </p>
                </div>
              )}

              {/* Grid View */}
              {!loadingMembers && filteredMembers.length > 0 && view === "grid" && (
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredMembers.map((member) => (
                    <article
                      key={member.id}
                      className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${member.color}`}
                            >
                              {member.initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {member.isSelf && (
                                  <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                                    You
                                  </span>
                                )}
                              </h3>
                              <p className="truncate text-xs text-slate-500">
                                @{member.username || "user"} · {member.role}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              member.rawRole === "OWNER"
                                ? "bg-purple-100 text-purple-700"
                                : member.rawRole === "ADMIN"
                                ? "bg-indigo-100 text-indigo-700"
                                : member.rawRole === "MANAGER"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {member.rawRole}
                            </span>
                            {member.isCanonicalOwner && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                                Primary Owner
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Joined {member.joinedAt}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {canModifyRole(currentUserRole, member.rawRole, member.isCanonicalOwner, member.isSelf) && (
                            <button
                              onClick={() => handleOpenRoleModal(member)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="Modify Role"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {canRemoveMember(currentUserRole, member.rawRole, member.isCanonicalOwner, member.isSelf) && (
                            <button
                              onClick={() => handleOpenRemovalModal(member)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Remove Member"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* List View */}
              {!loadingMembers && filteredMembers.length > 0 && view === "list" && (
                <div className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${member.color}`}
=======
      const matchesDepartment =
        departmentFilter === "All departments" ||
        member.department === departmentFilter;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [members, search, roleFilter, departmentFilter]);

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setError("Please enter the member's name and email.");
      return;
    }

    if (members.some((member) => member.email.toLowerCase() === email.toLowerCase())) {
      setError("A team member with this email already exists.");
      return;
    }

    const initials = getInitials(name);
    const color = avatarColors[members.length % avatarColors.length];

    setMembers((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((member) => member.id)) + 1,
        name,
        email,
        role: form.role,
        department: form.department,
        status: "Active",
        tasks: 0,
        completed: 0,
        initials,
        color,
      },
    ]);

    setForm({
      name: "",
      email: "",
      role: "Frontend Developer",
      department: "Engineering",
    });
    setShowModal(false);
  }

  function removeMember(id: number) {
    if (!window.confirm("Remove this member from the displayed team?")) return;

    setMembers((current) => current.filter((member) => member.id !== id));
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-slate-700">Team</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team Members
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Discover your teammates and keep track of team workload.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add team member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total members"
          value={members.length}
          subtitle="People in this team"
          icon={<Users size={21} />}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Active members"
          value={activeCount}
          subtitle="Currently marked active"
          icon={<UserCheck size={21} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Total assigned tasks"
          value={totalTasks}
          subtitle="Across all displayed members"
          icon={<BriefcaseBusiness size={21} />}
          color="bg-violet-50 text-violet-600"
        />
        <SummaryCard
          title="Tasks completed"
          value={completedTasks}
          subtitle="Reported completed tasks"
          icon={<Clock3 size={21} />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Team directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredMembers.length} of {members.length} members
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search team..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                aria-label="Filter by role"
              >
                <option>All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                aria-label="Filter by department"
              >
                <option>All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={`rounded-lg p-2 ${
                    view === "grid"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={`rounded-lg p-2 ${
                    view === "list"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-3 text-slate-400" size={32} />
            <h3 className="font-semibold text-slate-900">No members found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or change your filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("All roles");
                setDepartmentFilter("All departments");
              }}
              className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => {
              const progress =
                member.tasks > 0
                  ? Math.round((member.completed / member.tasks) * 100)
                  : 0;

              return (
                <article
                  key={member.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${member.color}`}
                      >
                        {member.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">
                          {member.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeMember(member.id)}
                      title="Remove member"
                      aria-label={`Remove ${member.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={15} className="shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                      {member.department}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                        member.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          member.status === "Active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {member.status}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        Task completion
                      </span>
                      <span className="font-bold text-slate-800">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {member.completed} completed of {member.tasks} tasks
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Member</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Department</th>
                  <th className="px-4 py-4 font-semibold">Tasks</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${member.color}`}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                        >
                          {member.initials}
                        </div>
                        <div>
<<<<<<< HEAD
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-slate-900">{member.name}</p>
                            {member.isSelf && (
                              <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                                You
                              </span>
                            )}
                            {member.isCanonicalOwner && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 border border-amber-200">
                                Primary Owner
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            @{member.username} · {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                          member.rawRole === "OWNER"
                            ? "bg-purple-100 text-purple-700"
                            : member.rawRole === "ADMIN"
                            ? "bg-indigo-100 text-indigo-700"
                            : member.rawRole === "MANAGER"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {member.role} ({member.rawRole})
                        </span>

                        <span className="text-slate-400 text-[11px] hidden md:inline">
                          Joined {member.joinedAt}
                        </span>

                        <div className="flex items-center gap-1">
                          {canModifyRole(currentUserRole, member.rawRole, member.isCanonicalOwner, member.isSelf) && (
                            <button
                              onClick={() => handleOpenRoleModal(member)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="Modify Role"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {canRemoveMember(currentUserRole, member.rawRole, member.isCanonicalOwner, member.isSelf) && (
                            <button
                              onClick={() => handleOpenRemovalModal(member)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Remove Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bounded Pagination Controls */}
              {memberTotalPages > 1 && (
                <div className="border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <select
                      value={memberLimit}
                      onChange={(e) => {
                        setMemberLimit(Number(e.target.value));
                        setMemberPage(1);
                      }}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="ml-2">
                      Showing {(memberPage - 1) * memberLimit + 1}–{Math.min(memberPage * memberLimit, memberTotal)} of {memberTotal}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                      disabled={memberPage <= 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>

                    <span className="font-semibold text-slate-700">
                      Page {memberPage} of {memberTotalPages}
                    </span>

                    <button
                      onClick={() => setMemberPage((p) => Math.min(memberTotalPages, p + 1))}
                      disabled={memberPage >= memberTotalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: PENDING INVITATIONS */}
          {activeTab === "invitations" && canInviteMembers(currentUserRole) && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Pending Organization Invitations
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Active bearer invitations awaiting recipient acceptance ({invitationTotal} total).
                  </p>
                </div>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus size={14} />
                  <span>New Invitation</span>
                </button>
              </div>

              {loadingInvitations && (
                <div className="flex items-center justify-center gap-3 p-16 text-xs text-slate-500">
                  <Loader2 className="animate-spin text-blue-600" size={18} />
                  <span>Loading invitations...</span>
                </div>
              )}

              {!loadingInvitations && invitations.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Mail className="mx-auto mb-3 text-slate-400" size={32} />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    No Pending Invitations
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    All invited members have accepted or no invitations have been issued.
                  </p>
                </div>
              )}

              {!loadingInvitations && invitations.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {invitations.map((inv) => {
                    const isExpired = inv.status === "EXPIRED" || new Date(inv.expiresAt) < new Date();
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{inv.email}</p>
                            <p className="text-[11px] text-slate-500">
                              Role: <span className="font-semibold text-slate-700">{inv.role}</span> · Created: {new Date(inv.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              inv.status === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-700"
                                : isExpired
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {inv.status === "ACCEPTED" ? "Accepted" : isExpired ? "Expired" : "Pending"}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>

                          {inv.status !== "ACCEPTED" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResendInvitation(inv)}
                                disabled={resendingId === inv.id}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                {resendingId === inv.id ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Resending...</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={12} />
                                    <span>Resend</span>
                                  </>
                                )}
                              </button>

                              {!isExpired && (
                                <button
                                  onClick={() => {
                                    setTargetInvitationForRevocation(inv);
                                    setRevokeError(null);
                                  }}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bounded Pagination Controls for Invitations */}
              {invitationTotalPages > 1 && (
                <div className="border-t border-slate-100 p-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {(invitationPage - 1) * invitationLimit + 1}–{Math.min(invitationPage * invitationLimit, invitationTotal)} of {invitationTotal}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInvitationPage((p) => Math.max(1, p - 1))}
                      disabled={invitationPage <= 1}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="font-semibold text-slate-700">
                      Page {invitationPage} of {invitationTotalPages}
                    </span>
                    <button
                      onClick={() => setInvitationPage((p) => Math.min(invitationTotalPages, p + 1))}
                      disabled={invitationPage >= invitationTotalPages}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: ACCEPT INVITATION */}
          {activeTab === "accept" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
                <Key size={16} />
                <span>INVITATION ACCEPTANCE</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Accept Organization Invitation
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Paste the one-time invitation token provided by your organization administrator to join the team.
              </p>

              {/* Mandatory Email Verification Notice */}
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={15} className="text-amber-700 shrink-0" />
                  <span>Security Prerequisite: Verified Email Required</span>
                </div>
                <p className="leading-relaxed">
                  In accordance with DevSync AI tenant-isolation policies, your authenticated account email must match the invitation recipient and must have a verified status. Unverified accounts will be rejected by the backend.
                </p>
              </div>

              {acceptSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{acceptSuccess}</span>
                </div>
              )}

              {acceptError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{acceptError}</span>
                </div>
              )}

              <form onSubmit={handleAcceptInvitation} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="invitation-token-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    One-Time Invitation Token
                  </label>
                  <input
                    id="invitation-token-input"
                    type="text"
                    required
                    placeholder="Enter 64-character hexadecimal invitation token..."
                    value={acceptTokenInput}
                    onChange={(e) => setAcceptTokenInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-mono outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={accepting || !acceptTokenInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {accepting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying & Joining...</span>
                    </>
                  ) : (
                    <span>Accept & Join Organization</span>
                  )}
                </button>
              </form>
            </section>
          )}
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. Invite Member Modal / One-Time Token Result */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !inviteSubmitting) handleCloseInviteModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {!createdInvitation ? (
              // Form view
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Invite Team Member
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Generate a secure one-time bearer invitation link for {currentOrgDetails?.name}.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseInviteModal}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                {inviteError && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitInvite} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="invite-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      required
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="invite-role" className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Organization Role
                    </label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as CanonicalOrgRole)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {allowedInviteRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {currentUserRole === "ADMIN"
                        ? "As an Admin, you can invite Managers, Engineers, and Viewers."
                        : "As an Owner, you can invite Admins, Managers, Engineers, and Viewers."}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseInviteModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteSubmitting || !inviteEmail.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {inviteSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate Invitation</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // One-time token result view (CONFIDENTIAL)
              <div>
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-1">
                  <CheckCircle2 size={16} />
                  <span>INVITATION GENERATED</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Invitation Ready to Share
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Invited <span className="font-semibold text-slate-800">{createdInvitation.email}</span> as{" "}
                  <span className="font-semibold text-slate-800">{createdInvitation.role}</span>.
                </p>

                {/* Critical Security Warning */}
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Shield size={15} className="text-amber-700" />
                    <span>Confidential One-Time Bearer Credential</span>
                  </div>
                  <p className="leading-relaxed">
                    This token is displayed <strong>ONLY ONCE</strong> in this window. For security, it is never saved in your browser storage or server logs. <strong>No automated email has been sent.</strong> You must copy and share this link directly with the recipient.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    If you close this dialog, this token cannot be recovered; you will have to revoke it and generate a new one.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Shareable Invitation Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invite#token=${encodeURIComponent(createdInvitation.rawToken)}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-mono text-slate-800 select-all outline-none"
                    />
                    <button
                      onClick={handleCopyToken}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                        copiedToken
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {copiedToken ? (
                        <>
                          <Check size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    I Have Copied the Link & Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Modify Role Confirmation Modal */}
      {targetMemberForRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !roleUpdating) setTargetMemberForRole(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Change Member Role
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Update role for {targetMemberForRole.name} (@{targetMemberForRole.username})
                </p>
              </div>
              <button
                onClick={() => setTargetMemberForRole(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {roleUpdateError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>{roleUpdateError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRoleUpdate} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">
                  Current Role: <span className="font-semibold text-slate-900">{targetMemberForRole.rawRole}</span>
                </p>
                <label htmlFor="new-role-select" className="block text-xs font-semibold text-slate-700 mt-3 mb-1">
                  Select New Role
                </label>
                <select
                  id="new-role-select"
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value as CanonicalOrgRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs outline-none focus:border-blue-500 cursor-pointer"
                >
                  {getAllowedAssignableRoles(currentUserRole).map((role) => (
=======
                          <p className="font-semibold text-slate-800">
                            {member.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.role}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.department}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.completed}/{member.tasks} completed
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          member.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add member modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add team member
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a member to the displayed team directory.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addMember} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name *
                </label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  {roles.filter((role) => role !== "Other").map((role) => (
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

<<<<<<< HEAD
              <p className="text-[11px] text-slate-400">
                Role changes take effect immediately across all project authorization paths.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTargetMemberForRole(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
=======
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  {departments.filter((department) => department !== "Other").map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                >
                  Cancel
                </button>
                <button
                  type="submit"
<<<<<<< HEAD
                  disabled={roleUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {roleUpdating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Confirm Role Change</span>
                  )}
=======
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add member
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
<<<<<<< HEAD

      {/* 3. Remove Member Confirmation Modal */}
      {targetMemberForRemoval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !removalSubmitting) setTargetMemberForRemoval(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <AlertTriangle size={16} />
                <span>CONFIRM REMOVAL</span>
              </div>
              <button
                onClick={() => setTargetMemberForRemoval(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-900">
              Remove Member from Organization
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Target: <span className="font-semibold text-slate-800">{targetMemberForRemoval.name}</span> ({targetMemberForRemoval.email})
            </p>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-1">
              <p className="font-bold">Access Revocation Notice:</p>
              <p className="leading-relaxed">
                Removing this member will revoke their organization membership and automatically remove them from all projects belonging to {currentOrgDetails?.name}.
              </p>
              <p className="text-[11px] text-rose-700">
                Their global user account and work in other organizations will remain intact.
              </p>
            </div>

            {removalError && (
              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-100 p-3 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-700 shrink-0" />
                <span>{removalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRemoval} className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTargetMemberForRemoval(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={removalSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {removalSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Yes, Remove Member</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Self-Leave Confirmation Modal */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !leaveSubmitting) setShowLeaveModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <LogOut size={16} />
                <span>LEAVE ORGANIZATION</span>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-900">
              Leave {currentOrgDetails?.name}?
            </h3>

            {isCanonicalOwner ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Primary Owner Restriction:</p>
                <p className="leading-relaxed">
                  You are the primary canonical owner of this organization. You cannot leave the organization while ownership transfer is unavailable.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-1">
                <p className="font-bold">Important Notice:</p>
                <p className="leading-relaxed">
                  You will immediately lose access to all projects, documents, tasks, and chat channels within this organization.
                </p>
              </div>
            )}

            {leaveError && (
              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-100 p-3 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-700 shrink-0" />
                <span>{leaveError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={leaveSubmitting || isCanonicalOwner}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {leaveSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Leaving...</span>
                  </>
                ) : (
                  <span>Confirm & Leave</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Revoke Invitation Confirmation Modal */}
      {targetInvitationForRevocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !revoking) setTargetInvitationForRevocation(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <AlertTriangle size={16} />
                <span>REVOKE INVITATION</span>
              </div>
              <button
                onClick={() => setTargetInvitationForRevocation(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-900">
              Revoke Pending Invitation
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to revoke the invitation for{" "}
              <span className="font-semibold text-slate-800">{targetInvitationForRevocation.email}</span>?
            </p>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              The bearer token previously generated will become immediately invalid and cannot be used to join the organization.
            </p>

            {revokeError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>{revokeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRevocation} className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTargetInvitationForRevocation(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={revoking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {revoking ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <span>Yes, Revoke</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
=======
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    </div>
  );
}
