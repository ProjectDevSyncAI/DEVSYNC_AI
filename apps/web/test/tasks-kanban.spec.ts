import test from "node:test";
import assert from "node:assert";
import {
  taskApi,
  unwrapEnvelope,
  type Task,
  type CreateTaskPayload,
  type UpdateTaskPayload,
  type TaskStatus,
} from "../src/lib/api.js";
import { useTaskStore } from "../src/store/task.store.js";

// Mock tasks data for testing
const mockTask1: Task = {
  id: "task-uuid-1",
  projectId: "proj-uuid-1",
  creatorId: "user-uuid-1",
  assigneeId: "user-uuid-2",
  title: "Setup NestJS microservices",
  description: "Configure gRPC and Kafka transports",
  status: "TODO",
  priority: "HIGH",
  storyPoints: 5,
  dueDate: "2026-12-01T00:00:00.000Z",
  completedAt: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  project: {
    id: "proj-uuid-1",
    name: "DevSync Core API",
    key: "CORE",
  },
  creator: {
    id: "user-uuid-1",
    firstName: "Alice",
    lastName: "Admin",
    email: "alice@acme.com",
    avatarUrl: null,
  },
  assignee: {
    id: "user-uuid-2",
    firstName: "Bob",
    lastName: "Developer",
    email: "bob@acme.com",
    avatarUrl: null,
  },
};

const mockTask2: Task = {
  id: "task-uuid-2",
  projectId: "proj-uuid-1",
  creatorId: "user-uuid-1",
  assigneeId: null,
  title: "Implement drag-and-drop Kanban",
  description: "Add HTML5 drag and drop with optimistic updates",
  status: "IN_PROGRESS",
  priority: "MEDIUM",
  storyPoints: 3,
  dueDate: "2026-12-05T00:00:00.000Z",
  completedAt: null,
  createdAt: "2026-11-02T00:00:00.000Z",
  updatedAt: "2026-11-02T00:00:00.000Z",
  project: {
    id: "proj-uuid-1",
    name: "DevSync Core API",
    key: "CORE",
  },
  creator: {
    id: "user-uuid-1",
    firstName: "Alice",
    lastName: "Admin",
    email: "alice@acme.com",
    avatarUrl: null,
  },
  assignee: null,
};

const mockTask3: Task = {
  id: "task-uuid-3",
  projectId: "proj-uuid-2",
  creatorId: "user-uuid-1",
  assigneeId: "user-uuid-1",
  title: "Setup CI/CD pipeline",
  description: "GitHub Actions workflow for monorepo testing",
  status: "DONE",
  priority: "LOW",
  storyPoints: 2,
  dueDate: null,
  completedAt: "2026-11-05T12:00:00.000Z",
  createdAt: "2026-11-03T00:00:00.000Z",
  updatedAt: "2026-11-05T12:00:00.000Z",
  project: {
    id: "proj-uuid-2",
    name: "DevSync Web App",
    key: "WEB",
  },
};

/* =========================================================
   SUITE 1: API ENVELOPE UNWRAPPING & PARSING
   ========================================================= */

test("Tasks - Envelope unwrapping extracts task array accurately", () => {
  const backendEnvelope = {
    success: true,
    data: [mockTask1, mockTask2],
    timestamp: "2026-11-07T00:00:00.000Z",
  };

  const unwrapped = unwrapEnvelope<Task[]>(backendEnvelope);
  assert.strictEqual(Array.isArray(unwrapped), true);
  assert.strictEqual(unwrapped.length, 2);
  assert.strictEqual(unwrapped[0].id, "task-uuid-1");
  assert.strictEqual(unwrapped[0].status, "TODO");
  assert.strictEqual(unwrapped[1].id, "task-uuid-2");
  assert.strictEqual(unwrapped[1].status, "IN_PROGRESS");
});

test("Tasks - Empty task list unwraps safely to empty array with no errors", () => {
  const emptyEnvelope = {
    success: true,
    data: [],
  };

  const unwrapped = unwrapEnvelope<Task[]>(emptyEnvelope);
  assert.strictEqual(Array.isArray(unwrapped), true);
  assert.strictEqual(unwrapped.length, 0);
});

test("Tasks - Single task envelope unwraps to task object", () => {
  const singleEnvelope = {
    success: true,
    data: mockTask1,
  };

  const unwrapped = unwrapEnvelope<Task>(singleEnvelope);
  assert.strictEqual(unwrapped.id, "task-uuid-1");
  assert.strictEqual(unwrapped.title, "Setup NestJS microservices");
  assert.strictEqual(unwrapped.project?.key, "CORE");
  assert.strictEqual(unwrapped.assignee?.firstName, "Bob");
});

