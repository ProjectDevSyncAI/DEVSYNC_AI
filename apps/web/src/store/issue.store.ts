import { create } from "zustand";
import {
  issueApi,
  type CreateIssuePayload,
  type Issue,
  type UpdateIssuePayload,
} from "../lib/api.js";

/* =========================================================
   DEVSync AI — ISSUE / BUG TRACKING STORE
   ========================================================= */

interface IssueState {
  issues: Issue[];
  currentProjectId: string | null;

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

  setProjectId: (projectId: string | null) => void;

  fetchIssues: (projectId?: string) => Promise<void>;

  createIssue: (payload: CreateIssuePayload) => Promise<Issue>;

  updateIssue: (issueId: string, payload: UpdateIssuePayload) => Promise<Issue>;

  deleteIssue: (issueId: string) => Promise<void>;

  clearIssues: () => void;

  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected issue error occurred.";
}

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: [],
  currentProjectId: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,

  /* -------------------------------------------------------
     setProjectId: Switch project context with stale clearing
     ------------------------------------------------------- */
  setProjectId: (projectId: string | null) => {
    const current = get().currentProjectId;
    if (current === projectId) {
      return;
    }

    set({
      currentProjectId: projectId,
      issues: [],
      error: null,
    });
  },

  /* -------------------------------------------------------
     fetchIssues: Retrieve issues scoped strictly to project
     ------------------------------------------------------- */
  fetchIssues: async (projectId?: string) => {
    const targetProjectId = projectId || get().currentProjectId;

    if (!targetProjectId) {
      set({ issues: [], isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const issues = await issueApi.listByProject(targetProjectId);
      set({
        issues: Array.isArray(issues) ? issues : [],
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      set({
        issues: [], // Never fall back to mock data
        isLoading: false,
        error: message,
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     createIssue: Create new issue for project
     ------------------------------------------------------- */
  createIssue: async (payload: CreateIssuePayload) => {
    const projectId = payload.projectId || get().currentProjectId;

    if (!projectId) {
      const message = "Cannot create an issue without an active project.";
      set({ error: message });
      throw new Error(message);
    }

    set({ isCreating: true, error: null });

    try {
      const created = await issueApi.create({
        ...payload,
        projectId,
      });

      set((state) => ({
        issues: [created, ...state.issues],
        isCreating: false,
        error: null,
      }));

      return created;
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      set({ isCreating: false, error: message });
      throw err;
    }
  },

  /* -------------------------------------------------------
     updateIssue: Optimistic update with reliable rollback
     ------------------------------------------------------- */
  updateIssue: async (issueId: string, payload: UpdateIssuePayload) => {
    const previousIssues = get().issues;
    const target = previousIssues.find((i) => i.id === issueId);

    if (!target) {
      const message = `Issue with ID ${issueId} not found in state.`;
      set({ error: message });
      throw new Error(message);
    }

    // Optimistic local update
    const optimistic: Issue = {
      ...target,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    set({
      issues: previousIssues.map((i) => (i.id === issueId ? optimistic : i)),
      isUpdating: true,
      error: null,
    });

    try {
      const serverUpdated = await issueApi.update(issueId, payload);

      set((state) => ({
        issues: state.issues.map((i) => (i.id === issueId ? serverUpdated : i)),
        isUpdating: false,
        error: null,
      }));

      return serverUpdated;
    } catch (err: unknown) {
      // Rollback to previous state on failure
      set({
        issues: previousIssues,
        isUpdating: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     deleteIssue: Optimistic delete with rollback
     ------------------------------------------------------- */
  deleteIssue: async (issueId: string) => {
    const previousIssues = get().issues;

    // Optimistic local removal
    set({
      issues: previousIssues.filter((i) => i.id !== issueId),
      error: null,
    });

    try {
      await issueApi.remove(issueId);
    } catch (err: unknown) {
      // Rollback on failure
      set({
        issues: previousIssues,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     clearIssues: Reset issue state completely
     ------------------------------------------------------- */
  clearIssues: () => {
    set({
      issues: [],
      currentProjectId: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      error: null,
    });
  },

  /* -------------------------------------------------------
     clearError: Dismiss error alert
     ------------------------------------------------------- */
  clearError: () => {
    set({ error: null });
  },
}));
