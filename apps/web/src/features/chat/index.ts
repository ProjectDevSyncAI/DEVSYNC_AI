export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  metadata?: {
    projectId?: string;
    taskId?: string;
    codeLanguage?: string;
    sources?: string[];
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  projectId?: string;
  context?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
}

export function createChatMessage(
  role: ChatRole,
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function createConversation(title = "New conversation"): ChatConversation {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}