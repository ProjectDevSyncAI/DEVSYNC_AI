import { create } from "zustand";
import {
  taskApi,
  type CreateTaskPayload,
  type Task,
  type TaskStatus,
  type UpdateTaskPayload,
} from "../lib/api.js";

/* =========================================================
   DEVSync AI — TASK STORE
   ========================================================= */

interface TaskState {
  tasks: Task[];
  currentProjectId: string | null;

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

  setProjectId: (projectId: string | null) => void;

  fetchTasks: (projectId?: string) => Promise<void>;

  createTask: (payload: CreateTaskPayload) => Promise<Task>;

  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<Task>;

  moveTask: (
    taskId: string,
    status: TaskStatus,
    position?: number,
  ) => Promise<Task>;

  deleteTask: (taskId: string) => Promise<void>;

  clearTasks: () => void;

  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected task error occurred.";
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentProjectId: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,

  /* -------------------------------------------------------
     SET PROJECT & PREVENT STALE TASK LEAKAGE
     ------------------------------------------------------- */
  setProjectId: (projectId: string | null) => {
    const prev = get().currentProjectId;
    if (prev !== projectId) {
      set({
        currentProjectId: projectId,
        tasks: [],
        error: null,
      });
    }
  },

  /* -------------------------------------------------------
     FETCH TASKS
     ------------------------------------------------------- */
  fetchTasks: async (projectId?: string) => {
    const targetProjectId = projectId ?? get().currentProjectId;

    set({
      isLoading: true,
      error: null,
      currentProjectId: targetProjectId ?? null,
    });

    try {
      const tasks = await taskApi.list(targetProjectId || undefined);
      set({
        tasks: tasks || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        tasks: [],
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /* -------------------------------------------------------
     CREATE TASK
     ------------------------------------------------------- */
  createTask: async (payload: CreateTaskPayload) => {
    set({ isCreating: true, error: null });

    try {
      const task = await taskApi.create(payload);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isCreating: false,
        error: null,
      }));
      return task;
    } catch (error) {
      set({
        isCreating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /* -------------------------------------------------------
     UPDATE TASK
     ------------------------------------------------------- */
  updateTask: async (taskId: string, payload: UpdateTaskPayload) => {
    set({ isUpdating: true, error: null });

    try {
      const updated = await taskApi.update(taskId, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        isUpdating: false,
        error: null,
      }));
      return updated;
    } catch (error) {
      set({
        isUpdating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /* -------------------------------------------------------
     MOVE TASK (OPTIMISTIC WITH RELIABLE ROLLBACK)
     ------------------------------------------------------- */
  moveTask: async (taskId: string, status: TaskStatus, position?: number) => {
    const previousTasks = get().tasks;
    const target = previousTasks.find((t) => t.id === taskId);

    if (!target) {
      throw new Error("Task not found in current state.");
    }

    if (target.status === status) {
      return target;
    }

    // 1. Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === "DONE" ? new Date().toISOString() : null,
            }
          : t,
      ),
      isUpdating: true,
      error: null,
    }));

    try {
      // 2. Persist to backend
      const result = await taskApi.move(taskId, { status, position });

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? result : t)),
        isUpdating: false,
      }));

      return result;
    } catch (error) {
      // 3. Rollback on failure!
      set({
        tasks: previousTasks,
        isUpdating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /* -------------------------------------------------------
     DELETE TASK
     ------------------------------------------------------- */
  deleteTask: async (taskId: string) => {
    set({ isUpdating: true, error: null });

    try {
      await taskApi.remove(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        isUpdating: false,
        error: null,
      }));
    } catch (error) {
      set({
        isUpdating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /* -------------------------------------------------------
     CLEAR
     ------------------------------------------------------- */
  clearTasks: () => {
    set({
      tasks: [],
      currentProjectId: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
