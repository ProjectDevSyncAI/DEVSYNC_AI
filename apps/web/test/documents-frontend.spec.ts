/**
 * DevSync AI — Milestone 4B.7 Phase 1: Documents Frontend Tests
 *
 * Tests:
 * 1. documentsApi.upload: Sends FormData without manual Content-Type header
 * 2. documentsApi.upload: Sets Authorization: Bearer <token> header
 * 3. documentsApi.upload: Form includes file, projectId, and custom title
 * 4. documentsApi.upload: Form includes file and projectId when title is omitted
 * 5. documentsApi.upload: Throws ApiError on 400 Bad Request
 * 6. documentsApi.upload: Throws ApiError on 403 Forbidden
 * 7. documentsApi.findAll: Sends GET request with projectId query param
 * 8. documentsApi.findAll: Correctly unwraps enveloped and raw responses
 * 9. documentsApi.findOne: Requests document by id
 * 10. documentsApi.delete: Issues DELETE request by id
 *
 * Runner: npx tsx --test apps/web/test/documents-frontend.spec.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  documentsApi,
  setAccessToken,
  ApiError,
  type DocumentItem,
} from "../src/lib/api.js";

/* ------------------------------------------------------------------ */
/* localStorage shim (Node has no DOM)                                 */
/* ------------------------------------------------------------------ */
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

setAccessToken("mock-jwt-test-token");

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sampleDoc: DocumentItem = {
  id: "doc-123",
  title: "Architecture Guide.pdf",
  content: "",
  type: "DOCUMENT",
  status: "UPLOADED",
  projectId: "proj-abc",
  repositoryId: null,
  metadata: {
    storageKey: "uuid-123.pdf",
    originalFilename: "Architecture Guide.pdf",
    mimeType: "application/pdf",
    fileSize: 1024,
  },
  checksum: "sha256-hash",
  createdAt: "2026-11-14T00:00:00.000Z",
  updatedAt: "2026-11-14T00:00:00.000Z",
};

/* ================================================================== */
/*  SECTION 1 — documentsApi.upload                                   */
/* ================================================================== */

test("documentsApi.upload: Sends FormData without manual Content-Type header", async () => {
  let capturedHeaders: Record<string, string> = {};
  let capturedBody: any = null;

  (globalThis as any).fetch = async (url: string, init: RequestInit) => {
    assert.ok((url as string).includes("/documents/upload"), `Unexpected URL: ${url}`);
    capturedHeaders = (init?.headers as Record<string, string>) || {};
    capturedBody = init?.body;
    return makeJsonResponse(sampleDoc);
  };

  try {
    const fakeFile = new Blob(["test file content"], { type: "text/plain" }) as any;
    fakeFile.name = "spec.txt";

    const result = await documentsApi.upload("proj-abc", fakeFile, "Custom Title");
    assert.equal(result.id, "doc-123");

    // CRITICAL: Content-Type must NOT be set manually so the browser/fetch generates the multipart boundary
    assert.strictEqual(
      capturedHeaders["Content-Type"],
      undefined,
      "Content-Type must be undefined on multipart requests so boundary is added automatically",
    );
    assert.ok(capturedBody instanceof FormData, "Body must be a FormData instance");
  } finally {
    resetFetch();
  }
});

test("documentsApi.upload: Sets Authorization: Bearer <token> header", async () => {
  let authHeader = "";

  (globalThis as any).fetch = async (_url: string, init: RequestInit) => {
    const headers = (init?.headers as Record<string, string>) || {};
    authHeader = headers["Authorization"] || "";
    return makeJsonResponse(sampleDoc);
  };

  try {
    const fakeFile = new Blob(["dummy"]) as any;
    await documentsApi.upload("proj-abc", fakeFile);
    assert.equal(authHeader, "Bearer mock-jwt-test-token");
  } finally {
    resetFetch();
  }
});

test("documentsApi.upload: Form includes file, projectId, and title", async () => {
  let capturedFormData: FormData | null = null;

  (globalThis as any).fetch = async (_url: string, init: RequestInit) => {
    capturedFormData = init?.body as FormData;
    return makeJsonResponse(sampleDoc);
  };

  try {
    const fakeBlob = new Blob(["markdown content"], { type: "text/markdown" });
    const fakeFile = new File([fakeBlob], "guide.md", { type: "text/markdown" });

    await documentsApi.upload("proj-xyz", fakeFile, "My Architecture");

    assert.ok(capturedFormData !== null);
    assert.equal(capturedFormData.get("projectId"), "proj-xyz");
    assert.equal(capturedFormData.get("title"), "My Architecture");
    assert.ok(capturedFormData.get("file") !== null, "File must be present in FormData");
  } finally {
    resetFetch();
  }
});

