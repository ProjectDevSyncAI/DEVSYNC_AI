import { create } from "zustand";
import {
  emailVerificationApi,
  getAccessToken,
  type EmailVerificationStatusResponse,
  type RequestEmailVerificationResponse,
  type ResendEmailVerificationResponse,
} from "../lib/api";

/* =========================================================
   DEVSync AI — EMAIL VERIFICATION STORE
   Central email verification state & lifecycle management
   ========================================================= */

interface EmailVerificationState {
  status: EmailVerificationStatusResponse | null;
  isLoading: boolean;
  isResending: boolean;
  error: string | null;
  resendMessage: string | null;
  cooldownSeconds: number;

  fetchStatus: () => Promise<EmailVerificationStatusResponse | null>;
  resendVerification: (emailOverride?: string) => Promise<boolean>;
  requestEmailChange: (newEmail: string) => Promise<RequestEmailVerificationResponse>;
  clearVerificationState: () => void;
  clearError: () => void;
}

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

function startCooldownCountdown(set: any, seconds: number = 60) {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }

  set({ cooldownSeconds: seconds });

  cooldownTimer = setInterval(() => {
    set((state: EmailVerificationState) => {
      if (state.cooldownSeconds <= 1) {
        if (cooldownTimer) {
          clearInterval(cooldownTimer);
          cooldownTimer = null;
        }
        return { cooldownSeconds: 0 };
      }
      return { cooldownSeconds: state.cooldownSeconds - 1 };
    });
  }, 1000);
}

export const useEmailVerificationStore = create<EmailVerificationState>((set, get) => ({
  status: null,
  isLoading: false,
  isResending: false,
  error: null,
  resendMessage: null,
  cooldownSeconds: 0,

  /* -------------------------------------------------------
     FETCH VERIFICATION STATUS (AUTHORITATIVE FROM BACKEND)
     ------------------------------------------------------- */
  fetchStatus: async () => {
    if (!getAccessToken()) {
      set({ status: null, isLoading: false });
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const status = await emailVerificationApi.getStatus();
      set({
        status,
        isLoading: false,
        error: null,
      });
      return status;
    } catch (err: any) {
      // 401 is handled globally by api.ts interceptor
      const message = err?.message || "Failed to load email verification status.";
      set({
        isLoading: false,
        error: message,
      });
      return null;
    }
  },

  /* -------------------------------------------------------
     RESEND VERIFICATION EMAIL
     ------------------------------------------------------- */
  resendVerification: async (emailOverride?: string) => {
    const { status, cooldownSeconds } = get();

    if (cooldownSeconds > 0) {
      return false;
    }

    set({ isResending: true, error: null, resendMessage: null });

    try {
      const token = getAccessToken();
      const targetEmail = emailOverride || status?.pendingEmail || status?.email;

      if (!targetEmail) {
        throw new Error("No recipient email address available for verification.");
      }

      let res: ResendEmailVerificationResponse | RequestEmailVerificationResponse;

      if (token && !emailOverride) {
        // Authenticated request
        res = await emailVerificationApi.requestVerification({});
      } else {
        // Public resend endpoint
        res = await emailVerificationApi.resendVerification({ email: targetEmail });
      }

      set({
        isResending: false,
        resendMessage: res.message || "Verification email sent.",
        error: null,
      });

      startCooldownCountdown(set, 60);
      return true;
    } catch (err: any) {
      const message = err?.message || "Failed to resend verification email.";
      set({
        isResending: false,
        error: message,
      });
      return false;
    }
  },

  /* -------------------------------------------------------
     REQUEST EMAIL CHANGE
     ------------------------------------------------------- */
  requestEmailChange: async (newEmail: string) => {
    set({ isLoading: true, error: null });

    try {
      const res = await emailVerificationApi.requestVerification({
        email: newEmail.trim().toLowerCase(),
      });

      // Update pending email state immediately upon acceptance
      set((state) => ({
        isLoading: false,
        status: state.status
          ? { ...state.status, pendingEmail: res.email }
          : { email: "", isVerified: false, emailVerifiedAt: null, pendingEmail: res.email },
        resendMessage: res.message,
        error: null,
      }));

      // Synchronize with authoritative backend status if authenticated
      if (getAccessToken()) {
        await get().fetchStatus();
      }

      startCooldownCountdown(set, 60);
      return res;
    } catch (err: any) {
      const message = err?.message || "Failed to initiate email change.";
      set({
        isLoading: false,
        error: message,
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     CLEAR STATE (LOGOUT / SESSION ROTATION)
     ------------------------------------------------------- */
  clearVerificationState: () => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
    set({
      status: null,
      isLoading: false,
      isResending: false,
      error: null,
      resendMessage: null,
      cooldownSeconds: 0,
    });
  },

  /* -------------------------------------------------------
     CLEAR ERROR
     ------------------------------------------------------- */
  clearError: () => {
    set({ error: null });
  },
}));

/* =========================================================
   SESSION LIFECYCLE LISTENERS
   ========================================================= */

export function initEmailVerificationListeners() {
  if (typeof window === "undefined") return () => {};

  // Clear state on unauthorized or logout
  const handleSessionReset = () => {
    useEmailVerificationStore.getState().clearVerificationState();
  };

  // Fetch status on login or authenticated event
  const handleSessionStart = () => {
    useEmailVerificationStore.getState().fetchStatus();
  };

  window.addEventListener("devsync:unauthorized", handleSessionReset);
  window.addEventListener("devsync:logged-out", handleSessionReset);
  window.addEventListener("devsync:authenticated", handleSessionStart);
  window.addEventListener("devsync:login", handleSessionStart);

  return () => {
    window.removeEventListener("devsync:unauthorized", handleSessionReset);
    window.removeEventListener("devsync:logged-out", handleSessionReset);
    window.removeEventListener("devsync:authenticated", handleSessionStart);
    window.removeEventListener("devsync:login", handleSessionStart);
  };
}

if (typeof window !== "undefined") {
  initEmailVerificationListeners();
}
