import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

const STORAGE_KEY = "devsync_auth_session";

function createDemoUser(
  values: LoginCredentials | RegisterCredentials,
) {
  const name =
    "name" in values
      ? values.name
      : values.email.split("@")[0];

  return {
    id: crypto.randomUUID(),
    name,
    email: values.email,
    role: "developer" as const,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

function createResponse(
  values: LoginCredentials | RegisterCredentials,
): AuthResponse {
  const accessToken =
    `devsync-demo-${crypto.randomUUID()}`;

  const response: AuthResponse = {
    user: createDemoUser(values),
    accessToken,
    refreshToken:
      `devsync-refresh-${crypto.randomUUID()}`,
    expiresAt: new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    ).toISOString(),
  };

  return response;
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  await Promise.resolve();

  const response = createResponse(credentials);

  saveSession(response);

  return response;
}

export async function register(
  credentials: RegisterCredentials,
): Promise<AuthResponse> {
  await Promise.resolve();

  const response = createResponse(credentials);

  saveSession(response);

  return response;
}

export async function logout(): Promise<void> {
  await Promise.resolve();

  localStorage.removeItem(STORAGE_KEY);
}

export async function refreshSession(): Promise<AuthResponse | null> {
  const session = getSession();

  if (!session) {
    return null;
  }

  return session;
}

export function saveSession(
  response: AuthResponse,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(response),
  );
}

export function getSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getSession()?.accessToken);
}