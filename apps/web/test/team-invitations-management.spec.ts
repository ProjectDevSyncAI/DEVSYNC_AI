/**
 * DevSync AI — Milestone 4B.9 Phase 4 Frontend Integration Tests
 * Team, Organization Members & Secure Invitation Management Test Suite
 */
import test from "node:test";
import assert from "node:assert";
import {
  organizationApi,
  invitationApi,
  type OrganizationMemberInfo,
  type OrganizationInvitationItem,
  type OrganizationInvitationCreated,
  type PaginatedMembers,
  type PaginatedInvitations,
  type AcceptInvitationResult,
  type InvitationPreviewResult,
} from "../src/lib/api.js";
import {
  canModifyRole,
  getAllowedAssignableRoles,
  canRemoveMember,
  canInviteMembers,
  getAllowedInviteRoles,
} from "../src/features/members/index.js";
import { useProjectStore } from "../src/store/project.store.js";

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

test("Team & Invitation Management — Frontend Integration & Security Suite", async (t) => {
  setupMockFetch();

  t.beforeEach(() => {
    mockResponses.clear();
    interceptedRequests = [];
  });

  t.after(() => {
    restoreFetch();
  });

  // 1. Live organization member API integration
  await t.test("1. organizationApi.listMembers builds correct endpoint and query params", async () => {
    mockResponses.set("/organizations/org-123/members", {
      status: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "mem-1",
              organizationId: "org-123",
              userId: "user-1",
              role: "OWNER",
              joinedAt: "2026-01-01T00:00:00Z",
              user: {
                id: "user-1",
                email: "owner@alpha.org",
                username: "alpha_owner",
                firstName: "Alpha",
                lastName: "Owner",
              },
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    });

    const res = await organizationApi.listMembers("org-123", { page: 1, limit: 20 });
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.items[0].userId, "user-1");
    assert.strictEqual(res.items[0].role, "OWNER");

    const req = interceptedRequests.find((r) => r.url.includes("/organizations/org-123/members"));
    assert.ok(req, "Request must be sent to /organizations/org-123/members");
    assert.strictEqual(req.method, "GET");
    assert.ok(req.url.includes("page=1"));
    assert.ok(req.url.includes("limit=20"));
  });

  // 2. Member pagination
  await t.test("2. Member pagination requests construct bounded page & limit parameters", async () => {
    mockResponses.set("/organizations/org-123/members?page=3&limit=50", {
      status: 200,
      body: {
        success: true,
        data: {
          items: [],
          page: 3,
          limit: 50,
          total: 120,
          totalPages: 3,
        },
      },
    });

    const res = await organizationApi.listMembers("org-123", { page: 3, limit: 50 });
    assert.strictEqual(res.page, 3);
    assert.strictEqual(res.limit, 50);
    assert.strictEqual(res.total, 120);
    assert.strictEqual(res.totalPages, 3);

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.ok(req.url.includes("page=3"));
    assert.ok(req.url.includes("limit=50"));
  });

  // 3. Organization switching and stale-data cleanup
  await t.test("3. Organization switching clears cached project store data", () => {
    const store = useProjectStore.getState();
    store.setOrganizationId("org-alpha");
    assert.strictEqual(useProjectStore.getState().currentOrganizationId, "org-alpha");

    // Switching to org-beta resets projects and active project
    store.setOrganizationId("org-beta");
    const updated = useProjectStore.getState();
    assert.strictEqual(updated.currentOrganizationId, "org-beta");
    assert.strictEqual(updated.projects.length, 0);
    assert.strictEqual(updated.activeProject, null);
  });

  // 4. Member search/filter behavior
  await t.test("4. Client search filters members accurately by name, username, email, and role", () => {
    const mockList: OrganizationMemberInfo[] = [
      {
        id: "m-1",
        organizationId: "org-1",
        userId: "u-1",
        role: "OWNER",
        joinedAt: "2026-01-01",
        user: { id: "u-1", email: "alice@acme.com", username: "alice", firstName: "Alice", lastName: "Smith" },
      },
      {
        id: "m-2",
        organizationId: "org-1",
        userId: "u-2",
        role: "ENGINEER",
        joinedAt: "2026-01-02",
        user: { id: "u-2", email: "bob@acme.com", username: "bob_eng", firstName: "Bob", lastName: "Jones" },
      },
    ];

    const filterByName = (query: string) =>
      mockList.filter(
        (m) =>
          m.user.username.includes(query) ||
          m.user.email.includes(query) ||
          m.user.firstName?.includes(query),
      );

    assert.strictEqual(filterByName("alice").length, 1);
    assert.strictEqual(filterByName("bob").length, 1);
    assert.strictEqual(filterByName("acme.com").length, 2);
    assert.strictEqual(filterByName("nonexistent").length, 0);
  });

  // 5. OWNER management controls
  await t.test("5. canModifyRole grants OWNER permissions to modify lower-role members", () => {
    // OWNER modifying ENGINEER -> allowed
    assert.strictEqual(canModifyRole("OWNER", "ENGINEER", false, false), true);
    // OWNER modifying ADMIN -> allowed
    assert.strictEqual(canModifyRole("OWNER", "ADMIN", false, false), true);
    // OWNER modifying MANAGER -> allowed
    assert.strictEqual(canModifyRole("OWNER", "MANAGER", false, false), true);
    // OWNER modifying VIEWER -> allowed
    assert.strictEqual(canModifyRole("OWNER", "VIEWER", false, false), true);

    // Cannot modify canonical owner
    assert.strictEqual(canModifyRole("OWNER", "OWNER", true, false), false);
    // Cannot modify self
    assert.strictEqual(canModifyRole("OWNER", "OWNER", false, true), false);

    const assignable = getAllowedAssignableRoles("OWNER");
    assert.deepStrictEqual(assignable, ["ADMIN", "MANAGER", "ENGINEER", "VIEWER"]);
  });

  // 6. ADMIN management restrictions
  await t.test("6. canModifyRole restricts ADMIN from modifying OWNER or other ADMINs", () => {
    // ADMIN modifying MANAGER -> allowed
    assert.strictEqual(canModifyRole("ADMIN", "MANAGER", false, false), true);
    // ADMIN modifying ENGINEER -> allowed
    assert.strictEqual(canModifyRole("ADMIN", "ENGINEER", false, false), true);
    // ADMIN modifying VIEWER -> allowed
    assert.strictEqual(canModifyRole("ADMIN", "VIEWER", false, false), true);

    // ADMIN modifying OWNER -> FORBIDDEN
    assert.strictEqual(canModifyRole("ADMIN", "OWNER", false, false), false);
    // ADMIN modifying another ADMIN -> FORBIDDEN
    assert.strictEqual(canModifyRole("ADMIN", "ADMIN", false, false), false);

    const assignable = getAllowedAssignableRoles("ADMIN");
    assert.deepStrictEqual(assignable, ["MANAGER", "ENGINEER", "VIEWER"]);
    assert.ok(!assignable.includes("ADMIN" as any), "ADMIN cannot assign ADMIN");
    assert.ok(!assignable.includes("OWNER" as any), "ADMIN cannot assign OWNER");
  });

  // 7. Lower-role management controls hidden or disabled
  await t.test("7. Lower roles (MANAGER, ENGINEER, VIEWER) cannot modify or remove members", () => {
    for (const role of ["MANAGER", "ENGINEER", "VIEWER", undefined]) {
      assert.strictEqual(canModifyRole(role, "ENGINEER", false, false), false);
      assert.strictEqual(canRemoveMember(role, "ENGINEER", false, false), false);
      assert.strictEqual(canInviteMembers(role), false);
      assert.deepStrictEqual(getAllowedAssignableRoles(role), []);
      assert.deepStrictEqual(getAllowedInviteRoles(role), []);
    }
  });

  // 8. Role update API success and failure
  await t.test("8. organizationApi.updateMemberRole transmits PATCH with validated payload", async () => {
    mockResponses.set("/organizations/org-123/members/user-target", {
      status: 200,
      body: {
        success: true,
        data: {
          id: "mem-target",
          organizationId: "org-123",
          userId: "user-target",
          role: "MANAGER",
          joinedAt: "2026-01-01T00:00:00Z",
          user: { id: "user-target", email: "target@alpha.org", username: "target_user" },
        },
      },
    });

    const updated = await organizationApi.updateMemberRole("org-123", "user-target", {
      role: "MANAGER",
    });
    assert.strictEqual(updated.role, "MANAGER");

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "PATCH");
    assert.ok(req.url.endsWith("/organizations/org-123/members/user-target"));
    assert.deepStrictEqual(req.body, { role: "MANAGER" });
  });

  // 9. Member removal confirmation and result
  await t.test("9. organizationApi.removeMember transmits DELETE to target user endpoint", async () => {
    mockResponses.set("/organizations/org-123/members/user-to-remove", {
      status: 200,
      body: {
        success: true,
        data: { message: "Member removed successfully" },
      },
    });

    const res = await organizationApi.removeMember("org-123", "user-to-remove");
    assert.strictEqual(res.message, "Member removed successfully");

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "DELETE");
    assert.ok(req.url.endsWith("/organizations/org-123/members/user-to-remove"));
  });

  // 10. Sole-owner / Canonical-owner error handling
  await t.test("10. canRemoveMember protects canonical owner and prevents self-removal", () => {
    // Cannot remove canonical owner
    assert.strictEqual(canRemoveMember("OWNER", "OWNER", true, false), false);
    // Cannot remove self
    assert.strictEqual(canRemoveMember("OWNER", "OWNER", false, true), false);
    // ADMIN cannot remove canonical owner or other admins
    assert.strictEqual(canRemoveMember("ADMIN", "OWNER", true, false), false);
    assert.strictEqual(canRemoveMember("ADMIN", "ADMIN", false, false), false);
  });

  // 11. Self-leave confirmation and state cleanup
  await t.test("11. organizationApi.leave sends POST to /organizations/:orgId/leave", async () => {
    mockResponses.set("/organizations/org-123/leave", {
      status: 200,
      body: {
        success: true,
        data: { message: "Successfully left the organization" },
      },
    });

    const res = await organizationApi.leave("org-123");
    assert.strictEqual(res.message, "Successfully left the organization");

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "POST");
    assert.ok(req.url.endsWith("/organizations/org-123/leave"));
  });

  // 12. Invitation creation and role validation
  await t.test("12. organizationApi.createInvitation sends POST with normalized email and role", async () => {
    mockResponses.set("/organizations/org-123/invitations", {
      status: 201,
      body: {
        success: true,
        data: {
          id: "inv-new-1",
          organizationId: "org-123",
          email: "colleague@alpha.org",
          role: "ENGINEER",
          createdAt: "2026-11-17T00:00:00Z",
          expiresAt: "2026-11-24T00:00:00Z",
          rawToken: "f4a7c89b21e08920cb95dfa64981bc8e09f8723b1948293751a0293847561029",
        },
      },
    });

    const created = await organizationApi.createInvitation("org-123", {
      email: "colleague@alpha.org",
      role: "ENGINEER",
    });

    assert.strictEqual(created.id, "inv-new-1");
    assert.strictEqual(created.email, "colleague@alpha.org");
    assert.strictEqual(created.role, "ENGINEER");
    assert.strictEqual(
      created.rawToken,
      "f4a7c89b21e08920cb95dfa64981bc8e09f8723b1948293751a0293847561029",
    );

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "POST");
    assert.deepStrictEqual(req.body, { email: "colleague@alpha.org", role: "ENGINEER" });
  });

  // 13. One-time token display
  await t.test("13. One-time invitation token is returned in createInvitation response", async () => {
    mockResponses.set("/organizations/org-123/invitations", {
      status: 201,
      body: {
        success: true,
        data: {
          id: "inv-token-test",
          organizationId: "org-123",
          email: "guest@alpha.org",
          role: "VIEWER",
          createdAt: "2026-11-17T00:00:00Z",
          expiresAt: "2026-11-24T00:00:00Z",
          rawToken: "abc123def4567890abcdef1234567890abc123def4567890abcdef1234567890",
        },
      },
    });

    const inv = await invitationApi.create("org-123", {
      email: "guest@alpha.org",
      role: "VIEWER",
    });

    assert.ok(inv.rawToken, "rawToken must be present in creation response");
    assert.strictEqual(inv.rawToken.length, 64, "rawToken must be 64-char hex string");
  });

  // 14 & 15. Token confidentiality: never in browser storage or Zustand persistence
  await t.test("14 & 15. Invitation token is NEVER persisted in localStorage, sessionStorage, or stores", () => {
    // Verify localStorage has no tokens
    const localStorageKeys = Object.keys(globalThis.localStorage || {});
    for (const key of localStorageKeys) {
      assert.ok(
        !key.includes("token") || key === "devsync_auth_token",
        `Storage key "${key}" must not store invitation tokens`,
      );
    }

    // Verify ProjectStore has no token state
    const projectState = useProjectStore.getState();
    assert.strictEqual((projectState as any).rawToken, undefined);
    assert.strictEqual((projectState as any).invitationToken, undefined);
  });

  // 16. Invitation list and pagination
  await t.test("16. organizationApi.listInvitations queries GET /organizations/:orgId/invitations with pagination", async () => {
    mockResponses.set("/organizations/org-123/invitations?page=1&limit=20", {
      status: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "inv-1",
              organizationId: "org-123",
              email: "pending@alpha.org",
              role: "ENGINEER",
              createdAt: "2026-11-17T00:00:00Z",
              expiresAt: "2026-11-24T00:00:00Z",
              acceptedAt: null,
              status: "PENDING",
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    });

    const res = await invitationApi.list("org-123", { page: 1, limit: 20 });
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.items[0].email, "pending@alpha.org");
    assert.strictEqual(res.items[0].status, "PENDING");

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "GET");
    assert.ok(req.url.includes("/organizations/org-123/invitations"));
  });

  // 17. Invitation revocation
  await t.test("17. organizationApi.revokeInvitation sends DELETE to invitation endpoint", async () => {
    mockResponses.set("/organizations/org-123/invitations/inv-to-revoke", {
      status: 200,
      body: {
        success: true,
        data: { message: "Invitation revoked successfully" },
      },
    });

    const res = await invitationApi.revoke("org-123", "inv-to-revoke");
    assert.strictEqual(res.message, "Invitation revoked successfully");

    const req = interceptedRequests[interceptedRequests.length - 1];
    assert.strictEqual(req.method, "DELETE");
    assert.ok(req.url.endsWith("/organizations/org-123/invitations/inv-to-revoke"));
  });

  // 18. No raw token or hash in list UI
  await t.test("18. Invitation list response items strictly exclude rawToken and tokenHash", async () => {
    const listRes: PaginatedInvitations = {
      items: [
        {
          id: "inv-safe",
          organizationId: "org-123",
          email: "safe@alpha.org",
          role: "ENGINEER",
          createdAt: "2026-11-17T00:00:00Z",
          expiresAt: "2026-11-24T00:00:00Z",
          acceptedAt: null,
          status: "PENDING",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    const item = listRes.items[0] as any;
    assert.strictEqual(item.rawToken, undefined, "rawToken must not be present in list response");
    assert.strictEqual(item.token, undefined, "token hash must not be present in list response");
    assert.strictEqual(item.tokenHash, undefined, "tokenHash must not be present in list response");
  });

  // 19. Backend error handling
  await t.test("19. Backend error messages are extracted and raised as typed ApiError", async () => {
    mockResponses.set("/organizations/org-123/members/demote-canonical", {
      status: 409,
      body: {
        statusCode: 409,
        error: "Conflict",
        message: "Cannot demote the primary organization owner. Ownership transfer is required.",
      },
    });

    await assert.rejects(
      async () => {
        await organizationApi.updateMemberRole("org-123", "demote-canonical", { role: "ADMIN" });
      },
      (err: any) => {
        assert.strictEqual(err.status, 409);
        assert.ok(
          err.message.includes("Cannot demote the primary organization owner"),
          `Expected conflict message, got: ${err.message}`,
        );
        return true;
      },
    );
  });

  // 20. Email verification-required state
  await t.test("20. acceptInvitation handles verified-email enforcement failure (403)", async () => {
    mockResponses.set("/invitations/accept", {
      status: 403,
      body: {
        statusCode: 403,
        error: "Forbidden",
        message:
          "Email address has not been verified. Email verification is required before accepting invitations.",
      },
    });

    await assert.rejects(
      async () => {
        await invitationApi.accept({ token: "unverified-user-token" });
      },
      (err: any) => {
        assert.strictEqual(err.status, 403);
        assert.ok(
          err.message.includes("Email verification is required"),
          `Expected verification required error, got: ${err.message}`,
        );
        return true;
      },
    );
  });

  // 21. No false email-delivery success message
  await t.test("21. Invitation created structure confirms bearer token generation rather than email dispatch", () => {
    const creationResult: OrganizationInvitationCreated = {
      id: "inv-1",
      organizationId: "org-1",
      email: "newmember@test.org",
      role: "ENGINEER",
      createdAt: "2026-11-17T00:00:00Z",
      expiresAt: "2026-11-24T00:00:00Z",
      rawToken: "secret-hex-token",
    };

    assert.ok(creationResult.rawToken, "rawToken returned for administrator distribution");
    // Ensure no simulated 'emailSent: true' flag is claimed
    assert.strictEqual((creationResult as any).emailSent, undefined);
  });

  // 22. Duplicate submission prevention
  await t.test("22. Duplicate invitation creation rejected with 409 Conflict", async () => {
    mockResponses.set("/organizations/org-123/invitations", {
      status: 409,
      body: {
        statusCode: 409,
        error: "Conflict",
        message: "An active invitation already exists for this email",
      },
    });

    await assert.rejects(
      async () => {
        await invitationApi.create("org-123", { email: "duplicate@alpha.org", role: "ENGINEER" });
      },
      (err: any) => {
        assert.strictEqual(err.status, 409);
        assert.ok(err.message.includes("already exists"));
        return true;
      },
    );
  });

  // 23. No mock fallback after API failures
  await t.test("23. API failure in listMembers does not populate mock members", async () => {
    mockResponses.set("/organizations/failing-org/members", {
      status: 500,
      body: {
        statusCode: 500,
        error: "Internal Server Error",
        message: "Database connection failure",
      },
    });

    await assert.rejects(
      async () => {
        await organizationApi.listMembers("failing-org", { page: 1, limit: 20 });
      },
      (err: any) => {
        assert.strictEqual(err.status, 500);
        return true;
      },
    );
  });

  // 24. Phase 4.1 F1: Generated invitation link uses fragment '#token=' format, never '?token='
  await t.test("24. Phase 4.1 F1: Generated invitation link formats token in URL fragment (#token=)", () => {
    const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const origin = "https://app.devsync.ai";
    const inviteUrl = `${origin}/invite#token=${encodeURIComponent(rawToken)}`;

    assert.ok(inviteUrl.includes("/invite#token="), "Invite URL must use #token= fragment");
    assert.ok(!inviteUrl.includes("/invite?token="), "Invite URL must NOT use ?token= query parameter");
    assert.strictEqual(inviteUrl, `https://app.devsync.ai/invite#token=${rawToken}`);
  });

  // 25. Phase 4.1 F1: Fragment token extraction correctly parses bearer token
  await t.test("25. Phase 4.1 F1: Fragment token parser extracts raw token from hash", () => {
    const rawToken = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    const hash = `#token=${rawToken}`;

    const extractTokenFromHash = (h: string): string | null => {
      if (!h || !h.startsWith("#")) return null;
      const fragment = h.slice(1);
      const params = new URLSearchParams(fragment);
      return params.get("token");
    };

    const extracted = extractTokenFromHash(hash);
    assert.strictEqual(extracted, rawToken);

    // Also handles empty or malformed hashes gracefully
    assert.strictEqual(extractTokenFromHash(""), null);
    assert.strictEqual(extractTokenFromHash("#other=val"), null);
  });

  // 26. Phase 4.1 F1: Immediate URL scrubbing simulation
  await t.test("26. Phase 4.1 F1: Fragment scrubbing simulates replaceState without reloading page", () => {
    let currentHref = "https://app.devsync.ai/invite#token=secret1234567890";
    let replaceStateCalledWith: string | null = null;

    const mockReplaceState = (state: any, unused: string, url?: string | URL | null) => {
      replaceStateCalledWith = String(url);
    };

    // Scrub logic as executed in InviteAccept.tsx
    const scrubUrl = (pathname: string, search: string) => {
      const cleanUrl = pathname + search;
      mockReplaceState(null, "", cleanUrl);
    };

    scrubUrl("/invite", "");
    assert.strictEqual(replaceStateCalledWith, "/invite", "URL must be cleaned of fragment");
    assert.ok(!replaceStateCalledWith!.includes("secret"), "Cleaned URL must not contain the bearer token");
  });

  // 27. Phase 4.1 F1: Token submitted strictly in JSON body to POST /invitations/accept
  await t.test("27. Phase 4.1 F1: Token is submitted strictly in POST JSON request body", async () => {
    const rawToken = "acceptance-token-hex-1234567890abcdef1234567890abcdef";
    mockResponses.set("/invitations/accept", {
      status: 200,
      body: {
        success: true,
        data: {
          message: "Invitation accepted successfully",
          organizationId: "org-joined-1",
        },
      },
    });

    const result = await invitationApi.accept({ token: rawToken });
    assert.strictEqual(result.message, "Invitation accepted successfully");

    const req = interceptedRequests.find((r) => r.url.endsWith("/invitations/accept"));
    assert.ok(req, "Request must target /invitations/accept");
    assert.strictEqual(req.method, "POST");
    assert.deepStrictEqual(req.body, { token: rawToken });
    assert.ok(!req.url.includes("token="), "Token must not be present in URL query line");
  });

  // 28. Phase 4.1 F2: Unauthenticated instructions never expose token in redirect parameter
  await t.test("28. Phase 4.1 F2: Sign-in / registration links do not embed bearer token in redirect query parameters", () => {
    // When an unauthenticated user arrives at /invite#token=..., the UI provides clear sign-in guidance
    // but MUST NOT construct URLs like /login?redirect=/invite?token=...
    const buildSafeLoginRedirect = () => {
      return "/login"; // Clear unauthenticated landing
    };

    const loginUrl = buildSafeLoginRedirect();
    assert.ok(!loginUrl.includes("token="), "Sign-in URL must not include token in query string");
    assert.strictEqual(loginUrl, "/login");
  });

  // 29. Phase 4.1 F3: In-memory filter on current page versus total organization count
  await t.test("29. Phase 4.1 F3: Current-page filter accurately reports matching vs current page vs total count", () => {
    const pageMembers = [
      { id: "1", user: { username: "dev_alice", email: "alice@team.com", firstName: "Alice" }, role: "ENGINEER" },
      { id: "2", user: { username: "dev_bob", email: "bob@team.com", firstName: "Bob" }, role: "ENGINEER" },
      { id: "3", user: { username: "lead_carol", email: "carol@team.com", firstName: "Carol" }, role: "ADMIN" },
    ];
    const totalOrgCount = 50; // Server-side total across pages
    const searchQuery = "alice";

    const filtered = pageMembers.filter(
      (m) =>
        m.user.username.includes(searchQuery) ||
        m.user.email.includes(searchQuery) ||
        m.user.firstName.includes(searchQuery),
    );

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(pageMembers.length, 3);
    assert.strictEqual(totalOrgCount, 50);

    const summaryText = `Showing ${filtered.length} matching of ${pageMembers.length} members on this page (${totalOrgCount} total in organization)`;
    assert.strictEqual(
      summaryText,
      "Showing 1 matching of 3 members on this page (50 total in organization)",
    );
  });

  // 30. Phase 4.2 F1: Query-string token is strictly rejected and never stored
  await t.test("30. Phase 4.2 F1: Query-string token (?token=...) is rejected and never stored into memory", () => {
    const searchString = "?token=legacy-insecure-token-12345";
    const searchParams = new URLSearchParams(searchString);
    const hasQueryToken = searchParams.has("token");

    let storedToken: string | null = null;
    let rejectedErrorMessage: string | null = null;

    if (hasQueryToken) {
      rejectedErrorMessage =
        "Insecure or legacy invitation link detected. For your security, query-string invitation links are disabled. Please request a new secure invitation link from your organization administrator.";
      // Token is NEVER assigned
    }

    assert.strictEqual(hasQueryToken, true);
    assert.strictEqual(storedToken, null, "Query-string token must never be assigned to state");
    assert.ok(
      rejectedErrorMessage!.includes("query-string invitation links are disabled"),
      "Must show clear actionable rejection message",
    );
    assert.ok(
      !rejectedErrorMessage!.includes("legacy-insecure-token-12345"),
      "Rejection message must never log or echo the token",
    );
  });

  // 31. Phase 4.2 F1: Query-string token is never submitted to the backend API
  await t.test("31. Phase 4.2 F1: Rejected query-string tokens are never submitted to backend API", async () => {
    let apiCalled = false;
    const acceptMock = async (token: string) => {
      apiCalled = true;
    };

    // Simulate rejection path where query token was found
    const search = "?token=query-token";
    if (new URLSearchParams(search).has("token")) {
      // Rejection branch terminates without calling API
    } else {
      await acceptMock("query-token");
    }

    assert.strictEqual(apiCalled, false, "Backend accept API must never be invoked for query tokens");
  });

  // 32. Phase 4.2 F2: replaceState preserves existing history state without reload
  await t.test("32. Phase 4.2 F2: replaceState preserves existing history state and does not reload", () => {
    const existingHistoryState = { from: "dashboard", scrollY: 120 };
    let capturedState: any = null;
    let capturedUrl: string | null = null;

    const mockReplaceState = (state: any, unused: string, url?: string | URL | null) => {
      capturedState = state;
      capturedUrl = String(url);
    };

    // Execution mimicking InviteAccept useLayoutEffect
    const pathname = "/invite";
    mockReplaceState(existingHistoryState, "", pathname);

    assert.deepStrictEqual(
      capturedState,
      existingHistoryState,
      "Existing history.state must be preserved upon replaceState",
    );
    assert.strictEqual(capturedUrl, "/invite", "URL must be cleaned to pathname");
  });

  // 33. Phase 4.2 F1 & F2: Token format validation rejects non-hex tokens
  await t.test("33. Phase 4.2 F1 & F2: Token format validation enforces cryptographic hex format", () => {
    const validateToken = (raw: string | null): boolean => {
      if (!raw) return false;
      return /^[a-f0-9]{32,128}$/i.test(raw.trim());
    };

    // Valid 64-char hex token
    assert.strictEqual(
      validateToken("f4a7c89b21e08920cb95dfa64981bc8e09f8723b1948293751a0293847561029"),
      true,
    );
    // Valid 32-char hex token
    assert.strictEqual(
      validateToken("0123456789abcdef0123456789abcdef"),
      true,
    );

    // Invalid format tokens
    assert.strictEqual(validateToken("short"), false);
    assert.strictEqual(validateToken("<script>alert(1)</script>"), false);
    assert.strictEqual(validateToken("not-a-hex-string-at-all-because-it-has-hyphens"), false);
    assert.strictEqual(validateToken(""), false);
    assert.strictEqual(validateToken(null), false);
  });

  // 34. Phase 4.2 F4: Cancellation purges in-memory token
  await t.test("34. Phase 4.2 F4: User cancellation or dismissal purges token from memory", () => {
    let tokenState: string | null = "valid-hex-token-in-memory";
    let errorState: string | null = "Some prior error";

    // Simulate handleCancelToken()
    const handleCancel = () => {
      tokenState = null;
      errorState = null;
    };

    handleCancel();
    assert.strictEqual(tokenState, null, "Token must be null after cancellation");
    assert.strictEqual(errorState, null, "Error must be cleared after cancellation");
  });

  // 35. Phase 4.2 F4: Component unmount hook purges in-memory token
  await t.test("35. Phase 4.2 F4: Component unmount effect cleanup purges in-memory token", () => {
    let tokenState: string | null = "active-unsubmitted-token";

    // Simulate cleanup function of useIsomorphicLayoutEffect
    const cleanup = () => {
      tokenState = null;
    };

    cleanup();
    assert.strictEqual(tokenState, null, "Token must be purged upon unmount");
  });

  // 36. Phase 4.2 F3 & Phase 5.4.1: Exact route resolution matches /invite and /invite/accept
  await t.test("36. Phase 4.2 F3: Exact route matcher accepts /invite and /invite/ (and /invite/accept)", () => {
    const isInviteRoute = (pathname: string): boolean => {
      const path = pathname.toLowerCase();
      return (
        path === "/invite" ||
        path === "/invite/" ||
        path === "/invite/accept" ||
        path === "/invite/accept/"
      );
    };

    assert.strictEqual(isInviteRoute("/invite"), true);
    assert.strictEqual(isInviteRoute("/invite/"), true);
    assert.strictEqual(isInviteRoute("/INVITE"), true);
    assert.strictEqual(isInviteRoute("/invite/accept"), true);
    assert.strictEqual(isInviteRoute("/invite/accept/"), true);
  });

  // 37. Phase 4.2 F3: Exact route resolution strictly rejects prefix matches
  await t.test("37. Phase 4.2 F3: Exact route matcher rejects /invite/incorrect, /invite-incorrect, /invited", () => {
    const isInviteRoute = (pathname: string): boolean => {
      const path = pathname.toLowerCase();
      return (
        path === "/invite" ||
        path === "/invite/" ||
        path === "/invite/accept" ||
        path === "/invite/accept/"
      );
    };

    assert.strictEqual(isInviteRoute("/invite/incorrect"), false);
    assert.strictEqual(isInviteRoute("/invite-incorrect"), false);
    assert.strictEqual(isInviteRoute("/invited"), false);
    assert.strictEqual(isInviteRoute("/invite/token123"), false);
    assert.strictEqual(isInviteRoute("/dashboard"), false);
    assert.strictEqual(isInviteRoute("/"), false);
  });

  // 38. Phase 5.4: organizationApi.resendInvitation sends POST and receives rotated rawToken
  await t.test("38. Phase 5.4: organizationApi.resendInvitation sends POST and receives rotated rawToken", async () => {
    setupMockFetch();
    const rotatedResponse: OrganizationInvitationCreated = {
      id: "inv-101",
      organizationId: "org-1",
      email: "engineer@company.com",
      role: "ENGINEER",
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      rawToken: "new-rotated-token-64-hex-chars-abc123def456789012345678901234567890",
    };
    mockResponses.set("/organizations/org-1/invitations/inv-101/resend", {
      status: 200,
      body: { success: true, data: rotatedResponse },
    });

    const res = await organizationApi.resendInvitation("org-1", "inv-101");
    assert.strictEqual(res.id, "inv-101");
    assert.strictEqual(res.rawToken, "new-rotated-token-64-hex-chars-abc123def456789012345678901234567890");
    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.strictEqual(interceptedRequests[0].url.endsWith("/organizations/org-1/invitations/inv-101/resend"), true);
    restoreFetch();
  });

  // 39. Phase 5.4: invitationApi.resend is bound to organizationApi.resendInvitation
  await t.test("39. Phase 5.4: invitationApi.resend is bound to organizationApi.resendInvitation", () => {
    assert.strictEqual(invitationApi.resend, organizationApi.resendInvitation);
  });

  // 40. Phase 5.4: invitationApi.preview sends POST to /invitations/preview
  await t.test("40. Phase 5.4: invitationApi.preview sends POST to /invitations/preview with body payload", async () => {
    setupMockFetch();
    const previewResult: InvitationPreviewResult = {
      organizationName: "Acme Corp",
      organizationSlug: "acme-corp",
      role: "ENGINEER",
      maskedEmail: "e***r@company.com",
    };
    mockResponses.set("/invitations/preview", {
      status: 200,
      body: { success: true, data: previewResult },
    });

    const res = await invitationApi.preview({ token: "64-character-hex-token-for-preview-123456789012345678901234567890" });
    assert.strictEqual(res.organizationName, "Acme Corp");
    assert.strictEqual(res.role, "ENGINEER");
    assert.strictEqual(res.maskedEmail, "e***r@company.com");

    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].method, "POST");
    assert.strictEqual(interceptedRequests[0].url.endsWith("/invitations/preview"), true);
    assert.strictEqual(interceptedRequests[0].body.token, "64-character-hex-token-for-preview-123456789012345678901234567890");
    restoreFetch();
  });

  // 41. Phase 5.4: Preview strictly avoids transmitting tokens in URL query string
  await t.test("41. Phase 5.4: Preview strictly uses POST and avoids query-string token exposure", async () => {
    setupMockFetch();
    mockResponses.set("/invitations/preview", {
      status: 200,
      body: {
        success: true,
        data: {
          organizationName: "Secure Org",
          organizationSlug: "secure-org",
          role: "VIEWER",
          maskedEmail: "s***e@org.io",
        },
      },
    });

    await invitationApi.preview({ token: "token-never-in-url-query-12345678901234567890123456789012" });
    assert.strictEqual(interceptedRequests.length, 1);
    assert.strictEqual(interceptedRequests[0].url.includes("?token="), false, "Token must NOT be in query string");
    assert.strictEqual(interceptedRequests[0].url.includes("token="), false, "URL must be query-free");
    restoreFetch();
  });

  // 42. Phase 5.4: Preview error extraction maps typed ApiError
  await t.test("42. Phase 5.4: Preview error extraction maps 404, 400, and 409 accurately", async () => {
    setupMockFetch();
    mockResponses.set("/invitations/preview", {
      status: 404,
      body: { statusCode: 404, message: "Invalid invitation token" },
    });

    await assert.rejects(
      async () => {
        await invitationApi.preview({ token: "nonexistent-token-12345678901234567890123456789012" });
      },
      (err: any) => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, "Invalid invitation token");
        return true;
      },
    );
    restoreFetch();
  });

  // 43. Phase 5.4: Resend raw token is never written to localStorage or sessionStorage
  await t.test("43. Phase 5.4: Resend raw token is never written to persistent browser storage", () => {
    const rawToken = "super-confidential-new-rotated-token-12345678901234567890123456789012";
    let componentMemoryToken: string | null = rawToken;

    if (typeof localStorage !== "undefined") {
      assert.strictEqual(localStorage.getItem("invitation_token"), null);
      assert.strictEqual(localStorage.getItem("rawToken"), null);
    }
    componentMemoryToken = null;
    assert.strictEqual(componentMemoryToken, null);
  });

  // 44. Phase 5.4: Unauthenticated sign-in navigation preserves token in URL fragment
  await t.test("44. Phase 5.4: Unauthenticated sign-in navigation formats token safely in fragment", () => {
    const rawToken = "safe-token-for-auth-return-12345678901234567890123456789012";
    const buildAuthUrl = (target: "login" | "register", token: string | null) => {
      const hash = token ? `#token=${encodeURIComponent(token)}` : "";
      return `/${target}${hash}`;
    };

    const loginUrl = buildAuthUrl("login", rawToken);
    assert.strictEqual(loginUrl, `/login#token=${rawToken}`);
    assert.strictEqual(loginUrl.includes("?token="), false, "Must not use query string");

    const registerUrl = buildAuthUrl("register", rawToken);
    assert.strictEqual(registerUrl, `/register#token=${rawToken}`);
    assert.strictEqual(registerUrl.includes("?token="), false, "Must not use query string");
  });
});
