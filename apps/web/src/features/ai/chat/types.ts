export type AIMessageRole = "user" | "assistant" | "system";

export interface AIChatMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
}

export interface AIChatRequest {
  message: string;
  conversationId?: string;
  projectId?: string;
  taskId?: string;
  context?: string;
}

export interface AIChatResponse {
  conversationId: string;
  message: AIChatMessage;
  suggestions: string[];
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}