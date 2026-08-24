import type {
  AIChatRequest,
  AIChatResponse,
  AIConversation,
} from "./types";

function createMessage(
  role: "user" | "assistant" | "system",
  content: string,
) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function createAIConversation(
  title = "New AI Conversation",
): AIConversation {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function prepareAIRequest(
  request: AIChatRequest,
): AIChatRequest {
  return {
    ...request,
    message: request.message.trim(),
    context: request.context?.trim(),
  };
}

export function generateLocalAIResponse(
  request: AIChatRequest,
): AIChatResponse {
  const conversationId =
    request.conversationId ?? crypto.randomUUID();

  const content =
    "Your request has been received. Connect the AI API service to generate a model-powered response.";

  return {
    conversationId,
    message: createMessage("assistant", content),
    suggestions: [
      "Analyze this task",
      "Find potential risks",
      "Generate implementation steps",
      "Create acceptance criteria",
    ],
  };
}

export function buildProjectContext(
  projectName: string,
  projectDescription?: string,
): string {
  return [
    `Project: ${projectName}`,
    projectDescription
      ? `Description: ${projectDescription}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}