test("documentsApi.upload: Form includes file and projectId when title is omitted", async () => {
  let capturedFormData: FormData | null = null;

  (globalThis as any).fetch = async (_url: string, init: RequestInit) => {
    capturedFormData = init?.body as FormData;
    return makeJsonResponse(sampleDoc);
  };

  try {
    const fakeBlob = new Blob(["simple plain text"]);
    const fakeFile = new File([fakeBlob], "notes.txt");

    await documentsApi.upload("proj-xyz", fakeFile);

    assert.ok(capturedFormData !== null);
    assert.equal(capturedFormData.get("projectId"), "proj-xyz");
    assert.strictEqual(capturedFormData.get("title"), null, "Title should not be set when omitted");
  } finally {
    resetFetch();
  }
});

test("documentsApi.upload: Throws ApiError on 400 Bad Request", async () => {
  (globalThis as any).fetch = async () =>
    makeJsonResponse({ statusCode: 400, message: "File is required", error: "Bad Request" }, 400);

  try {
    const fakeBlob = new Blob([]);
    await assert.rejects(
      () => documentsApi.upload("proj-abc", fakeBlob as any),
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.ok(err.message.includes("File is required"));
        return true;
      },
    );
  } finally {
    resetFetch();
  }
});

test("documentsApi.upload: Throws ApiError on 403 Forbidden", async () => {
  (globalThis as any).fetch = async () =>
    makeJsonResponse({ statusCode: 403, message: "You do not have access to this project", error: "Forbidden" }, 403);

  try {
    const fakeBlob = new Blob(["content"]);
    await assert.rejects(
      () => documentsApi.upload("forbidden-proj", fakeBlob as any),
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 403);
        assert.ok(err.message.includes("access to this project"));
        return true;
      },
    );
  } finally {
    resetFetch();
  }
});

/* ================================================================== */
/*  SECTION 2 — documentsApi.findAll, findOne, delete                 */
/* ================================================================== */

test("documentsApi.findAll: Sends GET request with projectId query param", async () => {
  let requestedUrl = "";

  (globalThis as any).fetch = async (url: string) => {
    requestedUrl = url;
    return makeJsonResponse([sampleDoc]);
  };

  try {
    const result = await documentsApi.findAll("proj-abc");
    assert.ok(requestedUrl.includes("/documents?projectId=proj-abc"));
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "doc-123");
  } finally {
    resetFetch();
  }
});

test("documentsApi.findAll: Correctly unwraps enveloped and raw responses", async () => {
  // 1. Enveloped response
  (globalThis as any).fetch = async () => makeJsonResponse({ success: true, data: [sampleDoc] });
  try {
    const result = await documentsApi.findAll("proj-abc");
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Architecture Guide.pdf");
  } finally {
    resetFetch();
  }

  // 2. Raw array response
  (globalThis as any).fetch = async () => makeJsonResponse([sampleDoc]);
  try {
    const result = await documentsApi.findAll("proj-abc");
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Architecture Guide.pdf");
  } finally {
    resetFetch();
  }
});

test("documentsApi.findOne: Requests document by id", async () => {
  let requestedUrl = "";

  (globalThis as any).fetch = async (url: string) => {
    requestedUrl = url;
    return makeJsonResponse(sampleDoc);
  };

  try {
    const result = await documentsApi.findOne("doc-123");
    assert.ok(requestedUrl.endsWith("/documents/doc-123"));
    assert.equal(result.id, "doc-123");
  } finally {
    resetFetch();
  }
});

test("documentsApi.delete: Issues DELETE request by id", async () => {
  let requestedMethod = "";
  let requestedUrl = "";

  (globalThis as any).fetch = async (url: string, init: RequestInit) => {
    requestedUrl = url;
    requestedMethod = init?.method || "GET";
    return makeJsonResponse({ success: true });
  };

  try {
    await documentsApi.delete("doc-123");
    assert.equal(requestedMethod, "DELETE");
    assert.ok(requestedUrl.endsWith("/documents/doc-123"));
  } finally {
    resetFetch();
  }
});
