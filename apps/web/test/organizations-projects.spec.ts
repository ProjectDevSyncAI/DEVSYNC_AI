import test from "node:test";
import assert from "node:assert";
import {
  organizationApi,
  projectApi,
  unwrapEnvelope,
  type Organization,
  type OrganizationWithDetails,
  type Project,
  type CreateProjectPayload,
} from "../src/lib/api.js";
import { useProjectStore } from "../src/store/project.store.js";

// Mock server state simulation for integration tests
const mockOrg1: Organization = {
  id: "org-uuid-1",
  name: "Acme Innovations",
  slug: "acme-innovations",
  description: "Primary engineering workspace",
  role: "OWNER",
  joinedAt: "2026-01-01T00:00:00.000Z",
};

const mockOrg2: Organization = {
  id: "org-uuid-2",
  name: "Beta Labs",
  slug: "beta-labs",
  description: "Secondary research division",
  role: "ENGINEER",
  joinedAt: "2026-02-01T00:00:00.000Z",
};

const mockOrg1Details: OrganizationWithDetails = {
  ...mockOrg1,
  currentUserRole: "OWNER",
  members: [
    {
      id: "mem-1",
      organizationId: "org-uuid-1",
      userId: "user-1",
      role: "OWNER",
      joinedAt: "2026-01-01T00:00:00.000Z",
      user: {
        id: "user-1",
        email: "alice@acme.com",
        username: "alice",
        firstName: "Alice",
        lastName: "Admin",
      },
    },
    {
      id: "mem-2",
      organizationId: "org-uuid-1",
      userId: "user-2",
      role: "ENGINEER",
      joinedAt: "2026-01-15T00:00:00.000Z",
      user: {
        id: "user-2",
        email: "bob@acme.com",
        username: "bob",
        firstName: "Bob",
        lastName: "Builder",
      },
    },
  ],
};

const mockOrg1Projects: Project[] = [
  {
    id: "proj-1",
    organizationId: "org-uuid-1",
    name: "DevSync Core API",
    key: "CORE",
    description: "Backend microservices and data engine",
    status: "ACTIVE",
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "proj-2",
    organizationId: "org-uuid-1",
    name: "DevSync Web App",
    key: "WEB",
    description: "Frontend interface and collaborative workspace",
    status: "ACTIVE",
    createdAt: "2026-01-12T00:00:00.000Z",
  },
];

const mockOrg2Projects: Project[] = [
  {
    id: "proj-3",
    organizationId: "org-uuid-2",
    name: "Beta ML Models",
    key: "BETA",
    description: "Machine learning research pipelines",
    status: "PLANNING",
    createdAt: "2026-02-05T00:00:00.000Z",
  },
];

/* =========================================================
   SUITE 1: ORGANIZATION API & UNWRAPPING
   ========================================================= */

test("Organizations - Envelope unwrapping extracts organization array", () => {
  const backendResponse = {
    success: true,
    data: [mockOrg1, mockOrg2],
  };

  const unwrapped = unwrapEnvelope<Organization[]>(backendResponse);
  assert.strictEqual(Array.isArray(unwrapped), true);
  assert.strictEqual(unwrapped.length, 2);
  assert.strictEqual(unwrapped[0].id, "org-uuid-1");
  assert.strictEqual(unwrapped[0].role, "OWNER");
  assert.strictEqual(unwrapped[1].id, "org-uuid-2");
  assert.strictEqual(unwrapped[1].role, "ENGINEER");
});

test("Organizations - Empty organization list unwraps safely to empty array", () => {
  const backendResponse = {
    success: true,
    data: [],
  };

  const unwrapped = unwrapEnvelope<Organization[]>(backendResponse);
  assert.strictEqual(Array.isArray(unwrapped), true);
  assert.strictEqual(unwrapped.length, 0);
});

test("Organizations - Details endpoint extracts members with user identities", () => {
  const backendResponse = {
    success: true,
    data: mockOrg1Details,
  };

  const unwrapped = unwrapEnvelope<OrganizationWithDetails>(backendResponse);
  assert.strictEqual(unwrapped.id, "org-uuid-1");
  assert.strictEqual(unwrapped.currentUserRole, "OWNER");
  assert.strictEqual(unwrapped.members.length, 2);
  assert.strictEqual(unwrapped.members[0].user.email, "alice@acme.com");
  assert.strictEqual(unwrapped.members[1].user.username, "bob");
  assert.strictEqual(unwrapped.members[1].role, "ENGINEER");
});

/* =========================================================
   SUITE 2: PROJECT API & FILTERING CONTRACTS
   ========================================================= */

test("Projects - Envelope unwrapping extracts projects array", () => {
  const backendResponse = {
    success: true,
    data: mockOrg1Projects,
  };

  const unwrapped = unwrapEnvelope<Project[]>(backendResponse);
  assert.strictEqual(Array.isArray(unwrapped), true);
  assert.strictEqual(unwrapped.length, 2);
  assert.strictEqual(unwrapped[0].key, "CORE");
  assert.strictEqual(unwrapped[1].key, "WEB");
});

