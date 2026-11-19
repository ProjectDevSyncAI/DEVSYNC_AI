/**
 * AI Insights Dynamic Project Binding Test Suite (F-4)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * - AIInsights uses activeProject from useProjectStore (no hardcoded "current-project")
 * - API calls (aiApi.ask, aiApi.askStream, aiApi.searchKnowledge) pass active project ID
 * - Warning alert is rendered when no project is selected
 * - Action buttons are disabled when no active project is selected
 * - State resets when activeProject changes
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aiApi, setAccessToken } from "../src/lib/api.js";
import { AIInsightsStreamController } from "../src/lib/ai-insights-stream.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (typeof (globalThis as any).localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
}

const originalFetch = globalThis.fetch;
function resetFetch() {
  globalThis.fetch = originalFetch;
}

setAccessToken("mock-jwt-token");

test("F-4 [1] - AIInsights.tsx does not contain hardcoded 'current-project'", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/AIInsights.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.equal(
    content.includes('"current-project"'),
    false,
    "AIInsights.tsx must not contain hardcoded 'current-project'",
  );
  assert.equal(
    content.includes("'current-project'"),
    false,
    "AIInsights.tsx must not contain hardcoded 'current-project'",
  );
});

test("F-4 [2] - AIInsights.tsx binds to useProjectStore activeProject", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/AIInsights.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("useProjectStore"),
    "AIInsights.tsx must import and use useProjectStore",
  );
  assert.ok(
    content.includes("activeProject"),
    "AIInsights.tsx must access activeProject from store",
  );
  assert.ok(
    content.includes("activeProject?.id"),
    "AIInsights.tsx must query or reset using activeProject?.id",
  );
});

test("F-4 [3] - AIInsights.tsx guards against querying when no active project is selected", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/AIInsights.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("!activeProject"),
    "AIInsights.tsx must check for !activeProject",
  );
  assert.ok(
    content.includes("No active project selected"),
    "AIInsights.tsx must display alert when no active project is selected",
  );
  assert.ok(
    content.includes("disabled={!activeProject"),
    "AIInsights.tsx must disable action buttons when !activeProject",
  );
});

test("F-4 [4] - aiApi.ask sends dynamic projectId in POST payload", async () => {
  let capturedUrl = "";
  let capturedBody: any = null;

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse((init?.body as string) || "{}");
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          answer: "AI response for project alpha",
          sources: [{ id: "chunk-1" }],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const res = await aiApi.ask("project-alpha-uuid", "What changed in auth?");
    assert.ok(capturedUrl.endsWith("/ai/ask"));
    assert.equal(capturedBody.projectId, "project-alpha-uuid");
    assert.equal(capturedBody.question, "What changed in auth?");
    assert.equal(res.answer, "AI response for project alpha");
  } finally {
    resetFetch();
  }
});

test("F-4 [5] - aiApi.searchKnowledge encodes dynamic projectId and validation parameters", async () => {
  let capturedUrl = "";

  globalThis.fetch = (async (url: string | URL | Request) => {
    capturedUrl = String(url);
    return new Response(
      JSON.stringify({
        data: {
          query: "auth",
          chunks: [],
          limit: 10,
          threshold: 0.8,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    await aiApi.searchKnowledge("proj-xyz", "auth", 10, 0.8);
    assert.ok(capturedUrl.includes("projectId=proj-xyz"));
    assert.ok(capturedUrl.includes("query=auth"));
    assert.ok(capturedUrl.includes("limit=10"));
    assert.ok(capturedUrl.includes("distanceThreshold=0.8"));
  } finally {
    resetFetch();
  }
});

test("F-4 [6] - AIInsights.tsx delegates SSE stream lifecycle to shared AIInsightsStreamController", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/AIInsights.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("AIInsightsStreamController"),
    "AIInsights.tsx must import and use AIInsightsStreamController",
  );
  assert.ok(
    content.includes("controllerRef"),
    "AIInsights.tsx must store controller in ref",
  );
  assert.ok(
    content.includes("handleProjectChange"),
    "AIInsights.tsx must delegate project change to controller",
  );
  assert.ok(
    content.includes("handleUnmount"),
    "AIInsights.tsx must delegate unmount to controller",
  );
});

test("F-4 [7] - aiApi.askStream returns an abort/cleanup function that closes EventSource", () => {
  let eventSourceClosed = false;

  // Mock global EventSource
  class MockEventSource {
    url: string;
    onmessage: any;
    onerror: any;
    constructor(url: string) {
      this.url = url;
    }
    close() {
      eventSourceClosed = true;
    }
  }
  (globalThis as any).EventSource = MockEventSource;

  try {
    const cleanup = aiApi.askStream("project-test-1", "Hello stream?", {
      onToken: () => {},
      onDone: () => {},
      onError: () => {},
    });

    assert.equal(typeof cleanup, "function", "askStream must return a cleanup function");
    assert.equal(eventSourceClosed, false);
    cleanup();
    assert.equal(eventSourceClosed, true, "cleanup function must close EventSource");
  } finally {
    delete (globalThis as any).EventSource;
  }
});

// =========================================================================
// Behavioral Verification of Production AIInsightsStreamController Lifecycle
// =========================================================================

class AIInsightsProductionHarness {
  activeProject: { id: string; name?: string } | null;
  userPrompt = "";
  aiAnswer: string | null = null;
  aiSources: any[] = [];
  isAnswering = false;
  errorMessage = "";
  controller: AIInsightsStreamController;

  constructor(
    initialProject: { id: string; name?: string } | null,
    streamFactory?: (
      targetProjectId: string,
      question: string,
      onToken: (t: string) => void,
      onDone: () => void,
      onError: (err: any) => void,
    ) => () => void,
    unaryFactory?: (
      targetProjectId: string,
      question: string,
    ) => Promise<{ answer: string; sources?: any[] }>,
  ) {
    this.activeProject = initialProject;
    this.controller = new AIInsightsStreamController(
      {
        setIsAnswering: (val: boolean) => {
          this.isAnswering = val;
        },
        setAiAnswer: (val: string | null) => {
          this.aiAnswer = val;
        },
        setAiSources: (val: any[]) => {
          this.aiSources = val;
        },
        setUserPrompt: (val: string) => {
          this.userPrompt = val;
        },
        setErrorMessage: (val: string) => {
          this.errorMessage = val;
        },
      },
      streamFactory as any,
      unaryFactory as any,
    );
  }

  switchProject(newProject: { id: string; name?: string } | null) {
    this.activeProject = newProject;
    this.controller.handleProjectChange();
  }

  unmount() {
    this.controller.handleUnmount();
  }

  handleAskQuestion(q: string) {
    return this.controller.askQuestion(this.activeProject, q);
  }
}

test("F-4 Behavioral [1] - Switch from Project A to Project B drops late Project A tokens", async () => {
  let closedA = false;
  let tokenCallbackA: (t: string) => void = () => {};

  const harness = new AIInsightsProductionHarness(
    { id: "proj-a", name: "Project A" },
    (_pid, _q, onToken) => {
      tokenCallbackA = onToken;
      return () => {
        closedA = true;
      };
    },
  );

  await harness.handleAskQuestion("Query A");

  assert.equal(harness.isAnswering, true);
  assert.equal(harness.aiAnswer, "");

  // Switch to Project B
  harness.switchProject({ id: "proj-b", name: "Project B" });

  assert.equal(closedA, true, "Project A EventSource must be closed on project switch");
  assert.equal(harness.isAnswering, false);
  assert.equal(harness.aiAnswer, null);

  // Deliver late token from Project A
  tokenCallbackA("stale token from A");

  assert.equal(harness.aiAnswer, null, "Late token from Project A must be ignored");
  assert.equal(harness.isAnswering, false);
});

test("F-4 Behavioral [2] - Late Project A completion and error callbacks are ignored after switch", async () => {
  let onDoneA: () => void = () => {};
  let onErrorA: (err: any) => void = () => {};

  const harness = new AIInsightsProductionHarness(
    { id: "proj-a", name: "Project A" },
    (_pid, _q, _onToken, onDone, onError) => {
      onDoneA = onDone;
      onErrorA = onError;
      return () => {};
    },
  );

  await harness.handleAskQuestion("Query A");
  harness.switchProject({ id: "proj-b", name: "Project B" });

  // Deliver late completion and error
  onDoneA();
  assert.equal(harness.errorMessage, "");
  assert.equal(harness.isAnswering, false);

  onErrorA(new Error("Late error from A"));
  assert.equal(harness.errorMessage, "", "Late error from Project A must not set error message");
});

test("F-4 Behavioral [3] - Unmounting component closes active stream and suppresses subsequent callbacks", async () => {
  let closed = false;
  let tokenCallback: (t: string) => void = () => {};

  const harness = new AIInsightsProductionHarness(
    { id: "proj-a" },
    (_pid, _q, onToken) => {
      tokenCallback = onToken;
      return () => {
        closed = true;
      };
    },
  );

  await harness.handleAskQuestion("Query");

  assert.equal(closed, false);
  assert.equal(harness.isAnswering, true);

  // Unmount
  harness.unmount();

  assert.equal(closed, true, "Stream must be closed on unmount");
  assert.equal(harness.controller.hasActiveStream(), false);

  // Deliver callback post-unmount
  tokenCallback("token after unmount");
  assert.equal(harness.aiAnswer, "");
});

test("F-4 Behavioral [4] - Submitting a second question aborts first stream and accepts only second", async () => {
  let closed1 = false;
  let tokenCb1: (t: string) => void = () => {};
  let tokenCb2: (t: string) => void = () => {};

  let callCount = 0;
  const harness = new AIInsightsProductionHarness(
    { id: "proj-a" },
    (_pid, _q, onToken) => {
      callCount++;
      if (callCount === 1) {
        tokenCb1 = onToken;
        return () => {
          closed1 = true;
        };
      } else {
        tokenCb2 = onToken;
        return () => {};
      }
    },
  );

  // First question
  await harness.handleAskQuestion("Q1");

  // Second question while Q1 is active
  await harness.handleAskQuestion("Q2");

  assert.equal(closed1, true, "Prior stream must be closed when second question is asked");

  // Late token from Q1 must be ignored
  tokenCb1("token from Q1");
  assert.equal(harness.aiAnswer, "");

  // Token from Q2 must be processed
  tokenCb2("token from Q2");
  assert.equal(harness.aiAnswer, "token from Q2");
});

test("F-4 Behavioral [5] - Switch project and immediately start new question: old cleanup does not invalidate new", async () => {
  let tokenCbA: (t: string) => void = () => {};
  let tokenCbB: (t: string) => void = () => {};
  let doneCbB: () => void = () => {};

  let callCount = 0;
  const harness = new AIInsightsProductionHarness(
    { id: "proj-a" },
    (_pid, _q, onToken, onDone) => {
      callCount++;
      if (callCount === 1) {
        tokenCbA = onToken;
        return () => {};
      } else {
        tokenCbB = onToken;
        doneCbB = onDone;
        return () => {};
      }
    },
  );

  await harness.handleAskQuestion("Q on A");

  // Switch to Project B
  harness.switchProject({ id: "proj-b" });

  // Immediately start question on Project B
  await harness.handleAskQuestion("Q on B");

  assert.equal(harness.isAnswering, true);

  // Deliver late token from Project A -> ignored
  tokenCbA("late A token");
  assert.equal(harness.aiAnswer, "");

  // Deliver token from Project B -> processed
  tokenCbB("valid B token");
  assert.equal(harness.aiAnswer, "valid B token");

  // Complete Project B
  doneCbB();
  assert.equal(harness.isAnswering, false);
  assert.equal(harness.aiAnswer, "valid B token");
});