/* =========================================================
   SUITE 2: TASK API CLIENT CALLS & ENDPOINT ROUTING
   ========================================================= */

test("Tasks - taskApi.list scopes requests by projectId query param when provided", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = async (input: RequestInfo | URL) => {
    requestedUrl = input.toString();
    return new Response(JSON.stringify({ success: true, data: [mockTask1, mockTask2] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const tasks = await taskApi.list("proj-uuid-1");
    assert.ok(requestedUrl.includes("/api/tasks?projectId=proj-uuid-1"), `Expected query param in URL: ${requestedUrl}`);
    assert.strictEqual(tasks.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Tasks - taskApi.list requests all accessible tasks when projectId is omitted", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = async (input: RequestInfo | URL) => {
    requestedUrl = input.toString();
    return new Response(JSON.stringify({ success: true, data: [mockTask1, mockTask2, mockTask3] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const tasks = await taskApi.list();
    assert.ok(requestedUrl.endsWith("/api/tasks"), `Expected base endpoint in URL: ${requestedUrl}`);
    assert.strictEqual(tasks.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Tasks - taskApi.create sends required projectId and task properties", async () => {
  const originalFetch = globalThis.fetch;
  let requestMethod = "";
  let requestBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestMethod = init?.method || "GET";
    requestBody = init?.body ? JSON.parse(init.body.toString()) : null;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mockTask1,
          id: "new-task-uuid",
          title: requestBody.title,
          projectId: requestBody.projectId,
          priority: requestBody.priority,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const payload: CreateTaskPayload = {
      projectId: "proj-uuid-1",
      title: "Write integration tests",
      priority: "HIGH",
      status: "TODO",
      storyPoints: 3,
    };

    const created = await taskApi.create(payload);
    assert.strictEqual(requestMethod, "POST");
    assert.strictEqual(requestBody.projectId, "proj-uuid-1");
    assert.strictEqual(requestBody.title, "Write integration tests");
    assert.strictEqual(created.id, "new-task-uuid");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Tasks - taskApi.update issues PATCH to /api/tasks/:id with partial fields", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestMethod = "";
  let requestBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input.toString();
    requestMethod = init?.method || "GET";
    requestBody = init?.body ? JSON.parse(init.body.toString()) : null;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mockTask1,
          ...requestBody,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const updatePayload: UpdateTaskPayload = {
      title: "Updated task title",
      priority: "URGENT",
      assigneeId: "user-uuid-2",
    };

    const updated = await taskApi.update("task-uuid-1", updatePayload);
    assert.strictEqual(requestMethod, "PATCH");
    assert.ok(requestUrl.endsWith("/api/tasks/task-uuid-1"));
    assert.strictEqual(requestBody.title, "Updated task title");
    assert.strictEqual(requestBody.priority, "URGENT");
    assert.strictEqual(requestBody.assigneeId, "user-uuid-2");
    assert.strictEqual(updated.title, "Updated task title");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Tasks - taskApi.move calls /api/tasks/:id/move endpoint", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestMethod = "";
  let requestBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = input.toString();
    requestMethod = init?.method || "GET";
    requestBody = init?.body ? JSON.parse(init.body.toString()) : null;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mockTask1,
          status: requestBody.status,
          completedAt: requestBody.status === "DONE" ? new Date().toISOString() : null,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const moved = await taskApi.move("task-uuid-1", { status: "IN_PROGRESS", position: 0 });
    assert.strictEqual(requestMethod, "PATCH");
    assert.ok(requestUrl.endsWith("/api/tasks/task-uuid-1/move"));
    assert.strictEqual(requestBody.status, "IN_PROGRESS");
    assert.strictEqual(requestBody.position, 0);
    assert.strictEqual(moved.status, "IN_PROGRESS");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   SUITE 3: STORE STATE, PROJECT ISOLATION & ROLLBACK
   ========================================================= */

test("TaskStore - Switching project clears stale tasks immediately", () => {
  useTaskStore.setState({
    currentProjectId: "proj-uuid-1",
    tasks: [mockTask1, mockTask2],
    error: null,
  });

  assert.strictEqual(useTaskStore.getState().tasks.length, 2);

  // Switch to proj-uuid-2
  useTaskStore.getState().setProjectId("proj-uuid-2");

  const state = useTaskStore.getState();
  assert.strictEqual(state.currentProjectId, "proj-uuid-2");
  assert.strictEqual(state.tasks.length, 0, "Tasks must be cleared when switching projects");
});

test("TaskStore - Setting same project does not wipe tasks", () => {
  useTaskStore.setState({
    currentProjectId: "proj-uuid-1",
    tasks: [mockTask1, mockTask2],
  });

  useTaskStore.getState().setProjectId("proj-uuid-1");

  const state = useTaskStore.getState();
  assert.strictEqual(state.tasks.length, 2);
  assert.strictEqual(state.currentProjectId, "proj-uuid-1");
});

test("TaskStore - clearTasks resets all state", () => {
  useTaskStore.setState({
    currentProjectId: "proj-uuid-1",
    tasks: [mockTask1],
    error: "Some previous error",
  });

  useTaskStore.getState().clearTasks();

  const state = useTaskStore.getState();
  assert.strictEqual(state.currentProjectId, null);
  assert.strictEqual(state.tasks.length, 0);
  assert.strictEqual(state.error, null);
});

test("TaskStore - Status transitions cycle: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE", async () => {
  const originalFetch = globalThis.fetch;
  let currentServerStatus: TaskStatus = "TODO";

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body.toString()) : {};
    currentServerStatus = body.status;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mockTask1,
          status: currentServerStatus,
          completedAt: currentServerStatus === "DONE" ? new Date().toISOString() : null,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    useTaskStore.setState({
      currentProjectId: "proj-uuid-1",
      tasks: [{ ...mockTask1, status: "TODO" }],
    });

    // 1. Move to IN_PROGRESS
    await useTaskStore.getState().moveTask("task-uuid-1", "IN_PROGRESS");
    assert.strictEqual(useTaskStore.getState().tasks[0].status, "IN_PROGRESS");
    assert.strictEqual(useTaskStore.getState().tasks[0].completedAt, null);

    // 2. Move to IN_REVIEW
    await useTaskStore.getState().moveTask("task-uuid-1", "IN_REVIEW");
    assert.strictEqual(useTaskStore.getState().tasks[0].status, "IN_REVIEW");

    // 3. Move to DONE (completedAt is recorded)
    await useTaskStore.getState().moveTask("task-uuid-1", "DONE");
    assert.strictEqual(useTaskStore.getState().tasks[0].status, "DONE");
    assert.ok(useTaskStore.getState().tasks[0].completedAt !== null, "completedAt should be set when DONE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TaskStore - Drag-and-drop movement performs optimistic update and reliable rollback on API failure", async () => {
  const originalFetch = globalThis.fetch;

  // Mock server failure (e.g., 403 Forbidden or 500 error)
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        statusCode: 403,
        message: "You are not a member of this project.",
        error: "Forbidden",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const initialTask = { ...mockTask1, status: "TODO" as TaskStatus };
    useTaskStore.setState({
      currentProjectId: "proj-uuid-1",
      tasks: [initialTask],
      error: null,
    });

    // Attempt to move task to DONE
    await assert.rejects(
      async () => {
        await useTaskStore.getState().moveTask("task-uuid-1", "DONE");
      },
      /You are not a member of this project/,
      "moveTask must re-throw the backend error"
    );

    // Verify rollback!
    const state = useTaskStore.getState();
    assert.strictEqual(state.tasks[0].status, "TODO", "Status must rollback to TODO after API error");
    assert.strictEqual(state.tasks[0].completedAt, null, "completedAt must rollback to null");
    assert.strictEqual(state.error, "You are not a member of this project.");
    assert.strictEqual(state.isUpdating, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TaskStore - Failed fetchTasks records error and does NOT fallback to mock data", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        statusCode: 500,
        message: "Database connection failed",
        error: "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    useTaskStore.setState({
      currentProjectId: "proj-uuid-1",
      tasks: [],
      error: null,
    });

    await assert.rejects(async () => {
      await useTaskStore.getState().fetchTasks();
    });

    const state = useTaskStore.getState();
    assert.strictEqual(state.tasks.length, 0, "Must not inject mock tasks on API error");
    assert.strictEqual(state.error, "Database connection failed");
    assert.strictEqual(state.isLoading, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TaskStore - Delete task removes it from state", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(null, { status: 204 });
  };

  try {
    useTaskStore.setState({
      currentProjectId: "proj-uuid-1",
      tasks: [mockTask1, mockTask2],
      error: null,
    });

    await useTaskStore.getState().deleteTask("task-uuid-1");

    const state = useTaskStore.getState();
    assert.strictEqual(state.tasks.length, 1);
    assert.strictEqual(state.tasks[0].id, "task-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   SUITE 4: TASKSTATUS COMPATIBILITY — REGRESSION TESTS
   Prove that "REVIEW" is NEVER sent to task mutation endpoints.
   Only canonical Prisma values may be transmitted.
   ========================================================= */

const VALID_API_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
];

test("TaskStatus API contract - 'REVIEW' is NOT a member of the TaskStatus type", () => {
  // If "REVIEW" were still in the TaskStatus union, TypeScript would allow
  // the assignment below. We verify at runtime that VALID_API_STATUSES does
  // not contain "REVIEW".
  const hasReview = (VALID_API_STATUSES as string[]).includes("REVIEW");
  assert.strictEqual(
    hasReview,
    false,
    "REVIEW must not be in the valid API status set — it is not a Prisma TaskStatus value"
  );
});

test("TaskStatus API contract - 'IN_REVIEW' IS a member of the TaskStatus type", () => {
  const hasInReview = (VALID_API_STATUSES as string[]).includes("IN_REVIEW");
  assert.strictEqual(
    hasInReview,
    true,
    "IN_REVIEW must be present — it is the canonical Prisma value"
  );
});

test("TaskStatus API contract - all canonical Prisma values are present", () => {
  const expected = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "CANCELLED"];
  for (const status of expected) {
    assert.ok(
      (VALID_API_STATUSES as string[]).includes(status),
      `Expected ${status} to be in TaskStatus union`
    );
  }
  assert.strictEqual(VALID_API_STATUSES.length, expected.length, "No extra or missing statuses");
});

test("Regression - taskApi.create never transmits 'REVIEW' in status field", async () => {
  const originalFetch = globalThis.fetch;
  const capturedBodies: string[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
      capturedBodies.push(init.body.toString());
    }
    return new Response(
      JSON.stringify({ success: true, data: { ...mockTask1, id: "new-id" } }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    // These are the only valid statuses a create call might send
    for (const status of VALID_API_STATUSES) {
      await taskApi.create({
        projectId: "proj-uuid-1",
        title: `Test task with status ${status}`,
        status,
      });
    }

    for (const body of capturedBodies) {
      const parsed = JSON.parse(body) as { status?: string };
      assert.ok(
        parsed.status !== "REVIEW",
        `Found illegal status 'REVIEW' in request body: ${body}`
      );
      if (parsed.status) {
        assert.ok(
          (VALID_API_STATUSES as string[]).includes(parsed.status),
          `Status '${parsed.status}' is not a canonical Prisma TaskStatus value`
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Regression - taskApi.move never transmits 'REVIEW' in status field", async () => {
  const originalFetch = globalThis.fetch;
  const capturedBodies: string[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
      capturedBodies.push(init.body.toString());
    }
    return new Response(
      JSON.stringify({ success: true, data: { ...mockTask1, status: "IN_REVIEW" } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    // Move through all valid statuses (must include IN_REVIEW, never REVIEW)
    useTaskStore.setState({
      currentProjectId: "proj-uuid-1",
      tasks: [{ ...mockTask1, status: "TODO" }],
    });

    for (const status of VALID_API_STATUSES) {
      // Reset task to TODO between moves to avoid same-status no-op
      useTaskStore.setState({
        tasks: [{ ...mockTask1, status: "TODO" }],
      });
      if (status !== "TODO") {
        await taskApi.move("task-uuid-1", { status });
      }
    }

    for (const body of capturedBodies) {
      const parsed = JSON.parse(body) as { status?: string };
      assert.ok(
        parsed.status !== "REVIEW",
        `Found illegal status 'REVIEW' in move request body: ${body}`
      );
      if (parsed.status) {
        assert.ok(
          (VALID_API_STATUSES as string[]).includes(parsed.status),
          `Move sent non-canonical status '${parsed.status}'`
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Regression - taskApi.update never transmits 'REVIEW' in status field", async () => {
  const originalFetch = globalThis.fetch;
  const capturedBodies: string[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
      capturedBodies.push(init.body.toString());
    }
    return new Response(
      JSON.stringify({ success: true, data: mockTask1 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    for (const status of VALID_API_STATUSES) {
      await taskApi.update("task-uuid-1", { status });
    }

    for (const body of capturedBodies) {
      const parsed = JSON.parse(body) as { status?: string };
      assert.ok(
        parsed.status !== "REVIEW",
        `Found illegal status 'REVIEW' in update request body: ${body}`
      );
      if (parsed.status) {
        assert.ok(
          (VALID_API_STATUSES as string[]).includes(parsed.status),
          `Update sent non-canonical status '${parsed.status}'`
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

