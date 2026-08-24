import { API_BASE_URL } from "./constants";

/* =========================================================
   DEVSync AI — API CLIENT
   Centralized, typed, production-ready HTTP layer
   ========================================================= */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

/* =========================================================
   TOKEN STORAGE
   ========================================================= */

const ACCESS_TOKEN_KEY = "devsync_access_token";

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors.
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage errors.
  }
}

/* =========================================================
   RESPONSE PARSER
   ========================================================= */

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function extractErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const data = body as ApiErrorResponse;

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

/* =========================================================
   REQUEST BUILDER
   ========================================================= */

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
    credentials = "include",
  } = options;

  const token = getAccessToken();

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      credentials,
      signal,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Unable to connect to DevSync AI server.",
      0,
      "NETWORK_ERROR",
      error,
    );
  }

  const responseBody = await parseResponseBody(response);

  /* -------------------------
     Unauthorized
     ------------------------- */

  if (response.status === 401) {
    clearAccessToken();

    window.dispatchEvent(
      new CustomEvent("devsync:unauthorized"),
    );

    throw new ApiError(
      "Your session has expired. Please log in again.",
      401,
      "UNAUTHORIZED",
      responseBody,
    );
  }

  /* -------------------------
     Other errors
     ------------------------- */

  if (!response.ok) {
    const message = extractErrorMessage(
      responseBody,
      `Request failed with status ${response.status}.`,
    );

    throw new ApiError(
      message,
      response.status,
      typeof responseBody === "object" &&
        responseBody !== null &&
        "code" in responseBody
        ? String(
            (responseBody as { code?: unknown }).code ?? "",
          )
        : undefined,
      responseBody,
    );
  }

  /* -------------------------
     Empty response
     ------------------------- */

  if (response.status === 204) {
    return undefined as T;
  }

  return responseBody as T;
}

/* =========================================================
   PUBLIC API CLIENT
   ========================================================= */

export const api = {
  get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  },

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body,
    });
  },

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};

/* =========================================================
   AUTH API
   ========================================================= */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organization?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export const authApi = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>("/auth/login", payload);
  },

  register(payload: RegisterPayload) {
    return api.post<AuthResponse>("/auth/register", payload);
  },

  me() {
    return api.get<AuthUser>("/auth/me");
  },

  logout() {
    clearAccessToken();

    return api.post<void>("/auth/logout");
  },
};

/* =========================================================
   PROJECT API
   ========================================================= */

export interface Project {
  id: string;
  name: string;
  key?: string;
  description?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectPayload {
  name: string;
  key?: string;
  description?: string;
}

export const projectApi = {
  list() {
    return api.get<Project[]>("/projects");
  },

  get(projectId: string) {
    return api.get<Project>(`/projects/${projectId}`);
  },

  create(payload: CreateProjectPayload) {
    return api.post<Project>("/projects", payload);
  },

  update(
    projectId: string,
    payload: Partial<CreateProjectPayload>,
  ) {
    return api.patch<Project>(
      `/projects/${projectId}`,
      payload,
    );
  },

  remove(projectId: string) {
    return api.delete<void>(
      `/projects/${projectId}`,
    );
  },
};

/* =========================================================
   TASK API
   ========================================================= */

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export const taskApi = {
  list(projectId?: string) {
    const query = projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

    return api.get<Task[]>(`/tasks${query}`);
  },

  get(taskId: string) {
    return api.get<Task>(`/tasks/${taskId}`);
  },

  create(payload: CreateTaskPayload) {
    return api.post<Task>("/tasks", payload);
  },

  update(
    taskId: string,
    payload: Partial<CreateTaskPayload> & {
      status?: TaskStatus;
    },
  ) {
    return api.patch<Task>(
      `/tasks/${taskId}`,
      payload,
    );
  },

  remove(taskId: string) {
    return api.delete<void>(`/tasks/${taskId}`);
  },
};

/* =========================================================
   AI / RAG API
   ========================================================= */

export interface RagSearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount?: number | null;
  metadata?: unknown;
  distance: number;
}

export interface RagSearchResponse {
  query: string;
  chunks: RagSearchResult[];
  context: string;
}

export const aiApi = {
  searchKnowledge(
    projectId: string,
    query: string,
    limit = 5,
  ) {
    return api.get<RagSearchResponse>(
      `/ai/rag/search?projectId=${encodeURIComponent(
        projectId,
      )}&query=${encodeURIComponent(
        query,
      )}&limit=${limit}`,
    );
  },

  ask(
    projectId: string,
    question: string,
  ) {
    return api.post<{
      answer: string;
      sources?: RagSearchResult[];
    }>("/ai/ask", {
      projectId,
      question,
    });
  },
};

/* =========================================================
   HEALTH CHECK
   ========================================================= */

export const healthApi = {
  check() {
    return api.get<{
      status: string;
      timestamp?: string;
      version?: string;
    }>("/health");
  },
};