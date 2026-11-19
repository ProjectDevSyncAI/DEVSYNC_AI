import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import {
  chatApi,
  getAccessToken,
  type ChatChannel,
  type ChatMessageItem,
  type CreateChannelPayload,
} from "../lib/api.js";
import { SOCKET_URL } from "../lib/constants.js";

/* =========================================================
   DEVSync AI — CHAT STORE
   ========================================================= */

export interface ChatState {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  messages: ChatMessageItem[];
  currentProjectId: string | null;

  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  error: string | null;
  isConnected: boolean;
  typingUsers: Record<string, string | null>; // channelId -> typing username

  socket: Socket | null;

  // Actions
  setProjectId: (projectId: string | null) => void;
  fetchChannels: (projectId?: string) => Promise<void>;
  selectChannel: (channel: ChatChannel | string) => Promise<void>;
  createChannel: (payload: { name: string; isPrivate?: boolean; type?: string }) => Promise<ChatChannel>;
  deleteChannel: (channelId: string) => Promise<void>;

  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (content: string, currentUser?: { id?: string; firstName?: string | null; lastName?: string | null; username?: string; avatarUrl?: string | null }) => Promise<ChatMessageItem | null>;
  editMessage: (messageId: string, content: string) => Promise<ChatMessageItem>;
  deleteMessage: (messageId: string) => Promise<void>;

  receiveMessage: (message: ChatMessageItem) => void;
  sendTyping: () => void;
  setTypingUser: (channelId: string, username: string | null) => void;

  initSocket: () => Socket | null;
  disconnectSocket: () => void;
  clearChatState: () => void;
  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected chat error occurred.";
}

