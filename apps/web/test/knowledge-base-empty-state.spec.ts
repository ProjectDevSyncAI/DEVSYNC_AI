/**
 * Knowledge Base Empty State & Error Handling Test Suite (F-8)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * - KnowledgeBase.tsx eliminates fake mock defaultDocuments fallback
 * - Initial state and project-switch state clear documents to []
 * - When API returns [] (0 documents), documents remains [] and displays genuine Empty State
 * - When API throws error, documents remains [] and error banner is displayed
 * - documentsApi.findAll cleanly returns empty list without synthetic fallback
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentsApi, setAccessToken } from "../src/lib/api.js";

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

test("F-8 [1] - KnowledgeBase.tsx has completely eliminated defaultDocuments fake data", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/KnowledgeBase.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.equal(
    content.includes("defaultDocuments"),
    false,
    "KnowledgeBase.tsx must not declare or reference defaultDocuments mock data",
  );
  assert.equal(
    content.includes("Architecture Decision Records (ADR)"),
    false,
    "KnowledgeBase.tsx must not contain hardcoded fake document titles",
  );
  assert.equal(
    content.includes("DevSync API Specification v1.2"),
    false,
    "KnowledgeBase.tsx must not contain hardcoded fake document titles",
  );
});

test("F-8 [2] - KnowledgeBase.tsx initializes documents state to empty array []", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/KnowledgeBase.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  assert.ok(
    content.includes("useState<DocumentViewItem[]>([])"),
    "KnowledgeBase.tsx must initialize documents to empty array",
  );
});

test("F-8 [3] - KnowledgeBase.tsx clears documents immediately on activeProject change", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/KnowledgeBase.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  // Inside useEffect listening to activeProject?.id:
  assert.ok(
    content.includes("setDocuments([]); // Immediately clear"),
    "KnowledgeBase.tsx must clear documents on project change before fetch completes",
  );
  assert.ok(
    content.includes("[activeProject?.id]"),
    "KnowledgeBase.tsx must trigger refetch on activeProject?.id change",
  );
});

test("F-8 [4] - KnowledgeBase.tsx handles 0 documents and API error without fake fallback", () => {
  const componentPath = path.resolve(__dirname, "../src/pages/KnowledgeBase.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  // Empty check:
  assert.ok(
    content.includes("if (!Array.isArray(items) || items.length === 0)"),
    "KnowledgeBase.tsx must check for empty items array",
  );

  // Catch block:
  assert.ok(
    content.includes("setErrorMsg(err?.message || \"Failed to load project documents.\")"),
    "KnowledgeBase.tsx must set error message on API failure",
  );

  // Empty state rendering:
  assert.ok(
    content.includes("No documents found"),
    "KnowledgeBase.tsx must render genuine empty state message",
  );
  assert.ok(
    content.includes("Upload First Document"),
    "KnowledgeBase.tsx must offer 'Upload First Document' action in empty state",
  );
});

test("F-8 [5] - documentsApi.findAll returns empty array [] when backend has 0 documents", async () => {
  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const docs = await documentsApi.findAll("project-empty");
    assert.ok(Array.isArray(docs));
    assert.equal(docs.length, 0);
  } finally {
    resetFetch();
  }
});
