import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  RefreshCw,
  Key,
} from "lucide-react";
import {
  emailVerificationApi,
  getAccessToken,
  type ConfirmEmailVerificationResponse,
  type VerificationPurpose,
} from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { useEmailVerificationStore } from "../store/email-verification.store";

interface VerifyEmailProps {
  onNavigate?: (page: string) => void;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function VerifyEmail({ onNavigate }: VerifyEmailProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(getAccessToken() && currentUser);
  const fetchVerificationStatus = useEmailVerificationStore(
    (state) => state.fetchStatus,
  );
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // In-memory token storage ONLY. Never stored in localStorage, sessionStorage, or stores.
  const [token, setToken] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<VerificationPurpose | null>(null);
  const [manualToken, setManualToken] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [insecureLinkError, setInsecureLinkError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmEmailVerificationResponse | null>(null);

  // Resend form state for expired / invalid token recovery
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  // Prevent duplicate automatic submissions
  const hasAutoSubmittedRef = useRef(false);

  // Extract token from URL fragment on layout mount and scrub address bar before paint
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    // 1. REJECT INSECURE LEGACY QUERY STRING TOKENS
    // If a token was provided in the query string (?token=...), reject immediately.
    // Do NOT log the rejected token, do NOT convert it to a fragment, and do NOT submit it.
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("token")) {
        setInsecureLinkError(
          "Insecure verification link detected. For your security, verification links containing query parameters are rejected. Please request a new secure verification link.",
        );

        // Immediately scrub the sensitive query parameter from the address bar
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

    // 2. EXTRACT TOKEN EXCLUSIVELY FROM URL FRAGMENT (#token=RAW_TOKEN&purpose=...)
    const hash = window.location.hash;
    let extractedToken: string | null = null;
    let extractedPurpose: VerificationPurpose | null = null;

    if (hash && hash.startsWith("#")) {
      const fragment = hash.slice(1);
      const params = new URLSearchParams(fragment);
      const rawToken = params.get("token");
      const rawPurpose = params.get("purpose");

      if (rawToken) {
        const trimmed = rawToken.trim();
        // Validate token format (cryptographic 64-character hexadecimal string)
        if (/^[a-f0-9]{64}$/i.test(trimmed)) {
          extractedToken = trimmed;
          setToken(trimmed);
        } else {
          setError(
            "Invalid verification token format. The token must be a 64-character hexadecimal code. Please request a new verification link.",
          );
        }
      }

      if (rawPurpose === "email_change" || rawPurpose === "EMAIL_CHANGE") {
        extractedPurpose = "EMAIL_CHANGE";
        setPurpose("EMAIL_CHANGE");
      } else {
        extractedPurpose = "INITIAL_VERIFICATION";
        setPurpose("INITIAL_VERIFICATION");
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

    // 3. AUTO-SUBMIT VALID FRAGMENT TOKEN
    if (extractedToken && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      executeConfirmation(extractedToken);
    }

    // Cleanup: purge raw token from memory when component unmounts
    return () => {
      setToken(null);
      setManualToken("");
    };
  }, []);

  async function executeConfirmation(tokenToSubmit: string) {
    if (!tokenToSubmit.trim()) return;

    setSubmitting(true);
    setError(null);
    setErrorStatus(null);
    setResult(null);

    try {
      // Token is submitted strictly in JSON POST body, never in URL
      const response = await emailVerificationApi.confirmVerification({
        token: tokenToSubmit.trim(),
      });

      setResult(response);

      // Immediately purge raw token from component memory
      setToken(null);
      setManualToken("");

      // Refresh authoritative status and user session if authenticated
      if (getAccessToken()) {
        await Promise.allSettled([
          fetchVerificationStatus(),
          refreshUser(),
        ]);
      }
    } catch (err: any) {
      const status = typeof err?.status === "number" ? err.status : null;
      setErrorStatus(status);

      // Surface backend message without exposing token
      setError(
        err?.message ||
          "Failed to verify email. The token may be expired or already consumed.",
      );
      // Purge token on failure to avoid stale retention
      setToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualToken.trim()) return;

    const trimmed = manualToken.trim();
    if (!/^[a-f0-9]{64}$/i.test(trimmed)) {
      setError(
        "Invalid token format. Please enter a valid 64-character hexadecimal verification code.",
      );
      return;
    }

    await executeConfirmation(trimmed);
  }

  async function handleResendNewLink(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResending(true);
    setResendFeedback(null);

    try {
      const res = await emailVerificationApi.resendVerification({
        email: resendEmail.trim().toLowerCase(),
      });
      setResendFeedback(
        res.message ||
          "If an unverified account exists for this email, a verification link has been sent.",
      );
    } catch (err: any) {
      setResendFeedback(err?.message || "Failed to request a new verification link.");
    } finally {
      setResending(false);
    }
  }

  function handleNavigate(target: "dashboard" | "login" | "register") {
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target === "dashboard" ? "/" : `/${target}`;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white sm:p-6">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl sm:p-8">
        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Email Verification
            </h1>
            <p className="text-xs text-slate-400">
              DevSync AI Account Security
            </p>
          </div>
        </div>

        {/* 1. INSECURE LINK ERROR */}
        {insecureLinkError && (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <div>
                <strong className="block font-semibold text-rose-300">
                  Security Warning
                </strong>
                <p className="mt-1 leading-relaxed">{insecureLinkError}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {submitting && (
          <div
            role="status"
            className="flex flex-col items-center justify-center py-8 text-center space-y-3"
          >
            <Loader2 size={36} className="animate-spin text-indigo-400" />
            <p className="text-sm font-medium text-slate-200">
              Verifying your email address...
            </p>
            <p className="text-xs text-slate-500">
              Validating cryptographic token with the server
            </p>
          </div>
        )}

        {/* 3. SUCCESS STATE */}
        {result && (
          <div
            role="status"
            className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                {result.purpose === "EMAIL_CHANGE"
                  ? "Email Address Updated & Verified"
                  : "Email Verified Successfully"}
              </h2>
              <p className="mt-1.5 text-xs text-emerald-200 leading-relaxed">
                {result.purpose === "EMAIL_CHANGE"
                  ? "Your pending email address has been confirmed and is now your primary account email."
                  : "Your email address has been verified. Your account is now fully active with complete platform access."}
              </p>
            </div>

            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => handleNavigate("dashboard")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
                >
                  <LayoutDashboard size={16} />
                  Continue to Workspace
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigate("login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
                >
                  <LogIn size={16} />
                  Sign In to DevSync AI
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. ERROR STATE */}
        {error && !submitting && !result && (
          <div
            role="alert"
            className="space-y-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-rose-400" />
              <div>
                <strong className="block font-semibold text-rose-300">
                  Verification Failed
                </strong>
                <p className="mt-1 leading-relaxed">{error}</p>
              </div>
            </div>

            {/* Contextual guidance based on verified backend status */}
            {errorStatus === 409 && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs text-indigo-200 space-y-2">
                <p className="font-semibold text-indigo-300">
                  Token Already Confirmed
                </p>
                <p className="leading-relaxed text-slate-300">
                  This verification token has already been confirmed. If your email is already verified, you can sign in directly to continue.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate(isAuthenticated ? "dashboard" : "login")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  {isAuthenticated ? "Continue to Workspace" : "Sign In to DevSync AI"}
                </button>
              </div>
            )}

            {errorStatus === 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-indigo-300">
                  Ambiguous Network Outcome
                </p>
                <p className="leading-relaxed text-slate-400">
                  Communication with the verification server was interrupted. If the server already verified your email before the interruption, your account may already be active. You can check by signing in, or use the manual code entry below to retry.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate(isAuthenticated ? "dashboard" : "login")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Check by Signing In
                </button>
              </div>
            )}

            {/* RESEND RECOVERY SECTION */}
            <div className="border-t border-rose-500/20 pt-3">
              <p className="font-semibold text-slate-300">
                Need a new verification link?
              </p>
              <form onSubmit={handleResendNewLink} className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your account email"
                  required
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={resending || !resendEmail.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {resending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Mail size={13} />
                  )}
                  Resend
                </button>
              </form>

              {resendFeedback && (
                <p className="mt-2 text-[11px] text-emerald-400">
                  {resendFeedback}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5. MANUAL TOKEN ENTRY (If visited without fragment or on demand) */}
        {!token && !submitting && !result && !insecureLinkError && (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Key size={15} className="text-indigo-400" />
              Manual Verification Code Entry
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you have a 64-character verification code from your email, paste it below to verify your account:
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste 64-character hexadecimal code"
                autoComplete="off"
                spellCheck="false"
                maxLength={64}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submitting || manualToken.trim().length !== 64}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                Confirm Verification
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {/* FOOTER NAVIGATION */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => handleNavigate(isAuthenticated ? "dashboard" : "login")}
            className="hover:text-slate-300 transition"
          >
            {isAuthenticated ? "← Back to Dashboard" : "← Back to Sign In"}
          </button>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => handleNavigate("register")}
              className="text-indigo-400 hover:text-indigo-300 transition"
            >
              Create New Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
