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

const ACCESS_TOKEN_KEY = "devsync_auth_token";

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

<<<<<<< HEAD
export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  data: T;
  statusCode?: number;
  message?: string | string[];
}

export function unwrapEnvelope<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === "object" &&
    "success" in body &&
    (body as ApiResponseEnvelope).success === true &&
    "data" in body
  ) {
    return (body as ApiResponseEnvelope<T>).data;
  }

  return body as T;
}

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
/* =========================================================
   ERROR MESSAGE
   ========================================================= */

<<<<<<< HEAD
export function extractErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (!body) {
    return fallback;
  }

  if (typeof body === "string") {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof body !== "object") {
    return fallback;
  }

  const data = body as ApiErrorResponse & {
    errors?: unknown;
    details?: unknown;
  };

  if (Array.isArray(data.message)) {
    const filtered = data.message.filter(Boolean);
    if (filtered.length > 0) {
      return filtered.join("; ");
    }
  }

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message.trim();
  }

  if (typeof data.error === "string" && data.error.trim().length > 0) {
    return data.error.trim();
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((err) => (typeof err === "string" ? err : JSON.stringify(err)))
      .join("; ");
=======
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
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
  console.error("DevSync AI: 401 Unauthorized", {
    endpoint: normalizedEndpoint,
    method,
    response: responseBody,
    hasToken: Boolean(token),
  });

<<<<<<< HEAD
  // Only clear an existing session for protected requests.
  // A failed login must not trigger a global logout event.
  if (token && normalizedEndpoint !== "/auth/login") {
    clearAccessToken();

    window.dispatchEvent(
      new CustomEvent("devsync:unauthorized"),
    );
  }
=======
  clearAccessToken();

  window.dispatchEvent(
    new CustomEvent("devsync:unauthorized"),
  );
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

  throw new ApiError(
    extractErrorMessage(
      responseBody,
      "Authentication failed. Please log in again.",
    ),
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

<<<<<<< HEAD
  return unwrapEnvelope<T>(responseBody);
=======
  return responseBody as T;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organization?: string;
}

export interface AuthUser {
  id: string;
<<<<<<< HEAD
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  platformRole: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
=======
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
/* =========================================================
   EMAIL VERIFICATION API
   ========================================================= */

export type VerificationPurpose = "INITIAL_VERIFICATION" | "EMAIL_CHANGE";

export interface RequestEmailVerificationPayload {
  email?: string;
}

export interface RequestEmailVerificationResponse {
  success: boolean;
  message: string;
  email: string;
  purpose: VerificationPurpose;
}

export interface ResendEmailVerificationPayload {
  email: string;
}

export interface ResendEmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface ConfirmEmailVerificationPayload {
  token: string;
}

export interface ConfirmEmailVerificationResponse {
  success: boolean;
  message: string;
  purpose: VerificationPurpose;
}

export interface EmailVerificationStatusResponse {
  email: string;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  pendingEmail: string | null;
}

export const emailVerificationApi = {
  /**
   * Authenticated request for email verification (initial or email change).
   */
  requestVerification(payload?: RequestEmailVerificationPayload) {
    return api.post<RequestEmailVerificationResponse>(
      "/auth/email/verify/request",
      payload ?? {},
    );
  },

  /**
   * Public resend endpoint with anti-enumeration protection.
   */
  resendVerification(payload: ResendEmailVerificationPayload) {
    return api.post<ResendEmailVerificationResponse>(
      "/auth/email/verify/resend",
      payload,
    );
  },

  /**
   * Public token confirmation endpoint (atomically verifies and consumes token).
   */
  confirmVerification(payload: ConfirmEmailVerificationPayload) {
    return api.post<ConfirmEmailVerificationResponse>(
      "/auth/email/verify/confirm",
      payload,
    );
  },

  /**
   * Authenticated user verification status query.
   */
  getStatus() {
    return api.get<EmailVerificationStatusResponse>(
      "/auth/email/status",
    );
  },
};

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

/* =========================================================
   ORGANIZATION API
   ========================================================= */

<<<<<<< HEAD
export interface OrganizationMemberUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export type OrganizationRole = "OWNER" | "ADMIN" | "MANAGER" | "ENGINEER" | "VIEWER";
export type CanonicalOrgRole = OrganizationRole;

export interface OrganizationMemberInfo {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole | string;
  joinedAt: string;
  updatedAt?: string;
  user: OrganizationMemberUser;
}

export interface PaginatedMembers {
  items: OrganizationMemberInfo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrganizationInvitationItem {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole | string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
}

export interface OrganizationInvitationCreated {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole | string;
  createdAt: string;
  expiresAt: string;
  rawToken: string;
}

export interface PaginatedInvitations {
  items: OrganizationInvitationItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AcceptInvitationResult {
  message: string;
  organizationId: string;
  role: string;
}

export interface InvitationPreviewResult {
  organizationName: string;
  organizationSlug: string;
  role: string;
  maskedEmail: string;
}

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
<<<<<<< HEAD
  logoUrl?: string | null;
  ownerId?: string;
  role?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationWithDetails extends Organization {
  currentUserRole?: string;
  members: OrganizationMemberInfo[];
=======
  role?: string;
  joinedAt?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}

export const organizationApi = {
  list() {
    return api.get<Organization[]>("/organizations");
  },

  get(organizationId: string) {
<<<<<<< HEAD
    return api.get<OrganizationWithDetails>(
=======
    return api.get<Organization>(
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      `/organizations/${organizationId}`,
    );
  },

  create(payload: {
    name: string;
    slug: string;
    description?: string;
<<<<<<< HEAD
    logoUrl?: string;
  }) {
    return api.post<Organization>("/organizations", payload);
  },

  listMembers(
    organizationId: string,
    query?: { page?: number; limit?: number },
  ) {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    const endpoint = `/organizations/${organizationId}/members${qs ? `?${qs}` : ""}`;
    return api.get<PaginatedMembers>(endpoint);
  },

  updateMemberRole(
    organizationId: string,
    userId: string,
    payload: { role: string },
  ) {
    return api.patch<OrganizationMemberInfo>(
      `/organizations/${organizationId}/members/${userId}`,
      payload,
    );
  },

  removeMember(organizationId: string, userId: string) {
    return api.delete<{ message: string }>(
      `/organizations/${organizationId}/members/${userId}`,
    );
  },

  leave(organizationId: string) {
    return api.post<{ message: string }>(
      `/organizations/${organizationId}/leave`,
    );
  },

  createInvitation(
    organizationId: string,
    payload: { email: string; role: string },
  ) {
    return api.post<OrganizationInvitationCreated>(
      `/organizations/${organizationId}/invitations`,
      payload,
    );
  },

  listInvitations(
    organizationId: string,
    query?: { page?: number; limit?: number },
  ) {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    const endpoint = `/organizations/${organizationId}/invitations${qs ? `?${qs}` : ""}`;
    return api.get<PaginatedInvitations>(endpoint);
  },

  revokeInvitation(organizationId: string, invitationId: string) {
    return api.delete<{ message: string }>(
      `/organizations/${organizationId}/invitations/${invitationId}`,
    );
  },

  resendInvitation(organizationId: string, invitationId: string) {
    return api.post<OrganizationInvitationCreated>(
      `/organizations/${organizationId}/invitations/${invitationId}/resend`,
    );
  },

  acceptInvitation(payload: { token: string }) {
    return api.post<AcceptInvitationResult>("/invitations/accept", payload);
  },
};

export const invitationApi = {
  create: organizationApi.createInvitation,
  list: organizationApi.listInvitations,
  revoke: organizationApi.revokeInvitation,
  resend: organizationApi.resendInvitation,
  accept: organizationApi.acceptInvitation,
  preview(payload: { token: string }) {
    return api.post<InvitationPreviewResult>("/invitations/preview", payload);
  },
};
=======
  }) {
    return api.post<Organization>("/organizations", payload);
  },
};













>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

/* =========================================================
   PROJECT API
   ========================================================= */

<<<<<<< HEAD
export interface ProjectMemberInfo {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: string;
  user: OrganizationMemberUser;
}

export interface Project {
  id: string;
  organizationId?: string;
  createdById?: string;
=======
export interface Project {
  id: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  name: string;
  key?: string;
  description?: string | null;
  status?: string;
<<<<<<< HEAD
  startDate?: string | null;
  targetDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  members?: ProjectMemberInfo[];
  createdBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
=======
  createdAt?: string;
  updatedAt?: string;
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
  status?: string;
  startDate?: string;
  targetDate?: string;
}

export const projectApi = {
<<<<<<< HEAD
  list(organizationId?: string) {
    const query = organizationId
      ? `?organizationId=${encodeURIComponent(organizationId)}`
      : "";
    return api.get<Project[]>(`/projects${query}`);
=======
  list(organizationId: string) {
    return api.get<Project[]>(
      `/projects?organizationId=${encodeURIComponent(organizationId)}`
    );
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  },

  get(projectId: string) {
    return api.get<Project>(`/projects/${projectId}`);
  },

<<<<<<< HEAD
  create(
    organizationIdOrPayload: string | CreateProjectPayload,
    maybePayload?: CreateProjectPayload,
  ) {
    if (typeof organizationIdOrPayload === "string") {
      const orgId = organizationIdOrPayload;
      return api.post<Project>(
        `/projects?organizationId=${encodeURIComponent(orgId)}`,
        maybePayload,
      );
    }
    return api.post<Project>("/projects", organizationIdOrPayload);
  },

  update(projectId: string, payload: Partial<CreateProjectPayload>) {
    return api.patch<Project>(`/projects/${projectId}`, payload);
  },

  remove(projectId: string) {
    return api.delete<void>(`/projects/${projectId}`);
  },

  getMembers(projectId: string) {
    return api.get<ProjectMemberInfo[]>(`/projects/${projectId}/members`);
  },

  addMember(projectId: string, userId: string) {
    return api.post<ProjectMemberInfo>(`/projects/${projectId}/members`, {
      userId,
    });
  },

  removeMember(projectId: string, userId: string) {
    return api.delete<{ message: string }>(
      `/projects/${projectId}/members/${userId}`,
=======
  create(organizationId: string, payload: CreateProjectPayload) {
    return api.post<Project>(
      `/projects?organizationId=${encodeURIComponent(organizationId)}`,
      payload
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    );
  },
};




/* =========================================================
   TASK API
   ========================================================= */

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
<<<<<<< HEAD
  | "IN_REVIEW"
  | "BLOCKED"
  | "DONE"
  | "CANCELLED";
=======
  | "REVIEW"
  | "DONE";
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface Task {
  id: string;
<<<<<<< HEAD
  projectId: string;
  creatorId?: string;
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
<<<<<<< HEAD
  storyPoints?: number | null;
  assigneeId?: string | null;
  sprintId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  creator?: OrganizationMemberUser;
  assignee?: OrganizationMemberUser | null;
  project?: {
    id: string;
    name: string;
    key?: string;
  };
}

export interface CreateTaskPayload {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  sprintId?: string | null;
  storyPoints?: number;
  dueDate?: string | null;
}

=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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

<<<<<<< HEAD
  update(taskId: string, payload: UpdateTaskPayload) {
    return api.patch<Task>(`/tasks/${taskId}`, payload);
  },

  move(
    taskId: string,
    payload: {
      status: TaskStatus;
      position?: number;
    },
  ) {
    return api.patch<Task>(
      `/tasks/${taskId}/move`,
=======
  update(
    taskId: string,
    payload: Partial<CreateTaskPayload> & {
      status?: TaskStatus;
    },
  ) {
    return api.patch<Task>(
      `/tasks/${taskId}`,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
      payload,
    );
  },

  remove(taskId: string) {
    return api.delete<void>(`/tasks/${taskId}`);
  },
};

<<<<<<< HEAD

=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
    distanceThreshold?: number,
  ) {
    const thresholdQuery =
      distanceThreshold !== undefined
        ? `&distanceThreshold=${encodeURIComponent(distanceThreshold)}`
        : "";
=======
  ) {
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return api.get<RagSearchResponse>(
      `/ai/rag/search?projectId=${encodeURIComponent(
        projectId,
      )}&query=${encodeURIComponent(
        query,
<<<<<<< HEAD
      )}&limit=${limit}${thresholdQuery}`,
=======
      )}&limit=${limit}`,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD

  askStream(
    projectId: string,
    question: string,
    onToken: (token: string) => void,
    onDone?: () => void,
    onError?: (err: any) => void,
  ) {
    const token = getAccessToken();
    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : "";
    const url = `${API_BASE_URL}/ai/ask/stream?projectId=${encodeURIComponent(
      projectId,
    )}&question=${encodeURIComponent(question)}${tokenQuery}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.token) {
          onToken(data.token);
        }
        if (data.done) {
          eventSource.close();
          onDone?.();
        }
      } catch {
        onToken(event.data);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      onError?.(err);
    };

    return () => eventSource.close();
  },
};

/* =========================================================
   DOCUMENTS & KNOWLEDGE BASE API
   ========================================================= */

export interface DocumentMetadata {
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  storageKey?: string;
  storagePath?: string;
  uploadedBy?: string;
  status?: string;
  [key: string]: unknown;
}

export interface DocumentItem {
  id: string;
  projectId?: string;
  repositoryId?: string;
  sourceType: string;
  externalId?: string;
  title: string;
  content?: string;
  sourceUrl?: string;
  checksum?: string;
  metadata?: DocumentMetadata;
  indexedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  upload(
    projectId: string,
    file: File | Blob,
    title?: string,
  ): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    if (title) {
      formData.append("title", title);
    }

    const token = getAccessToken();
    const headers: Record<string, string> = {
      "x-project-id": projectId,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/documents/upload?projectId=${encodeURIComponent(projectId)}`, {
      method: "POST",
      headers,
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        const msg = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || "Failed to upload document";
        throw new ApiError(msg, res.status, errorData.code, errorData);
      }
      return res.json() as Promise<DocumentItem>;
    });
  },

  findAll(projectId?: string, repositoryId?: string): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (repositoryId) params.set("repositoryId", repositoryId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return api.get<DocumentItem[]>(`/documents${qs}`);
  },

  findOne(id: string): Promise<DocumentItem> {
    return api.get<DocumentItem>(`/documents/${encodeURIComponent(id)}`);
  },

  delete(id: string): Promise<DocumentItem> {
    return api.delete<DocumentItem>(`/documents/${encodeURIComponent(id)}`);
  },
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
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
<<<<<<< HEAD
};

/* =========================================================
   CHAT API
   ========================================================= */

export interface ChatChannel {
  id: string;
  projectId?: string | null;
  name: string;
  type: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  channelId: string;
  senderId?: string | null;
  content: string;
  type: string;
  metadata?: unknown;
  createdAt: string;
  sender?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username: string;
    avatarUrl?: string | null;
  } | null;
}

export interface CreateChannelPayload {
  projectId?: string;
  name: string;
  isPrivate?: boolean;
  type?: string;
}

export interface SendMessagePayload {
  channelId: string;
  content: string;
  type?: string;
  metadata?: unknown;
}

export const chatApi = {
  async getProjectChannels(projectId: string): Promise<ChatChannel[]> {
    const res = await api.get<any>(`/chat/channels/project/${encodeURIComponent(projectId)}`);
    if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  async getChannel(id: string): Promise<ChatChannel> {
    const res = await api.get<any>(`/chat/channels/${id}`);
    if (res && typeof res === "object" && "data" in res && !("id" in res)) {
      return res.data;
    }
    return res;
  },

  async createChannel(payload: CreateChannelPayload): Promise<ChatChannel> {
    const res = await api.post<any>("/chat/channels", payload);
    if (res && typeof res === "object" && "data" in res && !("id" in res)) {
      return res.data;
    }
    return res;
  },

  deleteChannel(id: string) {
    return api.delete<{ id: string }>(`/chat/channels/${id}`);
  },

  async getMessages(channelId: string): Promise<ChatMessageItem[]> {
    const res = await api.get<any>(`/chat/channels/${channelId}/messages`);
    if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatMessageItem> {
    const res = await api.post<any>("/chat/messages", payload);
    if (res && typeof res === "object" && "data" in res && !("id" in res)) {
      return res.data;
    }
    return res;
  },

  async editMessage(id: string, content: string, channelId?: string): Promise<ChatMessageItem> {
    const endpoint = channelId
      ? `/chat/channels/${channelId}/messages/${id}`
      : `/chat/messages/${id}`;
    const res = await api.patch<any>(endpoint, { content });
    if (res && typeof res === "object" && "data" in res && !("id" in res)) {
      return res.data;
    }
    return res;
  },

  deleteMessage(id: string, channelId?: string) {
    if (channelId) {
      return api.delete<ChatMessageItem>(
        `/chat/channels/${channelId}/messages/${id}`,
      );
    }
    return api.delete<ChatMessageItem>(`/chat/messages/${id}`);
  },
};

/* =========================================================
   STANDUP API
   ========================================================= */

export interface StandupResponse {
  userId: string;
  projectId: string | null;
  date: string;
  standup: string;
}

export const standupApi = {
  generate(payload: {
    userId: string;
    projectId?: string;
    date?: string;
  }) {
    return api.post<StandupResponse>(
      "/ai/standup/generate",
      payload,
    );
  },
};

/* =========================================================
   SPRINT API
   ========================================================= */

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Sprint {
  id: string;
  projectId: string;
  creatorId?: string;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  createdAt?: string;
  updatedAt?: string;
  tasks?: Task[];
}

export interface CreateSprintPayload {
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  startDate?: string;
  endDate?: string;
  capacity?: number;
}

export interface SprintPlanResponse {
  projectId: string;
  goal: string | null;
  durationDays: number;
  issueCount: number;
  plan: string;
}

export const sprintApi = {
  list(projectId?: string) {
    const query = projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";
    return api.get<Sprint[]>(`/sprints${query}`);
  },

  get(sprintId: string) {
    return api.get<Sprint>(`/sprints/${sprintId}`);
  },

  create(payload: CreateSprintPayload) {
    return api.post<Sprint>("/sprints", payload);
  },

  update(
    sprintId: string,
    payload: UpdateSprintPayload,
  ) {
    return api.patch<Sprint>(`/sprints/${sprintId}`, payload);
  },

  remove(sprintId: string) {
    return api.delete<void>(`/sprints/${sprintId}`);
  },

  generatePlan(payload: {
    projectId: string;
    goal?: string;
    durationDays?: number;
    issueIds?: string[];
  }) {
    return api.post<SprintPlanResponse>(
      "/ai/sprint-planner",
      payload,
    );
  },

  getProjectIssues(projectId: string) {
    return api.get<unknown[]>(
      `/ai/sprint-planner/project/${projectId}/issues`,
    );
  },
};

/* =========================================================
   ISSUES / BUGS API
   ========================================================= */

export type IssueStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IssueType =
  | "BUG"
  | "FEATURE"
  | "IMPROVEMENT"
  | "DOCUMENTATION"
  | "SECURITY"
  | "PERFORMANCE"
  | "OTHER";

export interface Issue {
  id: string;
  projectId: string;
  repositoryId?: string | null;
  assigneeId?: string | null;
  reporterId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  type?: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  estimatedHours?: number | null;
  dueDate?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  reporter?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username: string;
    email?: string;
  } | null;
  project?: {
    id: string;
    name: string;
    key?: string;
  };
}

export interface CreateIssuePayload {
  projectId: string;
  title: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  repositoryId?: string;
  estimatedHours?: number;
  dueDate?: string;
  reporterId?: string;
  creatorId?: string;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  repositoryId?: string | null;
  estimatedHours?: number | null;
  dueDate?: string | null;
}

export const issueApi = {
  listByProject(projectId: string) {
    return api.get<Issue[]>(`/issues/project/${encodeURIComponent(projectId)}`);
  },

  get(id: string) {
    return api.get<Issue>(`/issues/${id}`);
  },

  create(payload: CreateIssuePayload) {
    return api.post<Issue>("/issues", payload);
  },

  update(id: string, payload: UpdateIssuePayload) {
    return api.patch<Issue>(`/issues/${id}`, payload);
  },

  remove(id: string) {
    return api.delete<void>(`/issues/${id}`);
  },
};

/* =========================================================
   AI BUG ANALYZER API
   ========================================================= */

export interface BugAnalysisResponse {
  description: string;
  projectId?: string;
  analysis: string;
}

export const bugAnalyzerApi = {
  analyze(description: string, projectId?: string) {
    return api.post<BugAnalysisResponse>("/ai/bug-analyzer/analyze", {
      description,
      projectId,
    });
  },
};

/* =========================================================
   AI RISK ENGINE API
   ========================================================= */

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus = "OPEN" | "ACKNOWLEDGED" | "MITIGATED" | "RESOLVED" | "IGNORED";

export interface ProjectRisk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  status: RiskStatus;
  probability?: number | null;
  impact?: number | null;
  riskScore?: number | null;
  source?: string | null;
  detectedAt?: string;
  resolvedAt?: string | null;
}

export interface RiskSummaryResponse {
  projectId: string;
  totalRisks: number;
  averageRiskScore: number;
  highestRisk: ProjectRisk | null;
}

export const riskApi = {
  listByProject(projectId: string) {
    return api.get<ProjectRisk[]>(
      `/ai/risk-engine/project/${encodeURIComponent(projectId)}`,
    );
  },

  getSummary(projectId: string) {
    return api.get<RiskSummaryResponse>(
      `/ai/risk-engine/project/${encodeURIComponent(projectId)}/summary`,
    );
  },

  get(id: string) {
    return api.get<ProjectRisk>(`/ai/risk-engine/${id}`);
  },

  create(payload: {
    projectId: string;
    title: string;
    description: string;
    severity: RiskSeverity;
    probability?: number;
    impact?: number;
    source?: string;
  }) {
    return api.post<ProjectRisk>("/ai/risk-engine", payload);
  },

  updateStatus(id: string, status: RiskStatus) {
    return api.patch<ProjectRisk>(`/ai/risk-engine/${id}/status`, { status });
  },

  remove(id: string) {
    return api.delete<void>(`/ai/risk-engine/${id}`);
  },
};

/* =========================================================
   NOTIFICATION API
   ========================================================= */

export type BackendNotificationType =
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "ISSUE_ASSIGNED"
  | "ISSUE_UPDATED"
  | "PR_REVIEW"
  | "PR_MERGED"
  | "MENTION"
  | "CHAT_MESSAGE"
  | "SPRINT_STARTED"
  | "SPRINT_COMPLETED"
  | "AI_INSIGHT"
  | "RISK_DETECTED"
  | "SYSTEM";

export type BackendNotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface BackendNotification {
  id: string;
  userId: string;
  projectId: string | null;
  type: BackendNotificationType;
  priority: BackendNotificationPriority;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationPayload {
  userId: string;
  type: BackendNotificationType;
  title: string;
  message: string;
  projectId?: string;
  priority?: BackendNotificationPriority;
  metadata?: Record<string, unknown>;
}

async function notifUnwrap<T>(promise: Promise<T>): Promise<T> {
  const res = await promise;
  if (
    res !== null &&
    typeof res === "object" &&
    "data" in (res as Record<string, unknown>) &&
    !("id" in (res as Record<string, unknown>))
  ) {
    return ((res as unknown) as { data: T }).data;
  }
  return res;
}

export const notificationApi = {
  /** GET /notifications?unreadOnly=true|false */
  async getNotifications(
    unreadOnly?: boolean,
  ): Promise<BackendNotification[]> {
    const qs = unreadOnly ? "?unreadOnly=true" : "";
    return notifUnwrap(api.get<BackendNotification[]>(`/notifications${qs}`));
  },

  /** GET /notifications/unread-count */
  async getUnreadCount(): Promise<{ count: number }> {
    return notifUnwrap(
      api.get<{ count: number }>("/notifications/unread-count"),
    );
  },

  /** GET /notifications/:id */
  async getOne(id: string): Promise<BackendNotification> {
    return notifUnwrap(api.get<BackendNotification>(`/notifications/${id}`));
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(id: string): Promise<BackendNotification> {
    return notifUnwrap(
      api.patch<BackendNotification>(`/notifications/${id}/read`, {}),
    );
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead(): Promise<{ count: number }> {
    return notifUnwrap(
      api.patch<{ count: number }>("/notifications/read-all", {}),
    );
  },

  /** DELETE /notifications/:id */
  async deleteNotification(id: string): Promise<void> {
    await api.delete<void>(`/notifications/${id}`);
  },

  /** POST /notifications (backend actor creates for another user) */
  async create(
    payload: CreateNotificationPayload,
  ): Promise<BackendNotification> {
    return notifUnwrap(
      api.post<BackendNotification>("/notifications", payload),
    );
  },
};

/* =========================================================
   DASHBOARD & ANALYTICS API
   ========================================================= */

export interface ProjectMetadataOverview {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMetricsOverview {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  inReview: number;
  blocked: number;
  cancelled: number;
  overdue: number;
}

export interface IssueMetricsOverview {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  byType: {
    BUG: number;
    FEATURE: number;
    TASK: number;
    IMPROVEMENT: number;
    EPIC: number;
  };
}

export interface ActiveSprintOverview {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  capacity: number | null;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  plannedStoryPoints: number;
  completedStoryPoints: number;
  hasMultipleActiveSprints: boolean;
}

export interface DashboardOverviewResponse {
  project: ProjectMetadataOverview;
  tasks: TaskMetricsOverview;
  issues: IssueMetricsOverview;
  activeSprint: ActiveSprintOverview | null;
  timestamp: string;
}

export const dashboardApi = {
  getDashboardOverview(projectId: string): Promise<DashboardOverviewResponse> {
    if (!projectId || !projectId.trim()) {
      throw new ApiError(
        "A valid projectId is required to fetch dashboard overview.",
        400,
        "BAD_REQUEST",
      );
    }
    return api.get<DashboardOverviewResponse>(
      `/analytics/project/${encodeURIComponent(projectId.trim())}/dashboard`,
    );
  },
};
=======
};
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
