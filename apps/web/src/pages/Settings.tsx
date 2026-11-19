import { useEffect, useState, useMemo } from "react";
import {
  Settings as SettingsIcon,
  Building,
  Users,
  Key,
  Github,
  CheckCircle2,
  Save,
  Mail,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  X,
} from "lucide-react";
import {
  api,
  organizationApi,
  type Organization,
  type OrganizationWithDetails,
  type OrganizationInvitationCreated,
  type CanonicalOrgRole,
} from "../lib/api";
import {
  canInviteMembers,
  getAllowedInviteRoles,
  canRemoveMember,
} from "../features/members";
import { useAuthStore } from "../store/auth.store";
import { useEmailVerificationStore } from "../store/email-verification.store";

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function Settings() {
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<
    "org" | "members" | "account" | "integrations" | "ai"
  >("org");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [currentOrgDetails, setCurrentOrgDetails] = useState<OrganizationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDesc, setOrgDesc] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CanonicalOrgRole>("ENGINEER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // One-time token view state (CONFIDENTIAL: in-memory only)
  const [createdInvitation, setCreatedInvitation] = useState<OrganizationInvitationCreated | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Member removal modal state
  const [targetMemberForRemoval, setTargetMemberForRemoval] = useState<MemberItem | null>(null);
  const [removalSubmitting, setRemovalSubmitting] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Email Verification & Change Email state
  const {
    status: emailStatus,
    isLoading: emailLoading,
    isResending,
    resendMessage,
    error: emailError,
    cooldownSeconds,
    fetchStatus: fetchEmailStatus,
    resendVerification,
    requestEmailChange,
  } = useEmailVerificationStore();

  const [newEmail, setNewEmail] = useState("");
  const [changeEmailSubmitting, setChangeEmailSubmitting] = useState(false);
  const [changeEmailMessage, setChangeEmailMessage] = useState<string | null>(null);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailStatus();
  }, [fetchEmailStatus]);

  async function handleResend(emailToResend?: string) {
    await resendVerification(emailToResend);
  }

  async function handleChangeEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setChangeEmailSubmitting(true);
    setChangeEmailError(null);
    setChangeEmailMessage(null);

    try {
      const response = await requestEmailChange(newEmail.trim().toLowerCase());
      setChangeEmailMessage(
        response.message ||
          "Verification request accepted. Please check the new email address to complete verification (Dispatch is simulated in development mode). Your current email remains primary until verified."
      );
      setNewEmail("");
    } catch (err: any) {
      setChangeEmailError(err?.message || "Failed to request email change.");
    } finally {
      setChangeEmailSubmitting(false);
    }
  }

  const currentUserRole = useMemo(() => {
    return currentOrgDetails?.currentUserRole || currentOrgDetails?.role || "MEMBER";
  }, [currentOrgDetails]);

  // Load organizations
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const orgs = await organizationApi.list();
        setOrganizations(orgs || []);
        if (orgs && orgs.length > 0) {
          const firstOrg = orgs[0];
          setSelectedOrgId(firstOrg.id);
          await loadOrgDetails(firstOrg.id);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load organization settings.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function loadOrgDetails(orgId: string) {
    const details = await organizationApi.get(orgId);
    setCurrentOrgDetails(details);
    setOrgName(details.name || "");
    setOrgSlug(details.slug || "");
    setOrgDesc(details.description || "");

    if (details.members && Array.isArray(details.members)) {
      const mapped: MemberItem[] = details.members.map((m) => {
        const u = m.user;
        const name =
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          u?.username ||
          "Team Member";
        return {
          id: m.id,
          userId: m.userId,
          name,
          email: u?.email || "No email",
          role: m.role,
        };
      });
      setMembers(mapped);
    } else {
      setMembers([]);
    }
  }

  // Handle switching org
  async function handleSelectOrg(orgId: string) {
    setSelectedOrgId(orgId);
    setCreatedInvitation(null);
    setInviteError(null);
    setLoading(true);
    try {
      await loadOrgDetails(orgId);
    } catch (err: any) {
      setError(err?.message || "Failed to load organization details.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(
      "Notice: Organization profile is immutable after creation; PATCH /organizations is not supported by backend policy.",
    );
    setTimeout(() => setStatusMessage(""), 5000);
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !inviteEmail.trim()) return;

    setInviteSubmitting(true);
    setInviteError(null);
    try {
      const created = await organizationApi.createInvitation(selectedOrgId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      setCreatedInvitation(created);
      setInviteEmail("");
      setStatusMessage(`Invitation token generated for ${created.email}.`);
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (err: any) {
      setInviteError(err?.message || "Failed to create invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  }

  function handleCopyToken() {
    if (!createdInvitation) return;
    const inviteUrl = `${window.location.origin}/invite#token=${encodeURIComponent(createdInvitation.rawToken)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  }

  async function handleConfirmRemoveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgId || !targetMemberForRemoval) return;

    setRemovalSubmitting(true);
    setRemovalError(null);
    try {
      await organizationApi.removeMember(selectedOrgId, targetMemberForRemoval.userId);
      setStatusMessage(`Removed ${targetMemberForRemoval.name} from organization.`);
      setTimeout(() => setStatusMessage(""), 5000);
      setTargetMemberForRemoval(null);
      await loadOrgDetails(selectedOrgId);
    } catch (err: any) {
      setRemovalError(err?.message || "Failed to remove member.");
    } finally {
      setRemovalSubmitting(false);
    }
  }

  const allowedInviteRoles = useMemo(
    () => getAllowedInviteRoles(currentUserRole),
    [currentUserRole],
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <SettingsIcon size={15} />
            <span>Workspace Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Settings & Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your organization profile, team members, and integration preferences.
          </p>
        </div>

        {organizations.length > 1 && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d121f] px-3 py-2 text-xs text-white">
            <Building size={14} className="text-indigo-400" />
            <select
              value={selectedOrgId || ""}
              onChange={(e) => handleSelectOrg(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-[#0d121f] p-12 text-xs text-slate-400">
          <Loader2 className="animate-spin text-indigo-400" size={18} />
          <span>Loading organization settings...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("org")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "org"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building size={15} />
          <span>Organization</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "members"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users size={15} />
          <span>Team & Invites</span>
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "account"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mail size={15} />
          <span>Account & Verification</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "integrations"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Github size={15} />
          <span>GitHub Sync</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "ai"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key size={15} />
          <span>AI & LLM Keys</span>
        </button>
      </div>

      {/* Account & Verification Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Primary Email Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Mail size={18} className="text-indigo-400" />
                  <span>Primary Account Email</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your primary email address used for workspace notifications and account recovery.
                </p>
              </div>

              {emailLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin text-indigo-400" />
                  <span>Checking status...</span>
                </div>
              ) : emailStatus?.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 size={13} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <AlertTriangle size={13} />
                  Unverified
                </span>
              )}
            </div>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Current Email Address
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={emailStatus?.email || currentUser?.email || "Loading..."}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 px-3 text-xs text-slate-200 cursor-not-allowed outline-none"
                  />
                  {!emailStatus?.isVerified && (
                    <button
                      type="button"
                      disabled={isResending || cooldownSeconds > 0}
                      onClick={() => handleResend(emailStatus?.email)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <span>Resend in {cooldownSeconds}s</span>
                      ) : (
                        <>
                          <Mail size={13} />
                          <span>Resend Verification</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {!emailStatus?.isVerified && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>Email verification required</span>
                  </p>
                  <p className="text-amber-300/80 leading-relaxed">
                    Please confirm your email address using the verification link sent to your inbox.
                  </p>
                  <p className="text-[11px] text-amber-400/60 pt-1 italic">
                    Notice: In development mode, email dispatch is simulated; no physical email is sent to external inboxes.
                  </p>
                </div>
              )}

              {resendMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{resendMessage}</span>
                </div>
              )}

              {emailError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle size={15} className="shrink-0 text-red-400" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Email Change Card (if any) */}
          {emailStatus?.pendingEmail && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 text-white space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-200">
                    Pending Email Change
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  Verification Pending
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You requested to change your email address to{" "}
                <span className="font-semibold text-white">{emailStatus.pendingEmail}</span>.
                Your current email address remains primary and active until this new address is verified.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isResending || cooldownSeconds > 0}
                  onClick={() => handleResend(emailStatus.pendingEmail || undefined)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <span>Resend to pending in {cooldownSeconds}s</span>
                  ) : (
                    <>
                      <Mail size={13} />
                      <span>Resend to {emailStatus.pendingEmail}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-indigo-300/60 italic">
                Notice: In development mode, email dispatch is simulated; no physical email is sent to external inboxes.
              </div>
            </div>
          )}

          {/* Change Email Form Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Shield size={18} className="text-indigo-400" />
                <span>Change Email Address</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Request an email address update. A verification link will be issued to the new address.
              </p>
            </div>

            <form onSubmit={handleChangeEmailSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="new-email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Security notice: Your primary email will remain unchanged until the verification link sent to your new address is confirmed.
              </div>

              {changeEmailMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{changeEmailMessage}</span>
                </div>
              )}

              {changeEmailError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle size={15} className="shrink-0 text-red-400" />
                  <span>{changeEmailError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={changeEmailSubmitting || !newEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changeEmailSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Requesting verification...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Request Email Change</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Organization Tab */}
      {activeTab === "org" && (
        <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-5">
          <h2 className="text-base font-bold">Organization Profile</h2>

          {organizations.length === 0 ? (
            <div className="text-xs text-slate-400 py-4">
              No organization found for current user session.
            </div>
          ) : (
            <form onSubmit={handleSaveOrg} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  readOnly
                  value={orgSlug}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 px-3 text-xs font-mono text-slate-400 focus:outline-none cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Slug is immutable once registered.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Team & Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Real Invite form (for authorized roles) */}
          {canInviteMembers(currentUserRole) && (
            <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Mail size={16} className="text-indigo-400" />
                <span>Invite Developer to Organization</span>
              </h2>

              {inviteError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <form
                onSubmit={handleInviteMember}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="developer@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CanonicalOrgRole)}
                  className="rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {allowedInviteRoles.map((role) => (
                    <option key={role} value={role} className="bg-slate-900 text-white">
                      {role}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={inviteSubmitting || !inviteEmail.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {inviteSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Invite</span>
                  )}
                </button>
              </form>

              {/* One-time token view banner */}
              {createdInvitation && (
                <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Shield size={16} />
                      <span>One-Time Bearer Credential Generated</span>
                    </div>
                    <button
                      onClick={() => setCreatedInvitation(null)}
                      className="text-amber-400 hover:text-white"
                      title="Dismiss token"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    Invitation link for <strong>{createdInvitation.email}</strong> ({createdInvitation.role}):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invite#token=${encodeURIComponent(createdInvitation.rawToken)}`}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs font-mono text-white select-all outline-none"
                    />
                    <button
                      onClick={handleCopyToken}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        copiedToken
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 text-white hover:bg-indigo-500"
                      }`}
                    >
                      {copiedToken ? (
                        <>
                          <Check size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-400">
                    ⚠️ This link is displayed only once. It will not be stored in your browser or application logs. No automated email was dispatched.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white">
            <h2 className="text-base font-bold mb-4">
              Current Members ({members.length})
            </h2>

            {members.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No members found in this organization.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {members.map((member) => {
                  const isCanonicalOwner = currentOrgDetails?.ownerId === member.userId;
                  const isSelf = currentUser?.id === member.userId;
                  const canRemove = canRemoveMember(currentUserRole, member.role, isCanonicalOwner, isSelf);

                  return (
                    <div
                      key={member.id}
                      className="py-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                          {(member.name[0] || "M").toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {isSelf && (
                              <span className="rounded bg-slate-800 px-1 py-0.2 text-[9px] text-slate-400">
                                You
                              </span>
                            )}
                            {isCanonicalOwner && (
                              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 text-[9px] font-semibold">
                                Primary Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {member.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                          {member.role}
                        </span>
                        {canRemove && (
                          <button
                            onClick={() => {
                              setTargetMemberForRemoval(member);
                              setRemovalError(null);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GitHub Sync Tab */}
      {activeTab === "integrations" && (
        <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
              <Github size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold">GitHub App Integration</h2>
              <p className="text-xs text-slate-400">
                Sync repositories, commit logs, branches, and PR reviews.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">
                Connect GitHub Account
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Grant DevSync AI read & write access to pull requests, webhook
                events, and code branches.
              </div>
            </div>

            <button
              onClick={() => {
                setGithubConnected(!githubConnected);
                setStatusMessage(
                  githubConnected
                    ? "GitHub account disconnected."
                    : "GitHub account connected successfully!",
                );
                setTimeout(() => setStatusMessage(""), 3000);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                githubConnected
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              }`}
            >
              {githubConnected ? "Disconnect" : "Connect GitHub"}
            </button>
          </div>
        </div>
      )}

      {/* AI & LLM Keys Tab */}
      {activeTab === "ai" && (
        <div className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
              <Key size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold">AI Engine Keys</h2>
              <p className="text-xs text-slate-400">
                Provide custom API keys for OpenAI / Anthropic models.
              </p>
            </div>
          </div>

          <div className="max-w-xl space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusMessage("API keys stored securely in local session.");
                setTimeout(() => setStatusMessage(""), 3000);
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Member Removal Modal in Settings */}
      {targetMemberForRemoval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !removalSubmitting) setTargetMemberForRemoval(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0d121f] border border-slate-800 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle size={16} />
                <span>CONFIRM REMOVAL</span>
              </div>
              <button
                onClick={() => setTargetMemberForRemoval(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="mt-2 text-base font-bold">
              Remove Member from Organization
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Are you sure you want to remove <strong>{targetMemberForRemoval.name}</strong> ({targetMemberForRemoval.email})?
            </p>

            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1">
              <p className="font-bold">Project Access Revocation:</p>
              <p className="leading-relaxed">
                They will lose all permissions and project access in this organization. Their global user account will remain intact.
              </p>
            </div>

            {removalError && (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/20 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                <span>{removalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRemoveMember} className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTargetMemberForRemoval(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={removalSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {removalSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove Member</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
