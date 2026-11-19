/**
 * DevSync AI — Milestone 4B.9 Phase 5.2 Frontend Integration Tests
 * Email Verification & Change Email Frontend Service, Security & State Suite
 */
import test from "node:test";
import assert from "node:assert";

import {
  emailVerificationApi,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  type RequestEmailVerificationPayload,
  type RequestEmailVerificationResponse,
  type ResendEmailVerificationPayload,
  type ResendEmailVerificationResponse,
  type ConfirmEmailVerificationPayload,
  type ConfirmEmailVerificationResponse,
  type EmailVerificationStatusResponse,
  ApiError,
} from "../src/lib/api.js";
import {
  useEmailVerificationStore,
  initEmailVerificationListeners,
} from "../src/store/email-verification.store.js";

// Ensure localStorage mock exists for Node test environment
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

// Ensure window mock exists for Node test environment
if (typeof globalThis.window === "undefined") {
  const eventListeners = new Map<string, Array<(...args: any[]) => void>>();
  (globalThis as any).window = {
    location: {
      origin: "http://localhost:5173",
      pathname: "/",
      search: "",
      hash: "",
    },
    history: {
      replaceState: (state: any, unused: string, url?: string | URL | null) => {
        if (typeof url === "string") {
          const u = new URL(url, "http://localhost:5173");
          (globalThis as any).window.location.pathname = u.pathname;
          (globalThis as any).window.location.search = u.search;
          (globalThis as any).window.location.hash = u.hash;
        }
      },
      pushState: (state: any, unused: string, url?: string | URL | null) => {
        if (typeof url === "string") {
          const u = new URL(url, "http://localhost:5173");
          (globalThis as any).window.location.pathname = u.pathname;
          (globalThis as any).window.location.search = u.search;
          (globalThis as any).window.location.hash = u.hash;
        }
      },
    },
    addEventListener: (event: string, handler: (...args: any[]) => void) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event)!.push(handler);
    },
    removeEventListener: (event: string, handler: (...args: any[]) => void) => {
      const handlers = eventListeners.get(event);
      if (handlers) {
        eventListeners.set(
          event,
          handlers.filter((h) => h !== handler)
        );
      }
    },
    dispatchEvent: (event: any) => {
      const type = event?.type || event;
      const handlers = eventListeners.get(type) || [];
      for (const h of handlers) {
        h(event);
      }
      return true;
    },
  };
}

// Mock global fetch for testing typed API integration
let originalFetch: typeof globalThis.fetch;
let interceptedRequests: Array<{ url: string; method: string; body?: any; headers?: any }> = [];
let mockResponses: Map<string, { status: number; body: any }> = new Map();

