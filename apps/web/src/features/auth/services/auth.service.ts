<<<<<<< HEAD
import {
  authApi,
  clearAccessToken,
  setAccessToken,
  type AuthUser as ApiAuthUser,
} from "../../../lib/api";
import type {
  AuthResponse,
  AuthUser,
=======
import type {
  AuthResponse,
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

const STORAGE_KEY = "devsync_auth_session";

<<<<<<< HEAD
function mapApiUserToAuthUser(apiUser: ApiAuthUser): AuthUser {
  return {
    id: apiUser.id,
    name: apiUser.name || (apiUser as any).username || apiUser.email.split("@")[0],
    email: apiUser.email,
    avatar: apiUser.avatarUrl ?? undefined,
    role: ((apiUser.role?.toLowerCase() as any) || "developer"),
    createdAt: (apiUser as any).createdAt || new Date().toISOString(),
    lastLoginAt: (apiUser as any).lastLoginAt || new Date().toISOString(),
  };
}

/**
 * Real API Login
 */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const result = await authApi.login({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  setAccessToken(result.accessToken);

  const authUser = mapApiUserToAuthUser(result.user);

  const response: AuthResponse = {
    user: authUser,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };

  saveSession(response);

  try {
    localStorage.setItem("devsync_user", JSON.stringify(result.user));
  } catch {
    // Ignore storage errors
  }

  return response;
}

/**
 * Real API Registration
 */
export async function register(
  credentials: RegisterCredentials,
): Promise<AuthResponse> {
  const nameParts = credentials.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "DevSync";
  const username = credentials.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") || "user";

  const result = await authApi.register({
    username,
    firstName,
    lastName,
    email: credentials.email.trim(),
    password: credentials.password,
    organization: credentials.organizationName,
  });

  setAccessToken(result.accessToken);

  const authUser = mapApiUserToAuthUser(result.user);

  const response: AuthResponse = {
    user: authUser,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };

  saveSession(response);

  try {
    localStorage.setItem("devsync_user", JSON.stringify(result.user));
  } catch {
    // Ignore storage errors
  }

  return response;
}

/**
 * Real API Logout
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    // Continue local cleanup even if backend request fails
  } finally {
    clearAccessToken();
    localStorage.removeItem(STORAGE_KEY);
    try {
      localStorage.removeItem("devsync_user");
    } catch {
      // Ignore
    }
  }
}

/**
 * Session Refresh
 */
=======
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

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
export async function refreshSession(): Promise<AuthResponse | null> {
  const session = getSession();

  if (!session) {
    return null;
  }

<<<<<<< HEAD
  try {
    const user = await authApi.me();
    const updatedUser = mapApiUserToAuthUser(user);
    const updatedSession: AuthResponse = {
      ...session,
      user: updatedUser,
    };
    saveSession(updatedSession);
    try {
      localStorage.setItem("devsync_user", JSON.stringify(user));
    } catch {
      // Ignore
    }
    return updatedSession;
  } catch {
    return session;
  }
}

export function saveSession(response: AuthResponse): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  } catch {
    // Ignore storage errors
  }
=======
  return session;
}

export function saveSession(
  response: AuthResponse,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(response),
  );
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}

export function getSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
<<<<<<< HEAD
    if (!raw) {
      return null;
    }
=======

    if (!raw) {
      return null;
    }

>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getSession()?.accessToken);
<<<<<<< HEAD
}

/* =========================================================
   INTENTIONAL DEMO MODE (Preserved separately)
   ========================================================= */

export function createDemoSession(
  values: LoginCredentials | RegisterCredentials,
): AuthResponse {
  const name =
    "name" in values
      ? values.name
      : values.email.split("@")[0];

  const demoUser: AuthUser = {
    id: "demo-user-" + crypto.randomUUID().slice(0, 8),
    name,
    email: values.email,
    role: "developer",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  return {
    user: demoUser,
    accessToken: `devsync-demo-${crypto.randomUUID()}`,
    refreshToken: `devsync-refresh-${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
}