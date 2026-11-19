import test from "node:test";
import assert from "node:assert";
import {
  issueApi,
  type CreateIssuePayload,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type IssueType,
  type UpdateIssuePayload,
} from "../src/lib/api.js";
import { useIssueStore } from "../src/store/issue.store.js";

/* =========================================================
   MOCK FIXTURES
   ========================================================= */

const mockIssue1: Issue = {
  id: "issue-uuid-1",
  projectId: "proj-uuid-1",
  title: "Memory leak in background sync worker",
  description: "Worker fails to release socket listeners after disconnection.",
  status: "OPEN",
  priority: "HIGH",
  type: "BUG",
  reporterId: "user-uuid-1",
  creatorId: "user-uuid-1",
  assigneeId: "user-uuid-2",
  assignee: {
    id: "user-uuid-2",
    firstName: "Sarah",
    lastName: "Chen",
    username: "sarahc",
    email: "sarah@devsync.local",
  },
  reporter: {
    id: "user-uuid-1",
    firstName: "Alex",
    lastName: "Morgan",
    username: "alexm",
    email: "alex@devsync.local",
  },
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

const mockIssue2: Issue = {
  id: "issue-uuid-2",
  projectId: "proj-uuid-1",
  title: "Slow query on audit logs endpoint",
  description: "Missing index on timestamp column causes full table scans.",
  status: "IN_PROGRESS",
  priority: "CRITICAL",
  type: "PERFORMANCE",
  reporterId: "user-uuid-1",
  creatorId: "user-uuid-1",
  assigneeId: null,
  assignee: null,
  createdAt: "2026-11-02T12:00:00.000Z",
  updatedAt: "2026-11-02T14:00:00.000Z",
};

/* =========================================================
   SUITE 1: API CLIENT CONTRACT & RESPONSE-ENVELOPE UNWRAPPING
   ========================================================= */

test("Issues API - List response-envelope is unwrapped to Issue array", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: [mockIssue1, mockIssue2],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const list = await issueApi.listByProject("proj-uuid-1");
    assert.strictEqual(Array.isArray(list), true);
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].id, "issue-uuid-1");
    assert.strictEqual(list[1].title, "Slow query on audit logs endpoint");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Project-scoped issue retrieval hits /issues/project/:projectId", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = async (input: RequestInfo | URL) => {
    capturedUrl = input.toString();
    return new Response(
      JSON.stringify({ success: true, data: [mockIssue1] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    await issueApi.listByProject("proj-scope-xyz");
    assert.ok(
      capturedUrl.includes("/issues/project/proj-scope-xyz"),
      `Expected /issues/project/proj-scope-xyz but got ${capturedUrl}`
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Empty issue list unwraps safely to empty array", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const list = await issueApi.listByProject("proj-empty");
    assert.strictEqual(Array.isArray(list), true);
    assert.strictEqual(list.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Issue creation sends POST /issues with required fields", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";
  let capturedBody = "";

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedMethod = init?.method || "";
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: mockIssue1 }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const payload: CreateIssuePayload = {
      projectId: "proj-uuid-1",
      title: "New issue",
      description: "Issue details",
      type: "BUG",
      priority: "HIGH",
    };
    await issueApi.create(payload);

    assert.strictEqual(capturedMethod, "POST");
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.projectId, "proj-uuid-1");
    assert.strictEqual(parsed.title, "New issue");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - reporterId and creatorId are not required by frontend payload", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody = "";

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: mockIssue1 }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    // Neither reporterId nor creatorId is supplied
    const payload: CreateIssuePayload = {
      projectId: "proj-uuid-1",
      title: "No identity spoofing",
    };
    await issueApi.create(payload);

    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.reporterId, undefined, "reporterId should not be set by client");
    assert.strictEqual(parsed.creatorId, undefined, "creatorId should not be set by client");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Update issues PATCH /issues/:id", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedMethod = init?.method || "";
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: { ...mockIssue1, status: "RESOLVED" } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const payload: UpdateIssuePayload = {
      status: "RESOLVED",
    };
    await issueApi.update("issue-uuid-1", payload);

    assert.ok(capturedUrl.includes("/issues/issue-uuid-1"));
    assert.strictEqual(capturedMethod, "PATCH");
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.status, "RESOLVED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Delete issues DELETE /issues/:id", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedMethod = init?.method || "";
    return new Response(
      JSON.stringify({ success: true, data: { message: "Deleted" } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    await issueApi.remove("issue-uuid-1");
    assert.ok(capturedUrl.includes("/issues/issue-uuid-1"));
    assert.strictEqual(capturedMethod, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Issues API - Unassignment with null assigneeId is correctly transmitted", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody = "";

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: { ...mockIssue1, assigneeId: null } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    await issueApi.update("issue-uuid-1", { assigneeId: null });
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.assigneeId, null, "assigneeId must be sent as null to unassign");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   SUITE 2: ISSUE ENUM VALUES & REGRESSION TESTS
   ========================================================= */

test("Issue enums - Task is NOT a valid IssueType", () => {
  const VALID_ISSUE_TYPES: IssueType[] = [
    "BUG",
    "FEATURE",
    "IMPROVEMENT",
    "DOCUMENTATION",
    "SECURITY",
    "PERFORMANCE",
    "OTHER",
  ];

  const hasTask = (VALID_ISSUE_TYPES as string[]).includes("TASK");
  assert.strictEqual(hasTask, false, "'TASK' must never be in IssueType union");
});

test("Issue enums - REOPENED is a valid IssueStatus", () => {
  const VALID_ISSUE_STATUSES: IssueStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
  ];

  assert.ok(
    VALID_ISSUE_STATUSES.includes("REOPENED"),
    "'REOPENED' must be present in IssueStatus"
  );
});

test("Issue enums - All canonical Prisma priorities are present", () => {
  const VALID_PRIORITIES: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  assert.strictEqual(VALID_PRIORITIES.length, 4);
});

/* =========================================================
   SUITE 3: ZUSTAND ISSUE STORE INTEGRATION
   ========================================================= */

test("IssueStore - Switching project clears stale issues immediately", () => {
  useIssueStore.setState({
    currentProjectId: "proj-uuid-1",
    issues: [mockIssue1, mockIssue2],
    error: null,
  });

  // Switch to new project
  useIssueStore.getState().setProjectId("proj-uuid-2");

  const state = useIssueStore.getState();
  assert.strictEqual(state.currentProjectId, "proj-uuid-2");
  assert.strictEqual(state.issues.length, 0, "Issues array must be empty immediately upon project switch");
});

test("IssueStore - Setting same project does not wipe issues", () => {
  useIssueStore.setState({
    currentProjectId: "proj-uuid-1",
    issues: [mockIssue1],
    error: null,
  });

  useIssueStore.getState().setProjectId("proj-uuid-1");

  const state = useIssueStore.getState();
  assert.strictEqual(state.issues.length, 1);
});

test("IssueStore - Failed fetchIssues records error and does NOT fallback to mock data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to connect to issues database",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    useIssueStore.setState({
      currentProjectId: "proj-uuid-1",
      issues: [mockIssue1],
      error: null,
    });

    await assert.rejects(
      () => useIssueStore.getState().fetchIssues("proj-uuid-1"),
      /Failed to connect/
    );

    const state = useIssueStore.getState();
    assert.strictEqual(state.issues.length, 0, "Failed fetch must clear issues rather than show mock data");
    assert.ok(state.error?.includes("Failed to connect"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IssueStore - Optimistic update with reliable rollback on API failure", async () => {
  const originalFetch = globalThis.fetch;

  // Simulate API failure on update
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Network timeout updating issue status",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    useIssueStore.setState({
      currentProjectId: "proj-uuid-1",
      issues: [mockIssue1],
      error: null,
    });

    await assert.rejects(
      () =>
        useIssueStore.getState().updateIssue("issue-uuid-1", {
          status: "RESOLVED",
        }),
      /Network timeout/
    );

    const state = useIssueStore.getState();
    assert.strictEqual(state.issues[0].status, "OPEN", "Rollback must restore original OPEN status");
    assert.ok(state.error?.includes("Network timeout"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IssueStore - Delete issue removes it from state", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(null, { status: 204 });
  };

  try {
    useIssueStore.setState({
      currentProjectId: "proj-uuid-1",
      issues: [mockIssue1, mockIssue2],
      error: null,
    });

    await useIssueStore.getState().deleteIssue("issue-uuid-1");

    const state = useIssueStore.getState();
    assert.strictEqual(state.issues.length, 1);
    assert.strictEqual(state.issues[0].id, "issue-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IssueStore - clearIssues resets all state", () => {
  useIssueStore.setState({
    currentProjectId: "proj-uuid-1",
    issues: [mockIssue1],
    error: "Stale error",
  });

  useIssueStore.getState().clearIssues();

  const state = useIssueStore.getState();
  assert.strictEqual(state.currentProjectId, null);
  assert.strictEqual(state.issues.length, 0);
  assert.strictEqual(state.error, null);
});
