import React, { useEffect, useRef, useState } from "react";
import {
  Hash,
  Send,
  Sparkles,
  Users,
  Search,
  MessageSquare,
  Bot,
  Circle,
  Plus,
  RefreshCw,
  AlertCircle,
  Lock,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { aiApi, type ChatMessageItem } from "../lib/api.js";
import { useChatStore } from "../store/chat.store.js";
import { useProjectStore } from "../store/project.store.js";
import { useAuthStore } from "../store/auth.store.js";

export default function Chat() {
  const user = useAuthStore((state) => state.user);
  const activeProject = useProjectStore((state) => state.activeProject);

  const {
    channels,
    activeChannel,
    messages,
    isLoadingChannels,
    isLoadingMessages,
    isSending,
    error,
    isConnected,
    typingUsers,
    setProjectId,
    fetchChannels,
    selectChannel,
    createChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    initSocket,
    clearError,
  } = useChatStore();

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState("");

  // Create Channel Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [createChannelError, setCreateChannelError] = useState<string | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Edit Message inline state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Sync project context with Chat store
  useEffect(() => {
    const projectId = activeProject?.id ?? null;
    setProjectId(projectId);
  }, [activeProject?.id, setProjectId]);

  // 2. Initialize Socket.IO connection
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // 3. Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiStreamingText]);

  // 4. Typing handler
  function handleTypingChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMessageText(e.target.value);
    sendTyping();
  }

  // 5. Send message handler
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeChannel) return;

    setMessageText("");

    // Check if message is addressing the AI bot
    const isAiQuery =
      text.startsWith("@devsync") ||
      text.startsWith("/ai") ||
      activeChannel.name.toLowerCase().includes("ai");

    try {
      await sendMessage(text, user ?? undefined);
    } catch (err) {
      console.warn("Error sending message:", err);
    }

    // Trigger AI response if directed to AI bot
    if (isAiQuery && activeProject?.id) {
      const cleanPrompt = text
        .replace(/^@devsync\s*/i, "")
        .replace(/^\/ai\s*/i, "")
        .trim();

      setIsAiAnswering(true);
      setAiStreamingText("");

      let streamedText = "";
      aiApi.askStream(
        activeProject.id,
        cleanPrompt || "Summarize current project status and active tasks",
        (token) => {
          streamedText += token;
          setAiStreamingText(streamedText);
        },
        () => {
          setIsAiAnswering(false);
          setAiStreamingText("");
        },
        async () => {
          try {
            const aiResponse = await aiApi.ask(
              activeProject.id,
              cleanPrompt || "Summarize current project status and active tasks",
            );
            if (aiResponse?.answer) {
              await sendMessage(`[DevSync AI]: ${aiResponse.answer}`);
            }
          } catch {
            // Non-critical AI fallback error
          } finally {
            setIsAiAnswering(false);
            setAiStreamingText("");
          }
        },
      );
    }
  }

  // 6. Channel creation handler
  async function handleCreateChannelSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = newChannelName.trim();
    if (!name) {
      setCreateChannelError("Channel name cannot be empty");
      return;
    }

    setIsCreatingChannel(true);
    setCreateChannelError(null);

    try {
      await createChannel({
        name,
        isPrivate: newChannelIsPrivate,
      });

      setIsCreateModalOpen(false);
      setNewChannelName("");
      setNewChannelIsPrivate(false);
    } catch (err: any) {
      setCreateChannelError(err?.message || "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  }

  // 7. Message edit handler
  async function handleSaveEdit(messageId: string) {
    if (!editContent.trim()) return;

    try {
      await editMessage(messageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  }

  // 8. Message delete handler
  async function handleDeleteMessage(messageId: string) {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }

  function triggerAiQuickPrompt(promptText: string) {
    setMessageText(`@devsync ${promptText}`);
  }

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentTypingUser = activeChannel ? typingUsers[activeChannel.id] : null;

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-slate-800 bg-[#0d121f] text-slate-100 overflow-hidden shadow-2xl relative">
      {/* Channel Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#090d16] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm tracking-tight text-white">
              {activeProject?.name ? `${activeProject.name} Chat` : "Project Channels"}
            </span>
          </div>
          <button
            onClick={() => {
              setCreateChannelError(null);
              setIsCreateModalOpen(true);
            }}
            title="Create Channel"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Channel Search */}
        <div className="p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a channel..."
              className="w-full rounded-lg bg-slate-900 border border-slate-800 py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Channels
          </div>

          {isLoadingChannels ? (
            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
              <RefreshCw size={14} className="animate-spin text-indigo-400" />
              <span>Loading channels...</span>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500">No channels found.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 text-[11px] text-indigo-400 hover:underline"
              >
                + Create a channel
              </button>
            </div>
          ) : (
            filteredChannels.map((chan) => {
              const isActive = activeChannel?.id === chan.id;
              return (
                <button
                  key={chan.id}
                  onClick={() => selectChannel(chan)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {chan.isPrivate ? (
                      <Lock size={13} className={isActive ? "text-indigo-400" : "text-slate-500"} />
                    ) : (
                      <Hash size={14} className={isActive ? "text-indigo-400" : "text-slate-500"} />
                    )}
                    <span className="truncate">{chan.name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Active User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
            </div>
            <Circle
              size={8}
              className={`absolute -bottom-0.5 -right-0.5 ${
                isConnected ? "fill-emerald-500 text-emerald-500" : "fill-amber-500 text-amber-500"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate">
              {user?.name || user?.email || "Authenticated User"}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className={isConnected ? "text-emerald-400" : "text-amber-400"}>
                {isConnected ? "Connected" : "Offline / REST Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b0f19]">
        {/* Channel Header */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            {activeChannel?.isPrivate ? (
              <Lock size={18} className="text-indigo-400" />
            ) : (
              <Hash size={20} className="text-indigo-400" />
            )}
            <h2 className="text-base font-semibold text-white tracking-tight">
              {activeChannel?.name ?? "Select a Channel"}
            </h2>
            {activeChannel?.isPrivate && (
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium ml-2">
                Private Channel
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
              <Circle
                size={7}
                className={isConnected ? "fill-emerald-500 text-emerald-500" : "fill-amber-500 text-amber-500"}
              />
              <span>{isConnected ? "Socket Live" : "REST Sync"}</span>
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="bg-red-950/40 border-b border-red-800/50 px-6 py-2.5 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => activeProject?.id && fetchChannels(activeProject.id)}
                className="underline text-red-300 hover:text-white"
              >
                Retry
              </button>
              <button onClick={clearError} className="text-red-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* AI Quick Prompt Suggestions Bar */}
        <div className="bg-indigo-950/20 border-b border-indigo-900/30 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold shrink-0">
            <Sparkles size={14} />
            <span>AI Quick Prompts:</span>
          </div>
          <button
            onClick={() => triggerAiQuickPrompt("Summarize active sprint and task priorities")}
            className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 transition whitespace-nowrap"
          >
            "Summarize active sprint & tasks"
          </button>
          <button
            onClick={() => triggerAiQuickPrompt("What are the critical open bugs in this project?")}
            className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 transition whitespace-nowrap"
          >
            "List critical open bugs"
          </button>
          <button
            onClick={() => triggerAiQuickPrompt("Generate a team standup status report")}
            className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 transition whitespace-nowrap"
          >
            "Generate team standup"
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
              <RefreshCw size={18} className="animate-spin text-indigo-400" />
              <span className="text-sm">Loading message history...</span>
            </div>
          ) : !activeChannel ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <MessageSquare size={36} className="text-slate-600" />
              <p className="text-sm">No channel selected.</p>
              <p className="text-xs text-slate-600">Select a channel from the left sidebar to start chatting.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <MessageSquare size={36} className="text-slate-600" />
              <p className="text-sm">No messages in #{activeChannel.name} yet.</p>
              <p className="text-xs text-slate-600">Send the first message or ask @devsync a question!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAi = msg.type === "AI_RESPONSE" || msg.sender?.username === "devsync-ai";
              const isAuthor = user?.id && msg.senderId === user.id;
              const isOptimistic = msg.id.startsWith("optimistic-");
              const isEditing = editingMessageId === msg.id;

              const senderName = msg.sender
                ? `${msg.sender.firstName ?? ""} ${msg.sender.lastName ?? ""}`.trim() || msg.sender.username
                : "Developer";

              return (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-3.5 p-3 rounded-2xl transition ${
                    isAi
                      ? "bg-indigo-950/30 border border-indigo-800/40 shadow-sm"
                      : "hover:bg-slate-900/50"
                  } ${isOptimistic ? "opacity-70" : ""}`}
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isAi
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-slate-800 text-indigo-300 border border-slate-700"
                    }`}
                  >
                    {isAi ? <Bot size={18} /> : senderName[0]?.toUpperCase() ?? "U"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isAi ? "text-indigo-400" : "text-white"}`}>
                          {senderName}
                        </span>
                        {isAi && (
                          <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-medium border border-indigo-500/30">
                            AI ASSISTANT
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isOptimistic && (
                          <span className="text-[9px] text-indigo-400 italic">Sending...</span>
                        )}
                      </div>

                      {/* Message Actions (Edit / Delete) */}
                      {!isOptimistic && !isEditing && isAuthor && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }}
                            title="Edit Message"
                            className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-slate-800 transition"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete Message"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-lg bg-slate-900 border border-indigo-500/50 p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={!editContent.trim()}
                            className="flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-medium text-white transition disabled:opacity-50"
                          >
                            <Check size={12} />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent("");
                            }}
                            className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Streaming preview */}
          {isAiAnswering && (
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 animate-pulse">
              <Bot size={18} className="text-indigo-400 animate-spin shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300">
                {aiStreamingText || "DevSync AI is analyzing project context..."}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {currentTypingUser && (
          <div className="px-6 py-1 text-[11px] text-indigo-400 italic">
            {currentTypingUser} is typing...
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16]">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={handleTypingChange}
              disabled={!activeChannel || isSending}
              placeholder={
                activeChannel
                  ? `Message #${activeChannel.name} or ask @devsync...`
                  : "Select a channel to send messages"
              }
              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 py-3 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || !activeChannel || isSending}
              className="absolute right-2 top-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
            >
              {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
          <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Press Enter to send. Type <strong>@devsync</strong> to query AI intelligence.</span>
            <span className="flex items-center gap-1">
              <Circle
                size={6}
                className={isConnected ? "fill-emerald-500 text-emerald-500" : "fill-amber-500 text-amber-500"}
              />
              {isConnected ? "WebSocket Live" : "REST Fallback"}
            </span>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Create Channel</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {createChannelError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-200">
                {createChannelError}
              </div>
            )}

            <form onSubmit={handleCreateChannelSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) =>
                      setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                    }
                    placeholder="e.g. backend-discussions"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Lock size={12} className="text-indigo-400" />
                    Make Private
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Only members can view and post in this channel
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newChannelIsPrivate}
                  onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim() || isCreatingChannel}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition disabled:opacity-50"
                >
                  {isCreatingChannel ? "Creating..." : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
