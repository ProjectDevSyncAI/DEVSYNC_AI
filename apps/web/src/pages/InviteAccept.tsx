import { useEffect, useLayoutEffect, useState } from "react";
import {
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogIn,
  UserPlus,
  XCircle,
  Building,
} from "lucide-react";
import {
  organizationApi,
  invitationApi,
  getAccessToken,
  type AcceptInvitationResult,
  type InvitationPreviewResult,
} from "../lib/api";
import { useAuthStore } from "../store/auth.store";

interface InviteAcceptProps {
  onNavigate?: (page: string) => void;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function InviteAccept({ onNavigate }: InviteAcceptProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(getAccessToken() && currentUser);

  // In-memory token storage ONLY. Never written to localStorage, sessionStorage, or stores.
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insecureLinkError, setInsecureLinkError] = useState<string | null>(null);
  const [result, setResult] = useState<AcceptInvitationResult | null>(null);

  // Preview state
  const [preview, setPreview] = useState<InvitationPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function fetchPreview(rawToken: string) {
    if (!rawToken.trim()) return;
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const data = await invitationApi.preview({ token: rawToken.trim() });
      setPreview(data);
    } catch (err: any) {
      setPreviewError(err?.message || "Invalid or expired invitation token.");
    } finally {
      setLoadingPreview(false);
    }
  }

  // Extract token from URL fragment on layout mount and scrub URL immediately before paint
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    // 1. REJECT INSECURE LEGACY QUERY STRING TOKENS
    // If a token was provided in the query string (?token=...), reject immediately.
    // Do NOT log the rejected token, do NOT convert it to a fragment, and do NOT submit it.
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("token")) {
        setInsecureLinkError(
          "Insecure or legacy invitation link detected. For your security, query-string invitation links are disabled. Please request a new secure invitation link from your organization administrator.",
        );

        // Immediately scrub the sensitive query parameter from the address bar while preserving history state
        try {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname,
          );
        } catch {
          // Ignore replaceState errors in mock environments
        }
        return;
      }
    }

    // 2. EXTRACT TOKEN EXCLUSIVELY FROM URL FRAGMENT (#token=RAW_TOKEN)
    const hash = window.location.hash;
    if (hash && hash.startsWith("#")) {
      const fragment = hash.slice(1);
      const params = new URLSearchParams(fragment);
      const extractedToken = params.get("token");

      if (extractedToken) {
        const trimmed = extractedToken.trim();
        // Validate token format (cryptographic hex string between 32 and 128 characters)
        if (/^[a-f0-9]{32,128}$/i.test(trimmed)) {
          setToken(trimmed);
          fetchPreview(trimmed);
        } else {
          setError(
            "Invalid invitation token format. Please request a new invitation link.",
          );
        }
      }

      // Immediately scrub the sensitive fragment from the browser address bar before paint, preserving history state
      try {
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname,
        );
      } catch {
        try {
          window.location.hash = "";
        } catch {
          // Fallback for non-standard environments
        }
      }
    }

    // Cleanup: purge raw token and preview from memory when component unmounts
    return () => {
      setToken(null);
      setPreview(null);
    };
  }, []);

  async function handleAccept(tokenToSubmit: string) {
    if (!tokenToSubmit.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Token is submitted strictly in POST request body, never in URL
      const res = await organizationApi.acceptInvitation({
        token: tokenToSubmit.trim(),
      });

      setResult(res);
      // Immediately purge raw token from memory upon successful acceptance
      setToken(null);
      setManualToken("");
    } catch (err: any) {
      // Surface exact backend error message without exposing token
      setError(err?.message || "Failed to accept organization invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelToken() {
    setToken(null);
    setManualToken("");
    setError(null);
    setPreview(null);
    setPreviewError(null);
  }

  function handleGoToDashboard() {
    if (onNavigate) {
      onNavigate("dashboard");
    } else {
      window.location.href = "/";
    }
  }

  function handleNavigateAuth(dest: "login" | "register") {
    const hash = token ? `#token=${encodeURIComponent(token)}` : "";
    if (onNavigate) {
      onNavigate(dest);
      try {
        window.history.pushState({}, "", `/${dest}${hash}`);
      } catch {}
    } else {
      window.location.href = `/${dest}${hash}`;
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Organization Invitation
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Join Team Workspace
            </h1>
          </div>
        </div>

        {/* State 0: Insecure Legacy Query String Link Rejection */}
        {insecureLinkError && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-5 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <XCircle size={18} />
                <span>Insecure Invitation Link Blocked</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-200">
                {insecureLinkError}
              </p>
              <div className="mt-3 pt-3 border-t border-rose-500/20 text-[11px] text-rose-300 space-y-1">
                <p className="font-semibold">Why was this link blocked?</p>
                <p>
                  DevSync AI enforces strict bearer credential protection. Invitation links containing tokens in the URL query string are vulnerable to proxy, CDN, and access-log leakage and are permanently rejected.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Please contact your organization administrator to generate a fresh, secure invitation link.
            </p>
          </div>
        )}

        {/* State 1: Successful Acceptance */}
        {!insecureLinkError && result && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 size={18} />
                <span>Invitation Accepted Successfully!</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-300">
                {result.message || "You have successfully joined the organization."}
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span>Assigned Role:</span>
                <span className="font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  {result.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleGoToDashboard}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/20"
            >
              <span>Go to Workspace Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Preview Loading State */}
        {!insecureLinkError && !result && loadingPreview && (
          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
            <span>Verifying invitation details...</span>
          </div>
        )}

        {/* Preview Metadata Card */}
        {!insecureLinkError && !result && preview && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <Building size={15} />
              <span>Invitation Details</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Organization:</span>
              <span className="font-bold text-white text-sm">{preview.organizationName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Offered Role:</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                {preview.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recipient Email:</span>
              <span className="font-mono text-slate-300">{preview.maskedEmail}</span>
            </div>
          </div>
        )}

        {/* Preview Error Banner */}
        {!insecureLinkError && !result && previewError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Invalid or Unavailable Invitation</p>
              <p className="text-[11px] text-rose-200 leading-relaxed">{previewError}</p>
            </div>
          </div>
        )}

        {/* State 2: Authenticated View */}
        {!insecureLinkError && !result && isAuthenticated && (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Signed in as:</span>
                <span className="font-semibold text-white">{currentUser?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account name:</span>
                <span className="text-slate-200">{currentUser?.name || "User"}</span>
              </div>
            </div>

            {/* Mandatory Verified-Email Prerequisite Alert */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle size={15} className="shrink-0" />
                <span>Prerequisite: Verified Account Email Required</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-200/90">
                DevSync AI security policy requires that your email matches the invitation recipient and is verified (<code>emailVerifiedAt</code>). Unverified accounts will be rejected by the server.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">Acceptance Failed</p>
                  <p className="text-[11px] text-rose-200 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {token ? (
              // Token was present in fragment/URL
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-300 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Shield size={14} className="text-indigo-400" />
                    <span>Invitation Token Captured</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Your invitation token was securely captured from the URL fragment and cleared from your browser address bar.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCancelToken}
                    disabled={submitting}
                    className="sm:w-1/3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-300 transition disabled:opacity-50"
                  >
                    Cancel / Clear
                  </button>

                  <button
                    onClick={() => handleAccept(token)}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying Token & Joining...</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Invitation & Join Team</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // No token in fragment; manual entry
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAccept(manualToken);
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="manual-token" className="block text-xs font-semibold text-slate-300 mb-1">
                    Paste Invitation Token
                  </label>
                  <input
                    id="manual-token"
                    type="text"
                    required
                    placeholder="Enter 64-character token..."
                    value={manualToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualToken(val);
                      if (/^[a-f0-9]{32,128}$/i.test(val.trim())) {
                        fetchPreview(val.trim());
                      }
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs font-mono text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !manualToken.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying & Joining...</span>
                    </>
                  ) : (
                    <span>Accept Invitation</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* State 3: Unauthenticated View */}
        {!insecureLinkError && !result && !isAuthenticated && (
          <div className="space-y-5">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs text-indigo-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <LogIn size={15} className="text-indigo-400" />
                <span>Sign In Required</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                {preview ? (
                  <>
                    You have been invited to join <strong className="text-white">{preview.organizationName}</strong> as a <strong className="text-white">{preview.role}</strong>. Please sign in with <span className="font-mono text-indigo-300">{preview.maskedEmail}</span> to accept this invitation.
                  </>
                ) : (
                  <>
                    To accept this organization invitation, you must first sign in to your DevSync AI account. If you do not have an account, please register with the email address that received the invitation.
                  </>
                )}
              </p>
            </div>

            {/* Token Privacy Notice */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Shield size={13} className="text-indigo-400" />
                <span>Token Protection Notice</span>
              </div>
              <p className="leading-relaxed">
                For bearer credential confidentiality, invitation tokens are preserved in URL fragments across sign-in redirects, never in URL query strings or persistent browser storage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleNavigateAuth("login")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/20"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => handleNavigateAuth("register")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition"
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500">
            DevSync AI Multi-Tenant Security & Tenant Isolation Model
          </p>
        </div>
      </div>
    </div>
  );
}