export const useChatStore = create<ChatState>((set, get) => {
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    channels: [],
    activeChannel: null,
    messages: [],
    currentProjectId: null,

    isLoadingChannels: false,
    isLoadingMessages: false,
    isSending: false,

    error: null,
    isConnected: false,
    typingUsers: {},
    socket: null,

    /* -------------------------------------------------------
       setProjectId: Switch project context with stale clearing
       ------------------------------------------------------- */
    setProjectId: (projectId: string | null) => {
      const current = get().currentProjectId;
      if (current === projectId) {
        return;
      }

      // Leave old channel if socket connected
      const socket = get().socket;
      const activeChannel = get().activeChannel;
      if (socket?.connected && activeChannel) {
        socket.emit("leave-channel", activeChannel.id);
      }

      set({
        currentProjectId: projectId,
        channels: [],
        activeChannel: null,
        messages: [],
        typingUsers: {},
        error: null,
      });

      if (projectId) {
        get().fetchChannels(projectId);
      }
    },

    /* -------------------------------------------------------
       fetchChannels: Retrieve permitted channels for project
       ------------------------------------------------------- */
    fetchChannels: async (projectId?: string) => {
      const targetProjectId = projectId ?? get().currentProjectId;
      if (!targetProjectId) {
        set({ channels: [], activeChannel: null });
        return;
      }

      set({ isLoadingChannels: true, error: null });

      try {
        const channels = await chatApi.getProjectChannels(targetProjectId);
        const list = Array.isArray(channels) ? channels : [];

        set({
          channels: list,
          isLoadingChannels: false,
        });

        // If no active channel, select the first available channel
        const currentActive = get().activeChannel;
        if (!currentActive || !list.some((c) => c.id === currentActive.id)) {
          if (list.length > 0) {
            get().selectChannel(list[0]);
          } else {
            set({ activeChannel: null, messages: [] });
          }
        }
      } catch (err) {
        set({
          isLoadingChannels: false,
          error: getErrorMessage(err),
          channels: [],
          activeChannel: null,
          messages: [],
        });
      }
    },

    /* -------------------------------------------------------
       selectChannel: Switch active channel with stale clearing
       ------------------------------------------------------- */
    selectChannel: async (channelOrId: ChatChannel | string) => {
      const channels = get().channels;
      const targetChannel =
        typeof channelOrId === "string"
          ? channels.find((c) => c.id === channelOrId) || {
              id: channelOrId,
              name: "channel",
              type: "PROJECT",
              isPrivate: false,
              createdAt: new Date().toISOString(),
            }
          : channelOrId;

      const currentActive = get().activeChannel;
      if (currentActive?.id === targetChannel.id) {
        return;
      }

      const socket = get().socket;

      // Clean up previous room subscription
      if (socket?.connected && currentActive) {
        socket.emit("leave-channel", currentActive.id);
      }

      // Immediate stale message clearing
      set({
        activeChannel: targetChannel,
        messages: [],
        error: null,
      });

      // Join new room on socket
      if (socket?.connected) {
        socket.emit("join-channel", targetChannel.id);
      }

      // Fetch history for new channel
      await get().fetchMessages(targetChannel.id);
    },

    /* -------------------------------------------------------
       createChannel: Create channel and add to state
       ------------------------------------------------------- */
    createChannel: async (payload: { name: string; isPrivate?: boolean; type?: string }) => {
      const projectId = get().currentProjectId;
      set({ error: null });

      try {
        const createPayload: CreateChannelPayload = {
          ...payload,
          projectId: projectId ?? undefined,
        };

        const newChannel = await chatApi.createChannel(createPayload);

        set((state) => ({
          channels: [...state.channels, newChannel],
        }));

        await get().selectChannel(newChannel);

        return newChannel;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        set({ error: errorMsg });
        throw err;
      }
    },

    /* -------------------------------------------------------
       deleteChannel: Delete channel and re-select
       ------------------------------------------------------- */
    deleteChannel: async (channelId: string) => {
      set({ error: null });

      try {
        await chatApi.deleteChannel(channelId);

        set((state) => {
          const remaining = state.channels.filter((c) => c.id !== channelId);
          return {
            channels: remaining,
          };
        });

        const active = get().activeChannel;
        if (active?.id === channelId) {
          const remaining = get().channels;
          if (remaining.length > 0) {
            get().selectChannel(remaining[0]);
          } else {
            set({ activeChannel: null, messages: [] });
          }
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        set({ error: errorMsg });
        throw err;
      }
    },

    /* -------------------------------------------------------
       fetchMessages: Retrieve message history for active channel
       ------------------------------------------------------- */
    fetchMessages: async (channelId: string) => {
      set({ isLoadingMessages: true, error: null });

      try {
        const history = await chatApi.getMessages(channelId);
        const list = Array.isArray(history) ? history : [];

        // Only update if still on the same active channel
        if (get().activeChannel?.id === channelId) {
          set({
            messages: list,
            isLoadingMessages: false,
          });
        }
      } catch (err) {
        if (get().activeChannel?.id === channelId) {
          set({
            isLoadingMessages: false,
            error: getErrorMessage(err),
            messages: [],
          });
        }
      }
    },

    /* -------------------------------------------------------
       sendMessage: Optimistic sending with reliable rollback
       ------------------------------------------------------- */
    sendMessage: async (content: string, currentUser?: { id?: string; firstName?: string | null; lastName?: string | null; username?: string; avatarUrl?: string | null }) => {
      const activeChannel = get().activeChannel;
      if (!activeChannel) {
        set({ error: "No active channel selected" });
        return null;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        return null;
      }

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const optimisticMsg: ChatMessageItem = {
        id: tempId,
        channelId: activeChannel.id,
        content: trimmed,
        type: "TEXT",
        createdAt: new Date().toISOString(),
        sender: currentUser
          ? {
              id: currentUser.id ?? "user",
              firstName: currentUser.firstName ?? null,
              lastName: currentUser.lastName ?? null,
              username: currentUser.username ?? "user",
              avatarUrl: currentUser.avatarUrl ?? null,
            }
          : null,
      };

      // Optimistic append
      set((state) => ({
        messages: [...state.messages, optimisticMsg],
        isSending: true,
        error: null,
      }));

      const socket = get().socket;

      try {
        let sentMessage: ChatMessageItem;

        if (socket?.connected) {
          // Send via WebSocket with promise acknowledgement
          sentMessage = await new Promise<ChatMessageItem>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Socket message send timeout"));
            }, 6000);

            socket.emit(
              "send-message",
              {
                channelId: activeChannel.id,
                content: trimmed,
              },
              (response: any) => {
                clearTimeout(timeout);
                if (response?.error) {
                  reject(new Error(response.error));
                } else if (response?.id) {
                  resolve(response);
                } else {
                  // If gateway did not return ack payload, fallback to optimistic
                  resolve({
                    ...optimisticMsg,
                    id: `msg-${Date.now()}`,
                  });
                }
              },
            );
          });
        } else {
          // Fallback to REST API when socket not connected
          sentMessage = await chatApi.sendMessage({
            channelId: activeChannel.id,
            content: trimmed,
          });
        }

        // Replace optimistic placeholder with real confirmed message
        set((state) => ({
          isSending: false,
          messages: state.messages.map((m) =>
            m.id === tempId ? sentMessage : m,
          ),
        }));

        return sentMessage;
      } catch (err) {
        // Roll back optimistic message on failure
        set((state) => ({
          isSending: false,
          messages: state.messages.filter((m) => m.id !== tempId),
          error: getErrorMessage(err),
        }));
        throw err;
      }
    },

    /* -------------------------------------------------------
       editMessage: Edit message content
       ------------------------------------------------------- */
    editMessage: async (messageId: string, content: string) => {
      const activeChannel = get().activeChannel;
      set({ error: null });

      try {
        const updated = await chatApi.editMessage(
          messageId,
          content,
          activeChannel?.id,
        );

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, content: updated.content } : m,
          ),
        }));

        return updated;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        set({ error: errorMsg });
        throw err;
      }
    },

    /* -------------------------------------------------------
       deleteMessage: Soft-delete message
       ------------------------------------------------------- */
    deleteMessage: async (messageId: string) => {
      const activeChannel = get().activeChannel;
      set({ error: null });

      try {
        await chatApi.deleteMessage(messageId, activeChannel?.id);

        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        }));
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        set({ error: errorMsg });
        throw err;
      }
    },

    /* -------------------------------------------------------
       receiveMessage: Handle incoming Socket.IO message
       ------------------------------------------------------- */
    receiveMessage: (message: ChatMessageItem) => {
      const activeChannel = get().activeChannel;
      if (!message?.channelId || activeChannel?.id !== message.channelId) {
        return;
      }

      set((state) => {
        // Prevent duplicate messages
        if (state.messages.some((m) => m.id === message.id)) {
          return state;
        }

        // If there's an optimistic message with matching content and channel, replace it
        const optimisticIndex = state.messages.findIndex(
          (m) =>
            m.id.startsWith("optimistic-") &&
            m.channelId === message.channelId &&
            m.content === message.content,
        );

        if (optimisticIndex >= 0) {
          const updated = [...state.messages];
          updated[optimisticIndex] = message;
          return { messages: updated };
        }

        return {
          messages: [...state.messages, message],
        };
      });
    },

    /* -------------------------------------------------------
       sendTyping: Emit typing indicator
       ------------------------------------------------------- */
    sendTyping: () => {
      const socket = get().socket;
      const activeChannel = get().activeChannel;
      if (socket?.connected && activeChannel) {
        socket.emit("typing", { channelId: activeChannel.id });
      }
    },

    /* -------------------------------------------------------
       setTypingUser: Update typing indicator with auto-clear
       ------------------------------------------------------- */
    setTypingUser: (channelId: string, username: string | null) => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [channelId]: username,
        },
      }));

      if (username) {
        typingTimeout = setTimeout(() => {
          set((state) => ({
            typingUsers: {
              ...state.typingUsers,
              [channelId]: null,
            },
          }));
        }, 3000);
      }
    },

    /* -------------------------------------------------------
       initSocket: Establish authenticated Socket.IO connection
       ------------------------------------------------------- */
    initSocket: () => {
      const existing = get().socket;
      if (existing?.connected) {
        return existing;
      }

      const token = getAccessToken();
      if (!token) {
        set({ isConnected: false, socket: null });
        return null;
      }

      // Remove existing listeners if socket exists
      if (existing) {
        existing.removeAllListeners();
        existing.disconnect();
      }

      const chatSocketUrl = `${SOCKET_URL}/chat`;
      const socket = io(chatSocketUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token,
        },
      });

      socket.on("connect", () => {
        set({ isConnected: true });

        // Re-join active channel on reconnect
        const active = get().activeChannel;
        if (active?.id) {
          socket.emit("join-channel", active.id);
        }
      });

      socket.on("disconnect", () => {
        set({ isConnected: false });
      });

      socket.on("new-message", (message: ChatMessageItem) => {
        get().receiveMessage(message);
      });

      socket.on("user-typing", (data: { channelId: string; username: string }) => {
        if (data?.channelId && data?.username) {
          get().setTypingUser(data.channelId, data.username);
        }
      });

      set({ socket });
      return socket;
    },

    /* -------------------------------------------------------
       disconnectSocket: Clean up socket connection
       ------------------------------------------------------- */
    disconnectSocket: () => {
      const socket = get().socket;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      set({ socket: null, isConnected: false });
    },

    /* -------------------------------------------------------
       clearChatState: Clear all data on project switch or logout
       ------------------------------------------------------- */
    clearChatState: () => {
      get().disconnectSocket();

      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }

      set({
        channels: [],
        activeChannel: null,
        messages: [],
        currentProjectId: null,
        isLoadingChannels: false,
        isLoadingMessages: false,
        isSending: false,
        error: null,
        isConnected: false,
        typingUsers: {},
        socket: null,
      });
    },

    clearError: () => set({ error: null }),
  };
});