test("Projects - Project list query builds correct ?organizationId= parameter", () => {
  let capturedUrl = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    capturedUrl = String(input);
    return new Response(
      JSON.stringify({ success: true, data: mockOrg1Projects }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    projectApi.list("org-uuid-1");
    assert.strictEqual(capturedUrl.includes("organizationId=org-uuid-1"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Projects - Project create passes organizationId as query parameter", async () => {
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = "";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method || "GET";
    capturedBody = String(init?.body || "");
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: "proj-new",
          organizationId: "org-uuid-1",
          name: "New Service",
          key: "SERV",
          status: "PLANNING",
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const payload: CreateProjectPayload = {
      name: "New Service",
      key: "SERV",
      description: "A newly created service",
      status: "PLANNING",
    };

    const result = await projectApi.create("org-uuid-1", payload);
    assert.strictEqual(capturedMethod, "POST");
    assert.strictEqual(capturedUrl.includes("organizationId=org-uuid-1"), true);
    assert.strictEqual(capturedBody.includes('"name":"New Service"'), true);
    assert.strictEqual(capturedBody.includes('"key":"SERV"'), true);
    assert.strictEqual(result.id, "proj-new");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Projects - Member endpoints construct correct paths", async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method || "GET"} ${String(input)}`);
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await projectApi.getMembers("proj-core");
    await projectApi.addMember("proj-core", "user-bob");
    await projectApi.removeMember("proj-core", "user-bob");

    assert.strictEqual(calls[0].includes("GET"), true);
    assert.strictEqual(calls[0].includes("/projects/proj-core/members"), true);
    assert.strictEqual(calls[1].includes("POST"), true);
    assert.strictEqual(calls[1].includes("/projects/proj-core/members"), true);
    assert.strictEqual(calls[2].includes("DELETE"), true);
    assert.strictEqual(calls[2].includes("/projects/proj-core/members/user-bob"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   SUITE 3: STORE STATE, ORGANIZATION ISOLATION & STALE CLEARING
   ========================================================= */

test("ProjectStore - Switching organization clears stale project state", () => {
  const store = useProjectStore.getState();

  // Populate store with org 1 data
  useProjectStore.setState({
    currentOrganizationId: "org-uuid-1",
    projects: mockOrg1Projects,
    activeProject: mockOrg1Projects[0],
    error: null,
  });

  assert.strictEqual(useProjectStore.getState().projects.length, 2);
  assert.strictEqual(useProjectStore.getState().activeProject?.id, "proj-1");

  // Switch to org 2
  store.setOrganizationId("org-uuid-2");

  const updatedState = useProjectStore.getState();
  assert.strictEqual(updatedState.currentOrganizationId, "org-uuid-2");
  assert.strictEqual(updatedState.projects.length, 0, "Projects must be wiped when org changes");
  assert.strictEqual(updatedState.activeProject, null, "Active project must be cleared to prevent stale view");
});

test("ProjectStore - Setting same organization does not clear project state", () => {
  useProjectStore.setState({
    currentOrganizationId: "org-uuid-1",
    projects: mockOrg1Projects,
    activeProject: mockOrg1Projects[0],
  });

  useProjectStore.getState().setOrganizationId("org-uuid-1");

  const state = useProjectStore.getState();
  assert.strictEqual(state.projects.length, 2);
  assert.strictEqual(state.activeProject?.id, "proj-1");
});

test("ProjectStore - clearProjects wipes all state including organization ID", () => {
  useProjectStore.setState({
    currentOrganizationId: "org-uuid-1",
    projects: mockOrg1Projects,
    activeProject: mockOrg1Projects[0],
  });

  useProjectStore.getState().clearProjects();

  const state = useProjectStore.getState();
  assert.strictEqual(state.currentOrganizationId, null);
  assert.strictEqual(state.projects.length, 0);
  assert.strictEqual(state.activeProject, null);
});

test("ProjectStore - createProject throws descriptive error if no organization selected", async () => {
  useProjectStore.setState({
    currentOrganizationId: null,
    projects: [],
  });

  await assert.rejects(
    async () => {
      await useProjectStore.getState().createProject({
        name: "Test",
        key: "TEST",
      });
    },
    /Cannot create project without selecting an organization/,
    "Must throw when no organization is selected",
  );
});

test("ProjectStore - fetchProjects without organization clears project state gracefully", async () => {
  useProjectStore.setState({
    currentOrganizationId: null,
    projects: mockOrg1Projects,
  });

  await useProjectStore.getState().fetchProjects();

  const state = useProjectStore.getState();
  assert.strictEqual(state.projects.length, 0);
  assert.strictEqual(state.isLoading, false);
});
