import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getSession,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from "../services/auth.service";

import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const session = getSession();

    return {
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading: false,
      error: null,
    };
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }));

      try {
        const response =
          await loginService(credentials);

        setState({
          user: response.user,
          accessToken: response.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return response;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to login.";

        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: message,
        }));

        throw error;
      }
    },
    [],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }));

      try {
        const response =
          await registerService(credentials);

        setState({
          user: response.user,
          accessToken: response.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return response;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to create account.";

        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: message,
        }));

        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutService();

    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const session = getSession();

      setState((previous) => ({
        ...previous,
        user: session?.user ?? null,
        accessToken: session?.accessToken ?? null,
        isAuthenticated: Boolean(
          session?.accessToken,
        ),
      }));
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () =>
      window.removeEventListener(
        "storage",
        handleStorage,
      );
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
  };
}