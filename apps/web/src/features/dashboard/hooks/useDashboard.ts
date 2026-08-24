import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboardData,
  type DashboardData,
} from "../services/dashboard.service";

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] =
    useState<DashboardState>({
      data: null,
      isLoading: true,
      error: null,
    });

  const loadDashboard = useCallback(
    async () => {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }));

      try {
        const data =
          await getDashboardData();

        setState({
          data,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load dashboard.",
        });
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    ...state,
    refresh: loadDashboard,
  };
}