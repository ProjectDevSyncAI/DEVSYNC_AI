import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./constants";

/* =========================================================
   DEVSync AI — REAL-TIME SOCKET CLIENT
   ========================================================= */

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface SocketUser {
  id: string;
  name?: string;
  email?: string;
}

export interface SocketProject {
  id: string;
  name?: string;
}

export interface TaskUpdatedEvent {
  taskId: string;
  projectId?: string;
  action:
    | "created"
    | "updated"
    | "deleted"
    | "status_changed"
    | "assigned";

  task?: unknown;
  updatedBy?: SocketUser;
  timestamp?: string;
}

export interface ProjectUpdatedEvent {
  projectId: string;
  action:
    | "created"
    | "updated"
    | "deleted";

  project?: SocketProject;
  updatedBy?: SocketUser;
  timestamp?: string;
}

export interface NotificationEvent {
  id?: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  taskId?: string;
  timestamp?: string;
}

export interface PresenceEvent {
  userId: string;
  projectId?: string;
  status: "online" | "offline" | "away";
  user?: SocketUser;
  timestamp?: string;
}

export interface ActivityEvent {
  id?: string;
  projectId?: string;
  userId?: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

/* =========================================================
   EVENT MAP
   ========================================================= */

export interface DevSyncSocketEvents {
  "task:created": (event: TaskUpdatedEvent) => void;
  "task:updated": (event: TaskUpdatedEvent) => void;
  "task:deleted": (event: TaskUpdatedEvent) => void;
  "task:status-changed": (event: TaskUpdatedEvent) => void;
  "task:assigned": (event: TaskUpdatedEvent) => void;

  "project:updated": (event: ProjectUpdatedEvent) => void;

  notification: (event: NotificationEvent) => void;

  "presence:changed": (event: PresenceEvent) => void;

  activity: (event: ActivityEvent) => void;

  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

/* =========================================================
   AUTH TOKEN
   ========================================================= */

const ACCESS_TOKEN_KEY = "devsync_access_token";

function getToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/* =========================================================
   SOCKET MANAGER
   ========================================================= */

class DevSyncSocketManager {
  private socket: Socket | null = null;

  private status: SocketStatus = "idle";

  private listeners = new Set<
    (status: SocketStatus) => void
  >();

  private reconnectAttempts = 0;

  private readonly maxReconnectAttempts = 8;

  /* -------------------------------------------------------
     Status
     ------------------------------------------------------- */

  getStatus(): SocketStatus {
    return this.status;
  }

  subscribeStatus(
    listener: (status: SocketStatus) => void,
  ): () => void {
    this.listeners.add(listener);

    listener(this.status);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: SocketStatus) {
    this.status = status;

    this.listeners.forEach((listener) => {
      listener(status);
    });
  }

  /* -------------------------------------------------------
     Connect
     ------------------------------------------------------- */

  connect(): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getToken();

    if (!token) {
      this.setStatus("idle");
      return null;
    }

    this.setStatus("connecting");

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],

      autoConnect: false,

      auth: {
        token,
      },

      reconnection: true,

      reconnectionAttempts:
        this.maxReconnectAttempts,

      reconnectionDelay: 1000,

      reconnectionDelayMax: 10000,

      timeout: 10000,

