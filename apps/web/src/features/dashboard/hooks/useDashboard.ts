<<<<<<< HEAD
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDashboardOverview,
  type DashboardOverviewResponse,
} from "../services/dashboard.service";
import { extractErrorMessage } from "../../../lib/api";

export interface DashboardState {
  data: DashboardOverviewResponse | null;
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  isLoading: boolean;
  error: string | null;
}

<<<<<<< HEAD
export function useDashboard(projectId?: string | null) {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: Boolean(projectId?.trim()),
    error: null,
  });

  const activeRequestIdRef = useRef(0);
  const currentProjectIdRef = useRef<string | null | undefined>(projectId);
  currentProjectIdRef.current = projectId;

  const loadDashboard = useCallback(
    async (targetProjectId?: string | null) => {
      const pid = (targetProjectId ?? currentProjectIdRef.current)?.trim();

      if (!pid) {
        activeRequestIdRef.current += 1;
        setState({
          data: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const requestId = (activeRequestIdRef.current += 1);

      // Immediately clear stale data on project change / reload
      setState({
        data: null,
        isLoading: true,
        error: null,
      });

      try {
        const data = await getDashboardOverview(pid);

        // Guard against race conditions: ignore response if request is no longer active
        if (requestId !== activeRequestIdRef.current) {
          return;
        }
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

        setState({
          data,
          isLoading: false,
          error: null,
        });
      } catch (error) {
<<<<<<< HEAD
        // Guard against race conditions: ignore error if request is no longer active
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const message = extractErrorMessage(
          error,
          "Unable to load project dashboard overview.",
        );

        setState({
          data: null,
          isLoading: false,
          error: message,
=======
        setState({
          data: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load dashboard.",
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        });
      }
    },
    [],
  );

  useEffect(() => {
<<<<<<< HEAD
    const trimmedId = projectId?.trim();
    if (!trimmedId) {
      activeRequestIdRef.current += 1;
      setState({
        data: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    void loadDashboard(trimmedId);

    return () => {
      // Invalidate in-flight requests on dependency change or unmount
      activeRequestIdRef.current += 1;
    };
  }, [projectId, loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard(projectId);
  }, [loadDashboard, projectId]);

  return {
    ...state,
    refresh,
  };
}
=======
    void loadDashboard();
  }, [loadDashboard]);

  return {
    ...state,
    refresh: loadDashboard,
  };
}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
