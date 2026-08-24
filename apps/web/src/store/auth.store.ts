import { create } from "zustand";
import {
  authApi,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../lib/api";

/* =========================================================
   DEVSync AI — AUTH STORE
   Central authentication + session state
   ========================================================= */

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;

  login: (
    payload: LoginPayload,
  ) => Promise<AuthUser>;

  register: (
    payload: RegisterPayload,
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  clearError: () => void;

  setUser: (
    user: AuthUser | null,
  ) => void;
}

/* =========================================================
   ERROR NORMALIZER
   ========================================================= */

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

/* =========================================================
   STORE
   ========================================================= */

export const useAuthStore = create<AuthState>(
  (set, get) => ({
    user: null,

    isAuthenticated:
      Boolean(getAccessToken()),

    isLoading: false,

    isInitialized: false,

    error: null,

    /* -------------------------------------------------------
       INITIALIZE SESSION
       ------------------------------------------------------- */

    initialize: async () => {
      const token = getAccessToken();

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });

        return;
      }

      set({
        isLoading: true,
        error: null,
      });

      try {
        const user =
          await authApi.me();

        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
      } catch {
        clearAccessToken();

        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
      }
    },

    /* -------------------------------------------------------
       LOGIN
       ------------------------------------------------------- */

    login: async (payload) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const response =
          await authApi.login(payload);

        setAccessToken(
          response.accessToken,
        );

        set({
          user: response.user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });

        window.dispatchEvent(
          new CustomEvent(
            "devsync:authenticated",
          ),
        );

        return response.user;
      } catch (error) {
        const message =
          getMessage(error);

        set({
          isLoading: false,
          error: message,
          isAuthenticated: false,
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       REGISTER
       ------------------------------------------------------- */

    register: async (payload) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const response =
          await authApi.register(
            payload,
          );

        setAccessToken(
          response.accessToken,
        );

        set({
          user: response.user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });

        window.dispatchEvent(
          new CustomEvent(
            "devsync:authenticated",
          ),
        );

        return response.user;
      } catch (error) {
        const message =
          getMessage(error);

        set({
          isLoading: false,
          error: message,
          isAuthenticated: false,
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       LOGOUT
       ------------------------------------------------------- */

    logout: async () => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        await authApi.logout();
      } catch {
        /*
         * Even if the backend logout fails,
         * we still clear the local session.
         */
      } finally {
        clearAccessToken();

        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          error: null,
        });

        window.dispatchEvent(
          new CustomEvent(
            "devsync:logged-out",
          ),
        );
      }
    },

    /* -------------------------------------------------------
       REFRESH USER
       ------------------------------------------------------- */

    refreshUser: async () => {
      if (!getAccessToken()) {
        set({
          user: null,
          isAuthenticated: false,
        });

        return;
      }

      try {
        const user =
          await authApi.me();

        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      } catch {
        clearAccessToken();

        set({
          user: null,
          isAuthenticated: false,
        });
      }
    },

    /* -------------------------------------------------------
       SET USER
       ------------------------------------------------------- */

    setUser: (user) => {
      set({
        user,
        isAuthenticated:
          Boolean(user),
      });
    },

    /* -------------------------------------------------------
       CLEAR ERROR
       ------------------------------------------------------- */

    clearError: () => {
      set({
        error: null,
      });
    },
  }),
);

/* =========================================================
   SELECTORS
   ========================================================= */

export const selectUser = (
  state: AuthState,
) => state.user;

export const selectIsAuthenticated = (
  state: AuthState,
) => state.isAuthenticated;

export const selectAuthLoading = (
  state: AuthState,
) => state.isLoading;

export const selectAuthInitialized = (
  state: AuthState,
) => state.isInitialized;

export const selectAuthError = (
  state: AuthState,
) => state.error;

/* =========================================================
   SESSION EVENT HANDLER
   ========================================================= */

if (
  typeof window !== "undefined"
) {
  window.addEventListener(
    "devsync:unauthorized",
    () => {
      clearAccessToken();

      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        error:
          "Your session has expired. Please log in again.",
      });
    },
  );
}