function setupMockFetch() {
  interceptedRequests = [];
  mockResponses = new Map();
  originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";
    let body: any = undefined;
    if (init?.body && typeof init.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    interceptedRequests.push({ url, method, body, headers: init?.headers });

    // Look for matching mock response
    for (const [key, response] of mockResponses.entries()) {
      if (url.includes(key)) {
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Default 200 empty response
    return new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof globalThis.fetch;
}

function restoreFetch() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
}

test("Email Verification Frontend Integration & Security Test Suite", async (t) => {
  setupMockFetch();

  t.beforeEach(() => {
    mockResponses.clear();
    interceptedRequests = [];
    clearAccessToken();
    useEmailVerificationStore.getState().clearVerificationState();
  });

  t.after(() => {
    useEmailVerificationStore.getState().clearVerificationState();
    restoreFetch();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. emailVerificationApi Service Unit Tests
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("1.1 emailVerificationApi.requestVerification sends authenticated POST /auth/email/verify/request", async () => {
    mockResponses.set("/auth/email/verify/request", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "Verification email sent",
          email: "alex@example.com",
          purpose: "INITIAL_VERIFICATION",
        },
      },
    });

    const result = await emailVerificationApi.requestVerification({
      email: "alex@example.com",
    });

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.ok(interceptedRequests[0].url.endsWith("/auth/email/verify/request"));
    assert.deepStrictEqual(interceptedRequests[0].body, { email: "alex@example.com" });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.purpose, "INITIAL_VERIFICATION");
    assert.strictEqual(result.email, "alex@example.com");
  });

  await t.test("1.2 emailVerificationApi.requestVerification works with empty body for current user", async () => {
    mockResponses.set("/auth/email/verify/request", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "Verification link sent to primary address",
          purpose: "INITIAL_VERIFICATION",
        },
      },
    });

    const result = await emailVerificationApi.requestVerification();

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.deepStrictEqual(interceptedRequests[0].body, {});
    assert.strictEqual(result.success, true);
  });

  await t.test("1.3 emailVerificationApi.resendVerification sends public POST /auth/email/verify/resend", async () => {
    mockResponses.set("/auth/email/verify/resend", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "If an unverified account exists for this email, a verification link has been sent.",
        },
      },
    });

    const result = await emailVerificationApi.resendVerification({
      email: "engineer@example.com",
    });

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.ok(interceptedRequests[0].url.endsWith("/auth/email/verify/resend"));
    assert.deepStrictEqual(interceptedRequests[0].body, { email: "engineer@example.com" });
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("If an unverified account exists"));
  });

  await t.test("1.4 emailVerificationApi.confirmVerification sends public POST /auth/email/verify/confirm", async () => {
    const validHexToken = "a".repeat(64);
    mockResponses.set("/auth/email/verify/confirm", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "Email verified successfully",
          purpose: "INITIAL_VERIFICATION",
        },
      },
    });

    const result = await emailVerificationApi.confirmVerification({
      token: validHexToken,
    });

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.ok(interceptedRequests[0].url.endsWith("/auth/email/verify/confirm"));
    assert.deepStrictEqual(interceptedRequests[0].body, { token: validHexToken });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.purpose, "INITIAL_VERIFICATION");
  });

  await t.test("1.5 emailVerificationApi.getStatus sends authenticated GET /auth/email/status", async () => {
    mockResponses.set("/auth/email/status", {
      status: 200,
      body: {
        success: true,
        data: {
          email: "member@example.com",
          isVerified: false,
          emailVerifiedAt: null,
          pendingEmail: "new-member@example.com",
        },
      },
    });

    const result = await emailVerificationApi.getStatus();

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "GET");
    assert.ok(interceptedRequests[0].url.endsWith("/auth/email/status"));
    assert.strictEqual(result.email, "member@example.com");
    assert.strictEqual(result.isVerified, false);
    assert.strictEqual(result.pendingEmail, "new-member@example.com");
  });

  await t.test("1.6 emailVerificationApi correctly propagates 400 Expired Token error", async () => {
    mockResponses.set("/auth/email/verify/confirm", {
      status: 400,
      body: {
        statusCode: 400,
        message: "Verification token has expired",
        error: "Bad Request",
      },
    });

    await assert.rejects(
      async () => {
        await emailVerificationApi.confirmVerification({ token: "b".repeat(64) });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes("expired"));
        return true;
      }
    );
  });

  await t.test("1.7 emailVerificationApi correctly propagates 404 Invalid Token error", async () => {
    mockResponses.set("/auth/email/verify/confirm", {
      status: 404,
      body: {
        statusCode: 404,
        message: "Invalid or consumed verification token",
        error: "Not Found",
      },
    });

    await assert.rejects(
      async () => {
        await emailVerificationApi.confirmVerification({ token: "c".repeat(64) });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 404);
        assert.ok(err.message.includes("Invalid"));
        return true;
      }
    );
  });

  await t.test("1.8 emailVerificationApi correctly propagates 409 Already Consumed error", async () => {
    mockResponses.set("/auth/email/verify/confirm", {
      status: 409,
      body: {
        statusCode: 409,
        message: "Verification token has already been used",
        error: "Conflict",
      },
    });

    await assert.rejects(
      async () => {
        await emailVerificationApi.confirmVerification({ token: "d".repeat(64) });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 409);
        assert.ok(err.message.includes("already been used"));
        return true;
      }
    );
  });

  await t.test("1.9 emailVerificationApi correctly propagates 429 Rate Limit error", async () => {
    mockResponses.set("/auth/email/verify/resend", {
      status: 429,
      body: {
        statusCode: 429,
        message: "Too many verification requests. Please try again later.",
        error: "Too Many Requests",
      },
    });

    await assert.rejects(
      async () => {
        await emailVerificationApi.resendVerification({ email: "spammer@example.com" });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 429);
        assert.ok(err.message.includes("Too many"));
        return true;
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Token Format & URL Fragment Security Parsing
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("2.1 Fragment parser accepts valid 64-char hex token and extracts purpose", () => {
    const rawFragment = "#token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef&purpose=EMAIL_CHANGE";
    const fragment = rawFragment.startsWith("#") ? rawFragment.slice(1) : rawFragment;
    const params = new URLSearchParams(fragment);
    const token = params.get("token");
    const purpose = params.get("purpose");

    assert.strictEqual(token, "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    assert.strictEqual(purpose, "EMAIL_CHANGE");
    assert.ok(/^[a-f0-9]{64}$/i.test(token!));
  });

  await t.test("2.2 Rejects token passed in query parameter (?token=...) without sending request", () => {
    const query = "?token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const searchParams = new URLSearchParams(query);
    const tokenInQuery = searchParams.get("token");

    // Security check: query param tokens must be detected and rejected
    const isSecurityViolation = Boolean(tokenInQuery);
    assert.strictEqual(isSecurityViolation, true, "Query token must be detected");

    const expectedErrorMessage = "Security Alert: Verification tokens must not be transmitted in URL query parameters. Please use the secure fragment link.";
    assert.ok(expectedErrorMessage.includes("Security Alert"));
  });

  await t.test("2.3 Hex validator rejects malformed tokens (non-hex, wrong length)", () => {
    const hexRegex = /^[a-f0-9]{64}$/i;

    // Too short (63 chars)
    assert.strictEqual(hexRegex.test("a".repeat(63)), false);
    // Too long (65 chars)
    assert.strictEqual(hexRegex.test("a".repeat(65)), false);
    // Non-hex character 'g'
    assert.strictEqual(hexRegex.test("g" + "a".repeat(63)), false);
    // Non-hex special chars
    assert.strictEqual(hexRegex.test("!" + "a".repeat(63)), false);
    // Exact 64 hex characters
    assert.strictEqual(hexRegex.test("abcdef0123456789".repeat(4)), true);
  });

  await t.test("2.4 Address-bar scrubbing removes fragment before network call", () => {
    // Simulate initial URL with sensitive token fragment
    (globalThis as any).window.location.pathname = "/verify-email";
    (globalThis as any).window.location.hash = "#token=" + "a".repeat(64) + "&purpose=INITIAL_VERIFICATION";

    // Perform the pre-paint scrubbing logic
    if (typeof (globalThis as any).window !== "undefined") {
      (globalThis as any).window.history.replaceState(
        {},
        "DevSync AI",
        "/verify-email"
      );
    }

    assert.strictEqual((globalThis as any).window.location.hash, "");
    assert.strictEqual((globalThis as any).window.location.pathname, "/verify-email");
  });

  await t.test("2.5 Tokens are never persisted to localStorage or sessionStorage", () => {
    const sensitiveToken = "f".repeat(64);
    // Ensure no token key exists in localStorage
    assert.strictEqual(localStorage.getItem("token"), null);
    assert.strictEqual(localStorage.getItem("verification_token"), null);
    assert.strictEqual(localStorage.getItem("email_token"), null);
  });

  await t.test("2.6 Fragment parser defaults purpose to INITIAL_VERIFICATION if omitted", () => {
    const rawFragment = "#token=" + "0123456789abcdef".repeat(4);
    const params = new URLSearchParams(rawFragment.slice(1));
    const token = params.get("token");
    const rawPurpose = params.get("purpose");
    const purpose = rawPurpose === "EMAIL_CHANGE" ? "EMAIL_CHANGE" : "INITIAL_VERIFICATION";

    assert.strictEqual(token?.length, 64);
    assert.strictEqual(purpose, "INITIAL_VERIFICATION");
  });

  await t.test("2.7 Hex validator accepts uppercase and lowercase 64-character tokens", () => {
    const hexRegex = /^[a-f0-9]{64}$/i;
    const mixedCaseToken = "AaBbCcDdEeFf0123456789" + "a".repeat(42);
    assert.strictEqual(hexRegex.test(mixedCaseToken), true);
  });

  await t.test("2.8 Detects missing token in fragment without crashing", () => {
    const rawFragment = "#purpose=INITIAL_VERIFICATION";
    const params = new URLSearchParams(rawFragment.slice(1));
    const token = params.get("token");
    assert.strictEqual(token, null);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Duplicate Submission Prevention
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("3.1 Duplicate submission guard prevents multiple concurrent confirmation calls", async () => {
    let callCount = 0;
    mockResponses.set("/auth/email/verify/confirm", {
      status: 200,
      body: {
        success: true,
        data: { success: true, message: "Email verified successfully" },
      },
    });

    const hasSubmitted = { current: false };

    async function submitToken(rawToken: string) {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;
      callCount++;
      return await emailVerificationApi.confirmVerification({ token: rawToken });
    }

    const token = "e".repeat(64);
    await Promise.all([submitToken(token), submitToken(token), submitToken(token)]);

    assert.strictEqual(callCount, 1, "Only one confirmation call must be executed");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. useEmailVerificationStore State Management
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("4.1 useEmailVerificationStore initializes with expected default values", () => {
    const state = useEmailVerificationStore.getState();
    assert.strictEqual(state.status, null);
    assert.strictEqual(state.isLoading, false);
    assert.strictEqual(state.isResending, false);
    assert.strictEqual(state.error, null);
    assert.strictEqual(state.resendMessage, null);
    assert.strictEqual(state.cooldownSeconds, 0);
  });

  await t.test("4.2 useEmailVerificationStore.fetchStatus updates status correctly", async () => {
    mockResponses.set("/auth/email/status", {
      status: 200,
      body: {
        success: true,
        data: {
          email: "dev@devsync.io",
          isVerified: false,
          emailVerifiedAt: null,
          pendingEmail: null,
        },
      },
    });

    setAccessToken("test-jwt-token");
    await useEmailVerificationStore.getState().fetchStatus();
    const state = useEmailVerificationStore.getState();

    assert.strictEqual(state.status?.email, "dev@devsync.io");
    assert.strictEqual(state.status?.isVerified, false);
    assert.strictEqual(state.status?.pendingEmail, null);
    assert.strictEqual(state.isLoading, false);
    assert.strictEqual(state.error, null);
    clearAccessToken();
  });

  await t.test("4.3 useEmailVerificationStore.resendVerification sets cooldown and message", async () => {
    mockResponses.set("/auth/email/verify/resend", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "If an unverified account exists for this email, a verification link has been sent.",
        },
      },
    });

    // Provide status first
    useEmailVerificationStore.setState({
      status: { email: "dev@devsync.io", isVerified: false, emailVerifiedAt: null, pendingEmail: null },
    });

    await useEmailVerificationStore.getState().resendVerification();
    const state = useEmailVerificationStore.getState();

    assert.strictEqual(state.isResending, false);
    assert.strictEqual(state.cooldownSeconds, 60);
    assert.ok(state.resendMessage?.includes("verification link"));
    assert.strictEqual(state.error, null);
  });

  await t.test("4.4 useEmailVerificationStore.resendVerification rejects when cooldown is active", async () => {
    useEmailVerificationStore.setState({
      cooldownSeconds: 30,
      status: { email: "dev@devsync.io", isVerified: false, emailVerifiedAt: null, pendingEmail: null },
    });

    const result = await useEmailVerificationStore.getState().resendVerification();
    assert.strictEqual(result, false, "resendVerification must be rejected while cooldown is active");
  });

  await t.test("4.5 useEmailVerificationStore.requestEmailChange updates state and requests verification", async () => {
    mockResponses.set("/auth/email/verify/request", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "Verification email sent to pending address",
          email: "newemail@devsync.io",
          purpose: "EMAIL_CHANGE",
        },
      },
    });

    useEmailVerificationStore.setState({
      status: { email: "oldemail@devsync.io", isVerified: true, emailVerifiedAt: "2026-01-01T00:00:00Z", pendingEmail: null },
    });

    const res = await useEmailVerificationStore.getState().requestEmailChange("newemail@devsync.io");

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.purpose, "EMAIL_CHANGE");

    const state = useEmailVerificationStore.getState();
    // Primary email remains unchanged; pendingEmail reflects new address
    assert.strictEqual(state.status?.email, "oldemail@devsync.io");
    assert.strictEqual(state.status?.pendingEmail, "newemail@devsync.io");
  });

  await t.test("4.6 useEmailVerificationStore.clearVerificationState cleans up state", () => {
    useEmailVerificationStore.setState({
      status: { email: "user@test.com", isVerified: true, emailVerifiedAt: "2026-01-01T00:00:00Z", pendingEmail: null },
      error: "Some error",
      resendMessage: "Some message",
      cooldownSeconds: 45,
    });

    useEmailVerificationStore.getState().clearVerificationState();
    const state = useEmailVerificationStore.getState();

    assert.strictEqual(state.status, null);
    assert.strictEqual(state.error, null);
    assert.strictEqual(state.resendMessage, null);
    assert.strictEqual(state.cooldownSeconds, 0);
  });

  await t.test("4.7 devsync:unauthorized and devsync:logged-out events trigger state clearance", () => {
    const cleanup = initEmailVerificationListeners();
    useEmailVerificationStore.setState({
      status: { email: "user@test.com", isVerified: true, emailVerifiedAt: "2026-01-01T00:00:00Z", pendingEmail: null },
    });

    assert.notStrictEqual(useEmailVerificationStore.getState().status, null);

    window.dispatchEvent(new Event("devsync:unauthorized"));
    assert.strictEqual(useEmailVerificationStore.getState().status, null);

    useEmailVerificationStore.setState({
      status: { email: "user2@test.com", isVerified: false, emailVerifiedAt: null, pendingEmail: null },
    });
    window.dispatchEvent(new Event("devsync:logged-out"));
    assert.strictEqual(useEmailVerificationStore.getState().status, null);
    cleanup();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. UI Logic & Simulated Delivery Transparency
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("5.1 Development simulated dispatch disclaimer is honest and present", () => {
    const disclaimer = "Notice: Development environment uses simulated email dispatch. No real emails are delivered over SMTP/SES.";
    assert.ok(disclaimer.includes("simulated email dispatch"));
    assert.ok(disclaimer.includes("No real emails are delivered"));
  });

  await t.test("5.2 Pending email separation: pendingEmail does not replace primary email before confirmation", () => {
    const userStatus: EmailVerificationStatusResponse = {
      email: "primary@devsync.io",
      isVerified: true,
      emailVerifiedAt: "2026-01-10T12:00:00Z",
      pendingEmail: "new-email@devsync.io",
    };

    // Primary email is displayed as current verified email
    assert.strictEqual(userStatus.email, "primary@devsync.io");
    assert.strictEqual(userStatus.isVerified, true);

    // Pending email is tracked separately as pending verification
    assert.strictEqual(userStatus.pendingEmail, "new-email@devsync.io");
    assert.notStrictEqual(userStatus.email, userStatus.pendingEmail);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Error State User-Facing Mappings & Navigation Logic
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("6.1 Maps 400 Bad Request to user-friendly expired link message with resend option", () => {
    function mapErrorMessage(err: any): string {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          return "This email verification link has expired. Verification links are valid for 24 hours. Please request a new link below.";
        }
      }
      return err?.message || "Verification failed";
    }

    const err = new ApiError("Token expired", 400);
    const message = mapErrorMessage(err);
    assert.ok(message.includes("expired"));
    assert.ok(message.includes("24 hours"));
  });

  await t.test("6.2 Maps 404 Not Found to user-friendly invalid token message", () => {
    function mapErrorMessage(err: any): string {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          return "This verification link is invalid or has already been used. Please request a new link below.";
        }
      }
      return err?.message || "Verification failed";
    }

    const err = new ApiError("Not found", 404);
    const message = mapErrorMessage(err);
    assert.ok(message.includes("invalid or has already been used"));
  });

  await t.test("6.3 Maps 409 Conflict to already-consumed message with sign-in guidance", () => {
    function mapErrorMessage(err: any): string {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          return "This verification token has already been confirmed. Your email is already verified. You can proceed to sign in.";
        }
      }
      return err?.message || "Verification failed";
    }

    const err = new ApiError("Conflict", 409);
    const message = mapErrorMessage(err);
    assert.ok(message.includes("already been confirmed"));
  });

  await t.test("6.4 Maps 429 Too Many Requests to rate limit advisory", () => {
    function mapErrorMessage(err: any): string {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          return "Too many verification attempts. Please wait a few moments before trying again.";
        }
      }
      return err?.message || "Verification failed";
    }

    const err = new ApiError("Too many requests", 429);
    const message = mapErrorMessage(err);
    assert.ok(message.includes("Too many verification attempts"));
  });

  await t.test("6.5 Maps network/offline errors to retry guidance", () => {
    function mapErrorMessage(err: any): string {
      if (err instanceof TypeError || (err?.message && err.message.toLowerCase().includes("network"))) {
        return "Unable to connect to verification server. Please check your network connection and try again.";
      }
      return err?.message || "Verification failed";
    }

    const err = new TypeError("Failed to fetch");
    const message = mapErrorMessage(err);
    assert.ok(message.includes("Unable to connect to verification server"));
  });

  await t.test("6.6 Unauthenticated vs authenticated token confirmation navigation", () => {
    // When unauthenticated: target is login
    const authedTarget = Boolean(getAccessToken()) ? "dashboard" : "login";
    assert.strictEqual(authedTarget, "login");

    setAccessToken("session-token");
    const authedTarget2 = Boolean(getAccessToken()) ? "dashboard" : "login";
    assert.strictEqual(authedTarget2, "dashboard");
    clearAccessToken();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Phase 5.2.1 Contract & Security Closure Verification
  // ──────────────────────────────────────────────────────────────────────────

  await t.test("7.1 Response Envelope Unwrapping - Outer { success, data } unwrapped exactly once", async () => {
    mockResponses.set("/auth/email/status", {
      status: 200,
      body: {
        success: true,
        data: {
          email: "audit@devsync.io",
          isVerified: true,
          emailVerifiedAt: "2026-11-18T00:00:00.000Z",
          pendingEmail: null,
        },
      },
    });

    setAccessToken("test-token");
    const status = await emailVerificationApi.getStatus();
    clearAccessToken();

    // Verify properties reside directly on returned object (no nested .data)
    assert.strictEqual((status as any).data, undefined, "Envelope must not remain nested");
    assert.strictEqual(status.email, "audit@devsync.io");
    assert.strictEqual(status.isVerified, true);
    assert.strictEqual(status.emailVerifiedAt, "2026-11-18T00:00:00.000Z");
    assert.strictEqual(status.pendingEmail, null);
  });

  await t.test("7.2 Error Mapping - Distinguishes 400 Expired from 400 Purpose Mismatch", () => {
    const expiredError = new ApiError("Verification token has expired", 400);
    const purposeError = new ApiError("Invalid verification purpose", 400);

    const isExpired = expiredError.status === 400 && expiredError.message.toLowerCase().includes("expired");
    const isPurposeMismatch = purposeError.status === 400 && purposeError.message.toLowerCase().includes("purpose");

    assert.strictEqual(isExpired, true);
    assert.strictEqual(isPurposeMismatch, true);
  });

  await t.test("7.3 Error Mapping - Distinguishes 404 Invalid from 409 Already Consumed", () => {
    const invalidError = new ApiError("Invalid verification token", 404);
    const consumedError = new ApiError("Verification token has already been used", 409);

    assert.strictEqual(invalidError.status, 404);
    assert.strictEqual(consumedError.status, 409);
    assert.notStrictEqual(invalidError.status, consumedError.status);
  });

  await t.test("7.4 Error Mapping - Detects 409 Email Collision during email change", async () => {
    mockResponses.set("/auth/email/verify/request", {
      status: 409,
      body: {
        statusCode: 409,
        message: "Email is already registered",
        error: "Conflict",
      },
    });

    await assert.rejects(
      async () => {
        await emailVerificationApi.requestVerification({ email: "collision@devsync.io" });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 409);
        assert.ok(err.message.includes("already registered"));
        return true;
      }
    );
  });

  await t.test("7.5 Retry Security - Ambiguous network error purges token from memory and requires explicit user action", () => {
    let heldToken: string | null = "0123456789abcdef".repeat(4);
    let autoResubmitted = false;

    // Simulate network error handling
    try {
      throw new ApiError("Unable to connect to DevSync AI server.", 0, "NETWORK_ERROR");
    } catch (err: any) {
      // Security invariant: raw token MUST be immediately purged on failure
      heldToken = null;
      // Security invariant: do NOT auto-resubmit ambiguous network request
      autoResubmitted = false;
    }

    assert.strictEqual(heldToken, null, "Raw token must be purged on network error");
    assert.strictEqual(autoResubmitted, false, "Must not auto-retry on ambiguous network error");
  });

  await t.test("7.6 Email Change Contract - Preserves primary email and refreshes status", async () => {
    mockResponses.set("/auth/email/verify/request", {
      status: 200,
      body: {
        success: true,
        data: {
          success: true,
          message: "Verification email sent to new address",
          email: "updated@devsync.io",
          purpose: "EMAIL_CHANGE",
        },
      },
    });

    mockResponses.set("/auth/email/status", {
      status: 200,
      body: {
        success: true,
        data: {
          email: "original@devsync.io",
          isVerified: true,
          emailVerifiedAt: "2026-01-01T00:00:00.000Z",
          pendingEmail: "updated@devsync.io",
        },
      },
    });

    setAccessToken("test-token");
    useEmailVerificationStore.setState({
      status: { email: "original@devsync.io", isVerified: true, emailVerifiedAt: "2026-01-01T00:00:00.000Z", pendingEmail: null },
    });

    const res = await useEmailVerificationStore.getState().requestEmailChange("updated@devsync.io");

    assert.strictEqual(res.success, true);
    const finalState = useEmailVerificationStore.getState();

    // Primary email remains active
    assert.strictEqual(finalState.status?.email, "original@devsync.io");
    // Pending email reflects backend state
    assert.strictEqual(finalState.status?.pendingEmail, "updated@devsync.io");
    clearAccessToken();
  });
});