      withCredentials: true,
    });

    this.registerCoreEvents();

    this.socket.connect();

    return this.socket;
  }

  /* -------------------------------------------------------
     Core events
     ------------------------------------------------------- */

  private registerCoreEvents() {
    if (!this.socket) {
      return;
    }

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;

      this.setStatus("connected");
    });

    this.socket.on(
      "disconnect",
      (reason: string) => {
        this.setStatus("disconnected");

        if (
          reason ===
          "io server disconnect"
        ) {
          this.socket?.connect();
        }
      },
    );

    this.socket.on(
      "connect_error",
      () => {
        this.reconnectAttempts += 1;

        this.setStatus("error");
      },
    );
  }

  /* -------------------------------------------------------
     Disconnect
     ------------------------------------------------------- */

  disconnect() {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();

    this.socket.disconnect();

    this.socket = null;

    this.reconnectAttempts = 0;

    this.setStatus("disconnected");
  }

  /* -------------------------------------------------------
     Re-authenticate
     ------------------------------------------------------- */

  refreshAuth() {
    const token = getToken();

    if (!token || !this.socket) {
      return;
    }

    this.socket.auth = {
      token,
    };

    if (this.socket.connected) {
      this.socket.disconnect();

      this.socket.connect();
    }
  }

  /* -------------------------------------------------------
     Join project room
     ------------------------------------------------------- */

  joinProject(projectId: string) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(
      "project:join",
      {
        projectId,
      },
    );
  }

  /* -------------------------------------------------------
     Leave project room
     ------------------------------------------------------- */

  leaveProject(projectId: string) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(
      "project:leave",
      {
        projectId,
      },
    );
  }

  /* -------------------------------------------------------
     Generic emit
     ------------------------------------------------------- */

  emit<T = unknown>(
    event: string,
    payload?: T,
  ) {
    if (!this.socket?.connected) {
      return false;
    }

    this.socket.emit(
      event,
      payload,
    );

    return true;
  }

  /* -------------------------------------------------------
     Generic listener
     ------------------------------------------------------- */

  on<K extends keyof DevSyncSocketEvents>(
    event: K,
    listener: DevSyncSocketEvents[K],
  ) {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on(
      event as string,
      listener as (...args: any[]) => void,
    );

    return () => {
      this.socket?.off(
        event as string,
        listener as (...args: any[]) => void,
      );
    };
  }

  /* -------------------------------------------------------
     Remove listener
     ------------------------------------------------------- */

  off<K extends keyof DevSyncSocketEvents>(
    event: K,
    listener: DevSyncSocketEvents[K],
  ) {
    this.socket?.off(
      event as string,
      listener as (...args: any[]) => void,
    );
  }

  /* -------------------------------------------------------
     Get raw socket
     ------------------------------------------------------- */

  getSocket(): Socket | null {
    return this.socket;
  }
}

/* =========================================================
   SINGLETON
   ========================================================= */

export const socketManager =
  new DevSyncSocketManager();

/* =========================================================
   CONVENIENCE FUNCTIONS
   ========================================================= */

export function connectSocket() {
  return socketManager.connect();
}

export function disconnectSocket() {
  socketManager.disconnect();
}

export function joinProject(
  projectId: string,
) {
  socketManager.joinProject(projectId);
}

export function leaveProject(
  projectId: string,
) {
  socketManager.leaveProject(projectId);
}

export function getSocketStatus() {
  return socketManager.getStatus();
}

export function subscribeSocketStatus(
  listener: (status: SocketStatus) => void,
) {
  return socketManager.subscribeStatus(listener);
}

/* =========================================================
   EVENT HELPERS
   ========================================================= */

export function onTaskCreated(
  listener: (
    event: TaskUpdatedEvent,
  ) => void,
) {
  return socketManager.on(
    "task:created",
    listener,
  );
}

export function onTaskUpdated(
  listener: (
    event: TaskUpdatedEvent,
  ) => void,
) {
  return socketManager.on(
    "task:updated",
    listener,
  );
}

export function onTaskDeleted(
  listener: (
    event: TaskUpdatedEvent,
  ) => void,
) {
  return socketManager.on(
    "task:deleted",
    listener,
  );
}

export function onTaskStatusChanged(
  listener: (
    event: TaskUpdatedEvent,
  ) => void,
) {
  return socketManager.on(
    "task:status-changed",
    listener,
  );
}

export function onNotification(
  listener: (
    event: NotificationEvent,
  ) => void,
) {
  return socketManager.on(
    "notification",
    listener,
  );
}

export function onPresenceChanged(
  listener: (
    event: PresenceEvent,
  ) => void,
) {
  return socketManager.on(
    "presence:changed",
    listener,
  );
}

export function onActivity(
  listener: (
    event: ActivityEvent,
  ) => void,
) {
  return socketManager.on(
    "activity",
    listener,
  );
}

/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default socketManager;