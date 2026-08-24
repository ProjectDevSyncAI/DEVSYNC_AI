import { create } from "zustand";

/* =========================================================
   DEVSync AI — WORKSPACE STORE
   ========================================================= */

export interface WorkspaceMember {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
  status?:
    | "online"
    | "offline"
    | "away";
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  avatarUrl?: string | null;
  plan?: string;
  createdAt?: string;
}

interface WorkspaceState {
  workspace: Workspace | null;

  members: WorkspaceMember[];

  isLoading: boolean;

  error: string | null;

  setWorkspace: (
    workspace: Workspace | null,
  ) => void;

  setMembers: (
    members: WorkspaceMember[],
  ) => void;

  addMember: (
    member: WorkspaceMember,
  ) => void;

  updateMember: (
    memberId: string,
    data: Partial<WorkspaceMember>,
  ) => void;

  removeMember: (
    memberId: string,
  ) => void;

  setLoading: (
    value: boolean,
  ) => void;

  setError: (
    error: string | null,
  ) => void;

  clearWorkspace: () => void;
}

/* =========================================================
   STORE
   ========================================================= */

export const useWorkspaceStore =
  create<WorkspaceState>(
    (set) => ({
      workspace: null,

      members: [],

      isLoading: false,

      error: null,

      /* -------------------------------------------------------
         WORKSPACE
         ------------------------------------------------------- */

      setWorkspace: (
        workspace,
      ) => {
        set({
          workspace,
        });
      },

      /* -------------------------------------------------------
         MEMBERS
         ------------------------------------------------------- */

      setMembers: (
        members,
      ) => {
        set({
          members,
        });
      },

      addMember: (
        member,
      ) => {
        set((state) => ({
          members: [
            ...state.members,
            member,
          ],
        }));
      },

      updateMember: (
        memberId,
        data,
      ) => {
        set((state) => ({
          members:
            state.members.map(
              (member) =>
                member.id ===
                memberId
                  ? {
                      ...member,
                      ...data,
                    }
                  : member,
            ),
        }));
      },

      removeMember: (
        memberId,
      ) => {
        set((state) => ({
          members:
            state.members.filter(
              (member) =>
                member.id !==
                memberId,
            ),
        }));
      },

      /* -------------------------------------------------------
         STATUS
         ------------------------------------------------------- */

      setLoading: (
        value,
      ) => {
        set({
          isLoading: value,
        });
      },

      setError: (
        error,
      ) => {
        set({
          error,
        });
      },

      /* -------------------------------------------------------
         CLEAR
         ------------------------------------------------------- */

      clearWorkspace: () => {
        set({
          workspace: null,
          members: [],
          isLoading: false,
          error: null,
        });
      },
    }),
  );