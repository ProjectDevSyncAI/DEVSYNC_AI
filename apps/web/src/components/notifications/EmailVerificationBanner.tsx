import { useState } from "react";
import {
  AlertTriangle,
  Mail,
  Loader2,
  CheckCircle2,
  X,
  Info,
  Clock,
} from "lucide-react";
import { useEmailVerificationStore } from "../../store/email-verification.store";

interface EmailVerificationBannerProps {
  onNavigateSettings?: () => void;
}

export function EmailVerificationBanner({ onNavigateSettings }: EmailVerificationBannerProps = {}) {
  const {
    status,
    isResending,
    resendMessage,
    error,
    cooldownSeconds,
    resendVerification,
    clearError,
  } = useEmailVerificationStore();

  const [dismissed, setDismissed] = useState(false);

  // Do not render if status not loaded, or user is already verified and has no pending email
  if (!status || dismissed) {
    return null;
  }

  const isUnverified = !status.isVerified;
  const hasPendingEmail = Boolean(status.pendingEmail);

  if (!isUnverified && !hasPendingEmail) {
    return null;
  }

  const handleResend = async () => {
    clearError();
    await resendVerification();
  };

  return (
    <aside
      aria-label="Email Verification Notice"
      role="status"
      className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-sm dark:bg-amber-950/40 dark:border-amber-400/20"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {hasPendingEmail ? (
            <Info size={16} className="shrink-0 text-cyan-400" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-amber-400" />
          )}

          <div className="min-w-0 truncate">
            {hasPendingEmail ? (
              <span>
                <strong className="font-semibold text-cyan-300">
                  Email Change Pending:
                </strong>{" "}
                A verification link was sent to{" "}
                <span className="font-medium text-white">{status.pendingEmail}</span>.
                Your primary email remains{" "}
                <span className="text-slate-300">{status.email}</span> until confirmed.
              </span>
            ) : (
              <span>
                <strong className="font-semibold text-amber-300">
                  Verify your email:
                </strong>{" "}
                Please verify{" "}
                <span className="font-medium text-white">{status.email}</span> to
                ensure full account security and access.
                <span className="hidden text-amber-400/80 sm:inline">
                  {" "}(Dispatch is simulated in development mode).
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {resendMessage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 size={13} />
              Sent
            </span>
          )}

          {error && (
            <span className="truncate text-[11px] text-rose-400" title={error}>
              {error}
            </span>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldownSeconds > 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Sending...
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <Clock size={12} />
                Wait {cooldownSeconds}s
              </>
            ) : (
              <>
                <Mail size={12} />
                Resend Link
              </>
            )}
          </button>

          {onNavigateSettings && (
            <button
              type="button"
              onClick={onNavigateSettings}
              className="text-[11px] font-semibold text-amber-300 underline hover:text-white"
            >
              Settings
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-amber-400/70 hover:bg-amber-500/20 hover:text-amber-200"
            aria-label="Dismiss banner"
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default EmailVerificationBanner;
