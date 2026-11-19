import { create } from "zustand";
import {
  projectApi,
  type CreateProjectPayload,
  type Project,
} from "../lib/api";

/* =========================================================
   DEVSync AI — PROJECT STORE
   ========================================================= */

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
<<<<<<< HEAD
  currentOrganizationId: string | null;
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

<<<<<<< HEAD
  setOrganizationId: (orgId: string | null) => void;

  fetchProjects: (organizationId?: string) => Promise<void>;
=======
  fetchProjects: () => Promise<void>;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  fetchProject: (
    projectId: string,
  ) => Promise<Project>;

  createProject: (
    payload: CreateProjectPayload,
<<<<<<< HEAD
    organizationId?: string,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  ) => Promise<Project>;

  updateProject: (
    projectId: string,
    payload: Partial<CreateProjectPayload>,
  ) => Promise<Project>;

  deleteProject: (
    projectId: string,
  ) => Promise<void>;

  setActiveProject: (
    project: Project | null,
  ) => void;

  clearProjects: () => void;

  clearError: () => void;
}

/* =========================================================
   ERROR HELPER
   ========================================================= */

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

/* =========================================================
   STORE
   ========================================================= */

export const useProjectStore =
  create<ProjectState>((set, get) => ({
    projects: [],

    activeProject: null,

<<<<<<< HEAD
    currentOrganizationId: null,

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    isLoading: false,

    isCreating: false,

    isUpdating: false,

    error: null,

    /* -------------------------------------------------------
<<<<<<< HEAD
       SET ORGANIZATION & PREVENT STALE PROJECT DATA
       ------------------------------------------------------- */

    setOrganizationId: (orgId: string | null) => {
      const prevOrgId = get().currentOrganizationId;
      if (prevOrgId !== orgId) {
        set({
          currentOrganizationId: orgId,
          projects: [],
          activeProject: null,
          error: null,
        });
      }
    },

    /* -------------------------------------------------------
       FETCH PROJECTS (BY ORGANIZATION)
       ------------------------------------------------------- */

    fetchProjects: async (organizationId?: string) => {
      const targetOrgId = organizationId ?? get().currentOrganizationId;
      if (!targetOrgId) {
        set({
          projects: [],
          activeProject: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      set({
        isLoading: true,
        error: null,
        currentOrganizationId: targetOrgId,
=======
       FETCH PROJECTS
       ------------------------------------------------------- */

    fetchProjects: async () => {
      set({
        isLoading: true,
        error: null,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      });

      try {
        const projects =
<<<<<<< HEAD
          await projectApi.list(targetOrgId);
=======
          await projectApi.list();
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

        const currentActive =
          get().activeProject;

        const activeProject =
          currentActive
            ? projects.find(
                (project) =>
                  project.id ===
                  currentActive.id,
<<<<<<< HEAD
              ) ?? projects[0] ?? null
=======
              ) ?? null
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            : projects[0] ?? null;

        set({
          projects,
          activeProject,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: getErrorMessage(error),
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       FETCH SINGLE PROJECT
       ------------------------------------------------------- */

    fetchProject: async (
      projectId,
    ) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const project =
          await projectApi.get(
            projectId,
          );

        set((state) => ({
          projects: state.projects.some(
            (item) =>
              item.id === project.id,
          )
            ? state.projects.map(
                (item) =>
                  item.id === project.id
                    ? project
                    : item,
              )
            : [
                ...state.projects,
                project,
              ],

          activeProject: project,

          isLoading: false,
          error: null,
        }));

        return project;
      } catch (error) {
        set({
          isLoading: false,
          error: getErrorMessage(error),
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       CREATE PROJECT
       ------------------------------------------------------- */

    createProject: async (
      payload,
<<<<<<< HEAD
      organizationId,
    ) => {
      const targetOrgId = organizationId ?? get().currentOrganizationId;
      if (!targetOrgId) {
        const errorMsg = "Cannot create project without selecting an organization.";
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }

=======
    ) => {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      set({
        isCreating: true,
        error: null,
      });

      try {
        const project =
          await projectApi.create(
<<<<<<< HEAD
            targetOrgId,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
            payload,
          );

        set((state) => ({
          projects: [
            project,
            ...state.projects,
          ],

          activeProject: project,

          isCreating: false,
          error: null,
        }));

        return project;
      } catch (error) {
        set({
          isCreating: false,
          error: getErrorMessage(error),
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       UPDATE PROJECT
       ------------------------------------------------------- */

    updateProject: async (
      projectId,
      payload,
    ) => {
      set({
        isUpdating: true,
        error: null,
      });

      try {
        const updated =
          await projectApi.update(
            projectId,
            payload,
          );

        set((state) => ({
          projects: state.projects.map(
            (project) =>
              project.id === projectId
                ? updated
                : project,
          ),

          activeProject:
            state.activeProject?.id ===
            projectId
              ? updated
              : state.activeProject,

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
       DELETE PROJECT
       ------------------------------------------------------- */

    deleteProject: async (
      projectId,
    ) => {
      set({
        isUpdating: true,
        error: null,
      });

      try {
        await projectApi.remove(
          projectId,
        );

        set((state) => {
          const projects =
            state.projects.filter(
              (project) =>
                project.id !== projectId,
            );

          const deletedActive =
            state.activeProject?.id ===
            projectId;

          return {
            projects,

            activeProject:
              deletedActive
                ? projects[0] ?? null
                : state.activeProject,

            isUpdating: false,
            error: null,
          };
        });
      } catch (error) {
        set({
          isUpdating: false,
          error: getErrorMessage(error),
        });

        throw error;
      }
    },

    /* -------------------------------------------------------
       ACTIVE PROJECT
       ------------------------------------------------------- */

    setActiveProject: (
      project,
    ) => {
      set({
        activeProject: project,
      });
    },

    /* -------------------------------------------------------
       CLEAR
       ------------------------------------------------------- */

    clearProjects: () => {
      set({
        projects: [],
        activeProject: null,
<<<<<<< HEAD
        currentOrganizationId: null,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
        error: null,
      });
    },

    clearError: () => {
      set({
        error: null,
      });
    },
  }));