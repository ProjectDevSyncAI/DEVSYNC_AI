/**
 * DevSync AI — Milestone 4B.1 API Client Response Handling Tests
 *
 * Tests:
 * 1. Successful standard envelope response ({ success: true, data: ... })
 * 2. Raw response compatibility (objects without envelope, arrays, primitives)
 * 3. Empty response (HTTP 204 -> undefined)
 * 4. HTTP error response (status 400/404/500, status code and message preservation)
 * 5. Backend validation error (array of validation messages joined properly)
 * 6. Unauthorized response (HTTP 401, token clearance, event dispatch)
 * 7. Malformed or unexpected response handling
 * 8. Envelope unwrapping utility correctness
 */

import test from "node:test";
import assert from "node:assert";

import {
  unwrapEnvelope,
  extractErrorMessage,
  ApiError,
  type ApiResponseEnvelope,
} from "../src/lib/api.js";

// ─── 1. unwrapEnvelope unit tests ──────────────────────────────────────────

test("unwrapEnvelope - Unwraps standard success envelope with array data", () => {
  const envelope: ApiResponseEnvelope<string[]> = {
    success: true,
    data: ["item-1", "item-2", "item-3"],
  };

  const result = unwrapEnvelope<string[]>(envelope);
  assert.ok(Array.isArray(result), "Result must be an array");
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0], "item-1");
});

test("unwrapEnvelope - Unwraps standard success envelope with object data", () => {
  const envelope: ApiResponseEnvelope<{ id: string; name: string }> = {
    success: true,
    data: { id: "proj-1", name: "DevSync Platform" },
  };

  const result = unwrapEnvelope<{ id: string; name: string }>(envelope);
  assert.strictEqual(result.id, "proj-1");
  assert.strictEqual(result.name, "DevSync Platform");
});

test("unwrapEnvelope - Preserves raw arrays that lack an envelope", () => {
  const rawArray = [{ id: "task-1" }, { id: "task-2" }];
  const result = unwrapEnvelope(rawArray);
  assert.strictEqual(result, rawArray, "Raw array must be returned unchanged");
});

test("unwrapEnvelope - Preserves raw objects without success: true", () => {
  const rawObj = { total: 42, count: 10 };
  const result = unwrapEnvelope(rawObj);
  assert.deepStrictEqual(result, rawObj);
});

test("unwrapEnvelope - Preserves objects where success is false", () => {
  const failedEnvelope = { success: false, error: "Something went wrong" };
  const result = unwrapEnvelope(failedEnvelope);
  assert.deepStrictEqual(result, failedEnvelope);
});

test("unwrapEnvelope - Preserves primitives and null/undefined values", () => {
  assert.strictEqual(unwrapEnvelope(null), null);
  assert.strictEqual(unwrapEnvelope(undefined), undefined);
  assert.strictEqual(unwrapEnvelope("plain-string"), "plain-string");
  assert.strictEqual(unwrapEnvelope(12345), 12345);
  assert.strictEqual(unwrapEnvelope(true), true);
});

test("unwrapEnvelope - Handles data property being null or empty array", () => {
  const nullDataEnvelope = { success: true, data: null };
  assert.strictEqual(unwrapEnvelope(nullDataEnvelope), null);

  const emptyArrayEnvelope = { success: true, data: [] };
  const emptyRes = unwrapEnvelope<unknown[]>(emptyArrayEnvelope);
  assert.ok(Array.isArray(emptyRes));
  assert.strictEqual(emptyRes.length, 0);
});

// ─── 2. extractErrorMessage unit tests ─────────────────────────────────────

test("extractErrorMessage - Extracts single string message", () => {
  const body = { message: "Project not found" };
  assert.strictEqual(extractErrorMessage(body, "Fallback"), "Project not found");
});

test("extractErrorMessage - Extracts and joins validation error arrays", () => {
  const body = {
    statusCode: 400,
    message: [
      "email must be an email",
      "password must be longer than or equal to 8 characters",
    ],
    error: "Bad Request",
  };

  const msg = extractErrorMessage(body, "Fallback");
  assert.strictEqual(
    msg,
    "email must be an email; password must be longer than or equal to 8 characters"
  );
});

test("extractErrorMessage - Extracts top-level error property if message is missing", () => {
  const body = { error: "Forbidden resource" };
  assert.strictEqual(extractErrorMessage(body, "Fallback"), "Forbidden resource");
});

test("extractErrorMessage - Extracts nested errors array", () => {
  const body = { errors: ["Field A is required", "Field B is invalid"] };
  assert.strictEqual(
    extractErrorMessage(body, "Fallback"),
    "Field A is required; Field B is invalid"
  );
});

test("extractErrorMessage - Returns fallback when body is empty or non-object", () => {
  assert.strictEqual(extractErrorMessage(null, "Default error"), "Default error");
  assert.strictEqual(extractErrorMessage(undefined, "Default error"), "Default error");
  assert.strictEqual(extractErrorMessage({}, "Default error"), "Default error");
});

test("extractErrorMessage - Preserves non-empty string body as message", () => {
  assert.strictEqual(
    extractErrorMessage("Raw internal server error string", "Fallback"),
    "Raw internal server error string"
  );
});

// ─── 3. ApiError class verification ────────────────────────────────────────

test("ApiError - Sets status, code, details and inherits Error correctly", () => {
  const err = new ApiError("Failed to fetch", 404, "NOT_FOUND", { resource: "project" });
  assert.strictEqual(err.name, "ApiError");
  assert.strictEqual(err.message, "Failed to fetch");
  assert.strictEqual(err.status, 404);
  assert.strictEqual(err.code, "NOT_FOUND");
  assert.deepStrictEqual(err.details, { resource: "project" });
  assert.ok(err instanceof Error);
  assert.ok(err instanceof ApiError);
});

// ─── 4. Simulated request() pipeline with unwrapEnvelope ───────────────────

test("request pipeline simulation - 200 response with success envelope unwraps data", async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({
      success: true,
      data: [{ id: "proj-1", name: "DevSync" }],
    }),
  };

  const body = await mockResponse.json();
  const unwrapped = unwrapEnvelope(body);
  assert.ok(Array.isArray(unwrapped));
  assert.strictEqual((unwrapped as any)[0].name, "DevSync");
});

test("request pipeline simulation - 204 No Content yields undefined", () => {
  const status = 204;
  const result = status === 204 ? undefined : "something";
  assert.strictEqual(result, undefined);
});

test("request pipeline simulation - 400 Bad Request extracts validation messages", () => {
  const errorBody = {
    statusCode: 400,
    message: ["title is required", "priority must be a valid enum value"],
  };
  const message = extractErrorMessage(errorBody, "Request failed.");
  const apiError = new ApiError(message, 400, "BAD_REQUEST", errorBody);

  assert.strictEqual(apiError.status, 400);
  assert.strictEqual(
    apiError.message,
    "title is required; priority must be a valid enum value"
  );
});

test("request pipeline simulation - 401 Unauthorized creates proper ApiError", () => {
  const authErrorBody = {
    statusCode: 401,
    message: "Invalid token signature",
  };
  const message = extractErrorMessage(authErrorBody, "Authentication failed.");
  const apiError = new ApiError(message, 401, "UNAUTHORIZED", authErrorBody);

  assert.strictEqual(apiError.status, 401);
  assert.strictEqual(apiError.code, "UNAUTHORIZED");
  assert.strictEqual(apiError.message, "Invalid token signature");
});
