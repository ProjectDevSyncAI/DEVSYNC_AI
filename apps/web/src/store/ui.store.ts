import { create } from "zustand";

/* =========================================================
   DEVSync AI — UI STORE
   ========================================================= */

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

export type ModalType =
  | "create-project"
  | "create-task"
  | "edit-task"
  | "edit-project"
  | "delete-confirmation"
  | "ai-assistant"
  | "none";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info";
  duration?: number;
}

/* =========================================================
   STATE
   ========================================================= */

interface UIState {
  sidebarCollapsed: boolean;

  mobileMenuOpen: boolean;

  commandPaletteOpen: boolean;

  searchOpen: boolean;

  notificationsOpen: boolean;

  activeModal: ModalType;

  modalData: unknown;

  theme: ThemeMode;

  toasts: Toast[];

  setSidebarCollapsed: (
    value: boolean,
  ) => void;

  toggleSidebar: () => void;

  setMobileMenuOpen: (
    value: boolean,
  ) => void;

  toggleMobileMenu: () => void;

  setCommandPaletteOpen: (
    value: boolean,
  ) => void;

  toggleCommandPalette: () => void;

  setSearchOpen: (
    value: boolean,
  ) => void;

  toggleSearch: () => void;

  setNotificationsOpen: (
    value: boolean,
  ) => void;

  toggleNotifications: () => void;

  openModal: (
    type: ModalType,
    data?: unknown,
  ) => void;

  closeModal: () => void;

  setTheme: (
    theme: ThemeMode,
  ) => void;

  addToast: (
    toast: Omit<Toast, "id">,
  ) => string;

  removeToast: (
    id: string,
  ) => void;

  clearToasts: () => void;
}

/* =========================================================
   ID
   ========================================================= */

function createToastId(): string {
  return `toast_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* =========================================================
   STORE
   ========================================================= */

export const useUIStore =
  create<UIState>((set) => ({
    sidebarCollapsed: false,

    mobileMenuOpen: false,

    commandPaletteOpen: false,

    searchOpen: false,

    notificationsOpen: false,

    activeModal: "none",

    modalData: null,

    theme: "system",

    toasts: [],

    /* -------------------------------------------------------
       SIDEBAR
       ------------------------------------------------------- */

    setSidebarCollapsed: (
      value,
    ) => {
      set({
        sidebarCollapsed: value,
      });
    },

    toggleSidebar: () => {
      set((state) => ({
        sidebarCollapsed:
          !state.sidebarCollapsed,
      }));
    },

    /* -------------------------------------------------------
       MOBILE MENU
       ------------------------------------------------------- */

    setMobileMenuOpen: (
      value,
    ) => {
      set({
        mobileMenuOpen: value,
      });
    },

    toggleMobileMenu: () => {
      set((state) => ({
        mobileMenuOpen:
          !state.mobileMenuOpen,
      }));
    },

    /* -------------------------------------------------------
       COMMAND PALETTE
       ------------------------------------------------------- */

    setCommandPaletteOpen: (
      value,
    ) => {
      set({
        commandPaletteOpen: value,
      });
    },

    toggleCommandPalette: () => {
      set((state) => ({
        commandPaletteOpen:
          !state.commandPaletteOpen,
      }));
    },

    /* -------------------------------------------------------
       SEARCH
       ------------------------------------------------------- */

    setSearchOpen: (value) => {
      set({
        searchOpen: value,
      });
    },

    toggleSearch: () => {
      set((state) => ({
        searchOpen:
          !state.searchOpen,
      }));
    },

    /* -------------------------------------------------------
       NOTIFICATIONS
       ------------------------------------------------------- */

    setNotificationsOpen: (
      value,
    ) => {
      set({
        notificationsOpen: value,
      });
    },

    toggleNotifications: () => {
      set((state) => ({
        notificationsOpen:
          !state.notificationsOpen,
      }));
    },

    /* -------------------------------------------------------
       MODALS
       ------------------------------------------------------- */

    openModal: (
      type,
      data = null,
    ) => {
      set({
        activeModal: type,
        modalData: data,
      });
    },

    closeModal: () => {
      set({
        activeModal: "none",
        modalData: null,
      });
    },

    /* -------------------------------------------------------
       THEME
       ------------------------------------------------------- */

    setTheme: (theme) => {
      set({
        theme,
      });
    },

    /* -------------------------------------------------------
       TOASTS
       ------------------------------------------------------- */

    addToast: (toast) => {
      const id =
        createToastId();

      const newToast: Toast = {
        ...toast,
        id,
      };

      set((state) => ({
        toasts: [
          ...state.toasts,
          newToast,
        ].slice(-5),
      }));

      if (
        toast.duration !== 0
      ) {
        setTimeout(
          () => {
            set((state) => ({
              toasts:
                state.toasts.filter(
                  (item) =>
                    item.id !== id,
                ),
            }));
          },
          toast.duration ?? 4000,
        );
      }

      return id;
    },

    removeToast: (id) => {
      set((state) => ({
        toasts:
          state.toasts.filter(
            (toast) =>
              toast.id !== id,
          ),
      }));
    },

    clearToasts: () => {
      set({
        toasts: [],
      });
    },
  }));