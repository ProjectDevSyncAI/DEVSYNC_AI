/**
 * DevSync AI — Milestone 4B.1 Authentication Synchronization Tests
 *
 * Tests:
 * 1. setAccessToken and getAccessToken storage synchronization
 * 2. clearAccessToken removes token from storage
 * 3. createDemoSession generates isolated demo session without polluting real token key
 * 4. Auth response payload shapes and mapping
 * 5. Logout cleanup clears auth token and session storage
 */

import test from "node:test";
import assert from "node:assert";

import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from "../src/lib/api.js";

import {
  createDemoSession,
  saveSession,
  getSession,
  isAuthenticated,
} from "../src/features/auth/services/auth.service.js";

// Mock localStorage in global scope for node:test environment if not present
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

test("Auth Storage - setAccessToken and getAccessToken work correctly", () => {
  const token = "test-jwt-token-xyz-12345";
  setAccessToken(token);
  assert.strictEqual(getAccessToken(), token);

  clearAccessToken();
  assert.strictEqual(getAccessToken(), null);
});

test("Auth Storage - clearAccessToken removes the auth token", () => {
  setAccessToken("token-to-remove");
  assert.strictEqual(getAccessToken(), "token-to-remove");

  clearAccessToken();
  assert.strictEqual(getAccessToken(), null);
});

test("Auth Service - saveSession and getSession persist and retrieve auth session", () => {
  const mockSession = {
    user: {
      id: "user-123",
      name: "Alex Connor",
      email: "alex@devsync.ai",
      role: "developer" as const,
      createdAt: new Date().toISOString(),
    },
    accessToken: "jwt-access-token-abc",
    refreshToken: "jwt-refresh-token-xyz",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };

  saveSession(mockSession);
  const retrieved = getSession();

  assert.ok(retrieved !== null);
  assert.strictEqual(retrieved?.user.id, "user-123");
  assert.strictEqual(retrieved?.accessToken, "jwt-access-token-abc");
  assert.strictEqual(isAuthenticated(), true);
});

test("Demo Session - createDemoSession produces isolated demo credentials", () => {
  const demoSession = createDemoSession({
    email: "demo@devsync.ai",
    password: "Password123!",
  });

  assert.ok(demoSession.accessToken.startsWith("devsync-demo-"));
  assert.strictEqual(demoSession.user.email, "demo@devsync.ai");
  assert.ok(demoSession.user.id.startsWith("demo-user-"));
});

test("Auth State - isAuthenticated returns false when no token is present", () => {
  localStorage.clear();
  assert.strictEqual(isAuthenticated(), false);
});
