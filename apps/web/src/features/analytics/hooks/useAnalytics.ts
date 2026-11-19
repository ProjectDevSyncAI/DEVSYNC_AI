import { useCallback, useEffect, useRef, useState } from "react";
import {
  dashboardApi,
  extractErrorMessage,
  issueApi,
  sprintApi,
  type DashboardOverviewResponse,
  type Issue,
  type Sprint,
} from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";

export interface AnalyticsData {
  overview: DashboardOverviewResponse;
  sprints: Sprint[];
  issues: Issue[];
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook providing project-scoped operational analytics for sprints and issues.
 * Subscribes to useProjectStore (activeProject) as the single source of truth.
 *
 * Parallel fetch:
 * - dashboardApi.getDashboardOverview: provides aggregated task/issue totals, priority/type breakdown, and active sprint.
 * - sprintApi.list: provides full sprint history including completed iterations with tasks and story points.
 * - issueApi.listByProject: provides individual issue records needed for cross-dimensional metrics
 *   (e.g., exact unresolved BUG count across OPEN, IN_PROGRESS, REOPENED statuses).
 *
 * Concurrency safety:
 * - Immediately clears stale project data upon activeProject change.
 * - Uses activeRequestIdRef counter to ignore stale responses from superseded requests.
 * - Guards against state updates after unmount.
 */
export function useAnalytics() {
  const { activeProject } = useProjectStore();
  const projectId = activeProject?.id;

  const [state, setState] = useState<AnalyticsState>({
    data: null,
    isLoading: Boolean(projectId?.trim()),
    error: null,
  });

  const activeRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentProjectIdRef = useRef<string | null | undefined>(projectId);
  currentProjectIdRef.current = projectId;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAnalytics = useCallback(
    async (targetProjectId?: string | null) => {
      const pid = (targetProjectId ?? currentProjectIdRef.current)?.trim();

      if (!pid) {
        activeRequestIdRef.current += 1;
        if (isMountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      const requestId = (activeRequestIdRef.current += 1);

      // Immediately clear stale data on project change or manual reload
      if (isMountedRef.current) {
        setState({
          data: null,
          isLoading: true,
          error: null,
        });
      }

      try {
        const [overview, sprints, issues] = await Promise.all([
          dashboardApi.getDashboardOverview(pid),
          sprintApi.list(pid),
          issueApi.listByProject(pid),
        ]);

        // Guard against race conditions and unmount
        if (requestId !== activeRequestIdRef.current || !isMountedRef.current) {
          return;
        }

        setState({
          data: {
            overview,
            sprints,
            issues,
          },
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (requestId !== activeRequestIdRef.current || !isMountedRef.current) {
          return;
        }

        const message = extractErrorMessage(
          error,
          "Unable to load project analytics data.",
        );

        setState({
          data: null,
          isLoading: false,
          error: message,
        });
      }
    },
    [],
  );

  useEffect(() => {
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

    void loadAnalytics(trimmedId);

    return () => {
      activeRequestIdRef.current += 1;
    };
  }, [projectId, loadAnalytics]);

  const refresh = useCallback(async () => {
    await loadAnalytics(projectId);
  }, [loadAnalytics, projectId]);

  return {
    ...state,
    activeProject,
    refresh,
  };
}
