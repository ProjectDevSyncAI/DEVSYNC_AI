import test from "node:test";
import assert from "node:assert";
import {
  sprintApi,
  taskApi,
  type CreateSprintPayload,
  type Sprint,
  type SprintStatus,
  type UpdateSprintPayload,
} from "../src/lib/api.js";
import { useSprintStore } from "../src/store/sprint.store.js";

/* =========================================================
   MOCK FIXTURES
   ========================================================= */

const mockSprint1: Sprint = {
  id: "sprint-uuid-1",
  projectId: "proj-uuid-1",
  creatorId: "user-uuid-1",
  name: "Sprint 01 · Foundation",
  goal: "Build foundational database models and authentication",
  status: "ACTIVE",
  startDate: "2026-11-01T00:00:00.000Z",
  endDate: "2026-11-14T23:59:59.000Z",
  capacity: 40,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const mockSprint2: Sprint = {
  id: "sprint-uuid-2",
  projectId: "proj-uuid-1",
  creatorId: "user-uuid-1",
  name: "Sprint 02 · Product Delivery",
  goal: "Ship frontend workspace and real-time dashboard",
  status: "PLANNED",
  startDate: "2026-11-15T00:00:00.000Z",
  endDate: "2026-11-28T23:59:59.000Z",
  capacity: 35,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

/* =========================================================
   SUITE 1: API CLIENT CONTRACT & RESPONSE ENVELOPE
   ========================================================= */

test("Sprints API - List response envelope unwraps to Sprint array", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: [mockSprint1, mockSprint2],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const list = await sprintApi.list("proj-uuid-1");
    assert.strictEqual(Array.isArray(list), true);
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].id, "sprint-uuid-1");
    assert.strictEqual(list[1].name, "Sprint 02 · Product Delivery");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Project-scoped sprint retrieval passes ?projectId= query param", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = async (input: RequestInfo | URL) => {
    capturedUrl = input.toString();
    return new Response(
      JSON.stringify({ success: true, data: [mockSprint1] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await sprintApi.list("proj-scope-xyz");
    assert.ok(
      capturedUrl.includes("projectId=proj-scope-xyz"),
      `Expected query param projectId=proj-scope-xyz but got ${capturedUrl}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Empty sprint list unwraps safely to empty array", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const list = await sprintApi.list("proj-empty");
    assert.strictEqual(Array.isArray(list), true);
    assert.strictEqual(list.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Sprint creation sends POST /sprints with valid payload", async () => {
  const originalFetch = globalThis.fetch;
  let capturedMethod = "";
  let capturedBody = "";

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedMethod = init?.method || "";
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: mockSprint1 }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const payload: CreateSprintPayload = {
      projectId: "proj-uuid-1",
      name: "Sprint 01 · Foundation",
      goal: "Build foundational models",
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-14T23:59:59.000Z",
      capacity: 40,
    };
    await sprintApi.create(payload);

    assert.strictEqual(capturedMethod, "POST");
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.projectId, "proj-uuid-1");
    assert.strictEqual(parsed.name, "Sprint 01 · Foundation");
    assert.strictEqual(parsed.creatorId, undefined, "creatorId must NOT be submitted by client");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Update sprint sends PATCH /sprints/:id", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedMethod = init?.method || "";
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({ success: true, data: { ...mockSprint1, status: "COMPLETED" } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const payload: UpdateSprintPayload = {
      status: "COMPLETED",
    };
    await sprintApi.update("sprint-uuid-1", payload);

    assert.ok(capturedUrl.includes("/sprints/sprint-uuid-1"));
    assert.strictEqual(capturedMethod, "PATCH");
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.status, "COMPLETED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Delete sprint sends DELETE /sprints/:id", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedMethod = init?.method || "";
    return new Response(null, { status: 204 });
  };

  try {
    await sprintApi.remove("sprint-uuid-1");
    assert.ok(capturedUrl.includes("/sprints/sprint-uuid-1"));
    assert.strictEqual(capturedMethod, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Sprints API - Task-to-sprint assignment updates task sprintId via PATCH /tasks/:id", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedBody = "";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedBody = (init?.body || "").toString();
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: "task-uuid-1",
          projectId: "proj-uuid-1",
          sprintId: "sprint-uuid-1",
          title: "Implement auth",
          status: "TODO",
          priority: "HIGH",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await taskApi.update("task-uuid-1", { sprintId: "sprint-uuid-1" });
    assert.ok(capturedUrl.includes("/tasks/task-uuid-1"));
    const parsed = JSON.parse(capturedBody);
    assert.strictEqual(parsed.sprintId, "sprint-uuid-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   SUITE 2: SPRINT ENUMS & STATUS CANONICALITY
   ========================================================= */

test("Sprint enums - Canonical Prisma SprintStatus values are valid", () => {
  const VALID_SPRINT_STATUSES: SprintStatus[] = [
    "PLANNED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  assert.strictEqual(VALID_SPRINT_STATUSES.length, 4);
  assert.ok(VALID_SPRINT_STATUSES.includes("PLANNED"));
  assert.ok(VALID_SPRINT_STATUSES.includes("ACTIVE"));
  assert.ok(VALID_SPRINT_STATUSES.includes("COMPLETED"));
  assert.ok(VALID_SPRINT_STATUSES.includes("CANCELLED"));
});

/* =========================================================
   SUITE 3: ZUSTAND SPRINT STORE INTEGRATION
   ========================================================= */

test("SprintStore - Switching project clears stale sprints immediately", () => {
  useSprintStore.setState({
    currentProjectId: "proj-uuid-1",
    sprints: [mockSprint1, mockSprint2],
    activeSprintId: "sprint-uuid-1",
    error: null,
  });

  useSprintStore.getState().setProjectId("proj-uuid-2");

  const state = useSprintStore.getState();
  assert.strictEqual(state.currentProjectId, "proj-uuid-2");
  assert.strictEqual(state.sprints.length, 0, "Sprints array must be empty immediately upon project switch");
  assert.strictEqual(state.activeSprintId, null, "activeSprintId must be reset upon project switch");
});

test("SprintStore - Setting same project does not wipe sprints", () => {
  useSprintStore.setState({
    currentProjectId: "proj-uuid-1",
    sprints: [mockSprint1],
    activeSprintId: "sprint-uuid-1",
    error: null,
  });

  useSprintStore.getState().setProjectId("proj-uuid-1");

  const state = useSprintStore.getState();
  assert.strictEqual(state.sprints.length, 1);
  assert.strictEqual(state.activeSprintId, "sprint-uuid-1");
});

test("SprintStore - Failed fetchSprints records error and does NOT fallback to mock data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Database connection failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    useSprintStore.setState({
      currentProjectId: "proj-uuid-1",
      sprints: [mockSprint1],
      activeSprintId: "sprint-uuid-1",
      error: null,
    });

    await assert.rejects(
      () => useSprintStore.getState().fetchSprints("proj-uuid-1"),
      /Database connection failed/,
    );

    const state = useSprintStore.getState();
    assert.strictEqual(state.sprints.length, 0, "Failed fetch must clear sprints rather than fallback to mocks");
    assert.ok(state.error?.includes("Database connection failed"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SprintStore - Optimistic update with reliable rollback on API failure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Network timeout updating sprint",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    useSprintStore.setState({
      currentProjectId: "proj-uuid-1",
      sprints: [mockSprint1],
      activeSprintId: "sprint-uuid-1",
      error: null,
    });

    await assert.rejects(
      () =>
        useSprintStore.getState().updateSprint("sprint-uuid-1", {
          name: "Renamed Sprint",
        }),
      /Network timeout/,
    );

    const state = useSprintStore.getState();
    assert.strictEqual(state.sprints[0].name, "Sprint 01 · Foundation", "Rollback must restore original sprint name");
    assert.ok(state.error?.includes("Network timeout"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SprintStore - startSprint and completeSprint trigger status transitions", async () => {
  const originalFetch = globalThis.fetch;
  let capturedStatus = "";

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    const parsed = JSON.parse((init?.body || "{}").toString());
    capturedStatus = parsed.status;
    return new Response(
      JSON.stringify({
        success: true,
        data: { ...mockSprint2, status: parsed.status },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    useSprintStore.setState({
      currentProjectId: "proj-uuid-1",
      sprints: [mockSprint2],
      activeSprintId: "sprint-uuid-2",
      error: null,
    });

    await useSprintStore.getState().startSprint("sprint-uuid-2");
    assert.strictEqual(capturedStatus, "ACTIVE");

    await useSprintStore.getState().completeSprint("sprint-uuid-2");
    assert.strictEqual(capturedStatus, "COMPLETED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SprintStore - Delete sprint removes it from state and re-points activeSprintId", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(null, { status: 204 });
  };

  try {
    useSprintStore.setState({
      currentProjectId: "proj-uuid-1",
      sprints: [mockSprint1, mockSprint2],
      activeSprintId: "sprint-uuid-1",
      error: null,
    });

    await useSprintStore.getState().deleteSprint("sprint-uuid-1");

    const state = useSprintStore.getState();
    assert.strictEqual(state.sprints.length, 1);
    assert.strictEqual(state.sprints[0].id, "sprint-uuid-2");
    assert.strictEqual(state.activeSprintId, "sprint-uuid-2", "activeSprintId should fallback to remaining sprint");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SprintStore - clearSprints resets all state", () => {
  useSprintStore.setState({
    currentProjectId: "proj-uuid-1",
    sprints: [mockSprint1],
    activeSprintId: "sprint-uuid-1",
    error: "Stale error",
  });

  useSprintStore.getState().clearSprints();

  const state = useSprintStore.getState();
  assert.strictEqual(state.currentProjectId, null);
  assert.strictEqual(state.sprints.length, 0);
  assert.strictEqual(state.activeSprintId, null);
  assert.strictEqual(state.error, null);
});
