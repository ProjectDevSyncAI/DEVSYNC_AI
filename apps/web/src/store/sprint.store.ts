import { create } from "zustand";
import {
  sprintApi,
  type CreateSprintPayload,
  type Sprint,
  type SprintStatus,
  type UpdateSprintPayload,
} from "../lib/api.js";

/* =========================================================
   DEVSync AI — SPRINT STORE
   ========================================================= */

interface SprintState {
  sprints: Sprint[];
  activeSprintId: string | null;
  currentProjectId: string | null;

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

  setProjectId: (projectId: string | null) => void;

  setActiveSprintId: (sprintId: string | null) => void;

  fetchSprints: (projectId?: string) => Promise<void>;

  createSprint: (payload: CreateSprintPayload) => Promise<Sprint>;

  updateSprint: (
    sprintId: string,
    payload: UpdateSprintPayload,
  ) => Promise<Sprint>;

  startSprint: (sprintId: string) => Promise<Sprint>;

  completeSprint: (sprintId: string) => Promise<Sprint>;

  deleteSprint: (sprintId: string) => Promise<void>;

  clearSprints: () => void;

  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected sprint error occurred.";
}

export const useSprintStore = create<SprintState>((set, get) => ({
  sprints: [],
  activeSprintId: null,
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
      sprints: [],
      activeSprintId: null,
      error: null,
    });
  },

  /* -------------------------------------------------------
     setActiveSprintId: Select current iteration
     ------------------------------------------------------- */
  setActiveSprintId: (sprintId: string | null) => {
    set({ activeSprintId: sprintId });
  },

  /* -------------------------------------------------------
     fetchSprints: Retrieve sprints scoped strictly to project
     ------------------------------------------------------- */
  fetchSprints: async (projectId?: string) => {
    const targetProjectId = projectId || get().currentProjectId;

    if (!targetProjectId) {
      set({
        sprints: [],
        activeSprintId: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const sprints = await sprintApi.list(targetProjectId);
      const sprintList = Array.isArray(sprints) ? sprints : [];
      const currentActiveId = get().activeSprintId;

      const activeExists = sprintList.some((s) => s.id === currentActiveId);
      const nextActiveId = activeExists
        ? currentActiveId
        : sprintList.length > 0
          ? sprintList[0].id
          : null;

      set({
        sprints: sprintList,
        activeSprintId: nextActiveId,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      set({
        sprints: [], // Never fall back to mock data
        activeSprintId: null,
        isLoading: false,
        error: message,
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     createSprint: Create new sprint for project
     ------------------------------------------------------- */
  createSprint: async (payload: CreateSprintPayload) => {
    const projectId = payload.projectId || get().currentProjectId;

    if (!projectId) {
      const message = "Cannot create a sprint without an active project.";
      set({ error: message });
      throw new Error(message);
    }

    set({ isCreating: true, error: null });

    try {
      const created = await sprintApi.create({
        ...payload,
        projectId,
      });

      set((state) => ({
        sprints: [created, ...state.sprints],
        activeSprintId: created.id,
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
     updateSprint: Optimistic update with reliable rollback
     ------------------------------------------------------- */
  updateSprint: async (sprintId: string, payload: UpdateSprintPayload) => {
    const previousSprints = get().sprints;
    const target = previousSprints.find((s) => s.id === sprintId);

    if (!target) {
      const message = `Sprint with ID ${sprintId} not found in state.`;
      set({ error: message });
      throw new Error(message);
    }

    // Optimistic local update
    const optimistic: Sprint = {
      ...target,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    set({
      sprints: previousSprints.map((s) => (s.id === sprintId ? optimistic : s)),
      isUpdating: true,
      error: null,
    });

    try {
      const serverUpdated = await sprintApi.update(sprintId, payload);

      set((state) => ({
        sprints: state.sprints.map((s) =>
          s.id === sprintId ? serverUpdated : s,
        ),
        isUpdating: false,
        error: null,
      }));

      return serverUpdated;
    } catch (err: unknown) {
      // Rollback to previous state on failure
      set({
        sprints: previousSprints,
        isUpdating: false,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     startSprint: Set sprint status to ACTIVE
     ------------------------------------------------------- */
  startSprint: async (sprintId: string) => {
    return get().updateSprint(sprintId, { status: "ACTIVE" });
  },

  /* -------------------------------------------------------
     completeSprint: Set sprint status to COMPLETED
     ------------------------------------------------------- */
  completeSprint: async (sprintId: string) => {
    return get().updateSprint(sprintId, { status: "COMPLETED" });
  },

  /* -------------------------------------------------------
     deleteSprint: Optimistic delete with rollback
     ------------------------------------------------------- */
  deleteSprint: async (sprintId: string) => {
    const previousSprints = get().sprints;
    const previousActiveId = get().activeSprintId;

    const remaining = previousSprints.filter((s) => s.id !== sprintId);
    const nextActiveId =
      previousActiveId === sprintId
        ? remaining.length > 0
          ? remaining[0].id
          : null
        : previousActiveId;

    // Optimistic removal
    set({
      sprints: remaining,
      activeSprintId: nextActiveId,
      error: null,
    });

    try {
      await sprintApi.remove(sprintId);
    } catch (err: unknown) {
      // Rollback on failure
      set({
        sprints: previousSprints,
        activeSprintId: previousActiveId,
        error: getErrorMessage(err),
      });
      throw err;
    }
  },

  /* -------------------------------------------------------
     clearSprints: Reset sprint state completely
     ------------------------------------------------------- */
  clearSprints: () => {
    set({
      sprints: [],
      activeSprintId: null,
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
