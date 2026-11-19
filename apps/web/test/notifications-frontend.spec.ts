/**
 * DevSync AI — Milestone 4B.5 Phase 2B: Notifications Frontend Tests
 *
 * Tests:
 *  1-11. mapNotificationType — all 13 Prisma enum values
 *  12-15. formatNotificationTime — just now, minutes, hours, days
 *  16-18. notificationApi — getNotifications (plain + envelope), getUnreadCount, markAsRead
 *  19-20. notificationApi — markAllAsRead, deleteNotification
 *  21-24. useNotificationStore — fetchNotifications (success + error), markAsRead (optimistic), markAllAsRead
 *  25-27. useNotificationStore — deleteNotification (unread + read), clearNotificationState
 *
 * Runner: npx tsx --test apps/web/test/notifications-frontend.spec.ts
 */

import test from "node:test";
import assert from "node:assert";

import {
  notificationApi,
  setAccessToken,
  type BackendNotification,
} from "../src/lib/api.js";

import {
  useNotificationStore,
  mapNotificationType,
  formatNotificationTime,
} from "../src/store/notification.store.js";

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

setAccessToken("test-jwt-token");

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeNotif(overrides: Partial<BackendNotification> = {}): BackendNotification {
  return {
    id: "notif-1",
    userId: "user-1",
    projectId: null,
    type: "TASK_ASSIGNED",
    priority: "NORMAL",
    title: "Task assigned",
    message: "You have been assigned a new task",
    metadata: null,
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    ...overrides,
  };
}

function resetFetch() {
  delete (globalThis as any).fetch;
}

function resetStore() {
  useNotificationStore.getState().clearNotificationState();
}

/* ================================================================== */
/*  SECTION 1 — mapNotificationType                                    */
/* ================================================================== */

test("mapNotificationType: TASK_ASSIGNED → task", () => {
  assert.equal(mapNotificationType("TASK_ASSIGNED"), "task");
});

test("mapNotificationType: TASK_UPDATED → task", () => {
  assert.equal(mapNotificationType("TASK_UPDATED"), "task");
});

test("mapNotificationType: ISSUE_ASSIGNED → task", () => {
  assert.equal(mapNotificationType("ISSUE_ASSIGNED"), "task");
});

test("mapNotificationType: ISSUE_UPDATED → task", () => {
  assert.equal(mapNotificationType("ISSUE_UPDATED"), "task");
});

test("mapNotificationType: MENTION → mention", () => {
  assert.equal(mapNotificationType("MENTION"), "mention");
});

test("mapNotificationType: PR_REVIEW → pull_request", () => {
  assert.equal(mapNotificationType("PR_REVIEW"), "pull_request");
});

test("mapNotificationType: PR_MERGED → pull_request", () => {
  assert.equal(mapNotificationType("PR_MERGED"), "pull_request");
});

test("mapNotificationType: AI_INSIGHT → ai", () => {
  assert.equal(mapNotificationType("AI_INSIGHT"), "ai");
});

test("mapNotificationType: RISK_DETECTED → ai", () => {
  assert.equal(mapNotificationType("RISK_DETECTED"), "ai");
});

test("mapNotificationType: CHAT_MESSAGE → chat", () => {
  assert.equal(mapNotificationType("CHAT_MESSAGE"), "chat");
});

test("mapNotificationType: SPRINT_STARTED → sprint", () => {
  assert.equal(mapNotificationType("SPRINT_STARTED"), "sprint");
});

test("mapNotificationType: SPRINT_COMPLETED → sprint", () => {
  assert.equal(mapNotificationType("SPRINT_COMPLETED"), "sprint");
});

test("mapNotificationType: SYSTEM → system", () => {
  assert.equal(mapNotificationType("SYSTEM"), "system");
});

/* ================================================================== */
/*  SECTION 2 — formatNotificationTime                                 */
/* ================================================================== */

test("formatNotificationTime: returns 'just now' for < 1 minute", () => {
  const iso = new Date(Date.now() - 30_000).toISOString();
  assert.equal(formatNotificationTime(iso), "just now");
});

test("formatNotificationTime: returns '5m ago' for 5 minutes ago", () => {
  const iso = new Date(Date.now() - 5 * 60_000).toISOString();
  assert.equal(formatNotificationTime(iso), "5m ago");
});

test("formatNotificationTime: returns '2h ago' for 2 hours ago", () => {
  const iso = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
  assert.equal(formatNotificationTime(iso), "2h ago");
});

test("formatNotificationTime: returns '3d ago' for 3 days ago", () => {
  const iso = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
  assert.equal(formatNotificationTime(iso), "3d ago");
});

/* ================================================================== */
/*  SECTION 3 — notificationApi                                        */
/* ================================================================== */

test("notificationApi.getNotifications: returns plain array", async () => {
  const notif = makeNotif();
  (globalThis as any).fetch = async (url: string) => {
    assert.ok((url as string).includes("/notifications"), `Unexpected URL: ${url}`);
    return makeResponse([notif]);
  };
  try {
    const result = await notificationApi.getNotifications();
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "notif-1");
  } finally { resetFetch(); }
});

test("notificationApi.getNotifications: appends ?unreadOnly=true", async () => {
  (globalThis as any).fetch = async (url: string) => {
    assert.ok((url as string).includes("unreadOnly=true"), `Missing query param: ${url}`);
    return makeResponse([]);
  };
  try {
    await notificationApi.getNotifications(true);
  } finally { resetFetch(); }
});

test("notificationApi.getNotifications: unwraps { data: [...] } envelope", async () => {
  const notif = makeNotif();
  (globalThis as any).fetch = async () =>
    makeResponse({ success: true, data: [notif] });
  try {
    const result = await notificationApi.getNotifications();
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Task assigned");
  } finally { resetFetch(); }
});

test("notificationApi.getUnreadCount: returns { count: number }", async () => {
  (globalThis as any).fetch = async (url: string) => {
    assert.ok((url as string).includes("unread-count"), `Unexpected URL: ${url}`);
    return makeResponse({ count: 7 });
  };
  try {
    const result = await notificationApi.getUnreadCount();
    assert.equal(result.count, 7);
  } finally { resetFetch(); }
});

test("notificationApi.markAsRead: calls PATCH /notifications/:id/read", async () => {
  const updated = makeNotif({ readAt: new Date().toISOString() });
  (globalThis as any).fetch = async (url: string, opts: RequestInit) => {
    assert.ok((url as string).includes("/notifications/notif-1/read"), `Unexpected URL: ${url}`);
    assert.equal(opts.method, "PATCH");
    return makeResponse(updated);
  };
  try {
    const result = await notificationApi.markAsRead("notif-1");
    assert.ok(result.readAt !== null);
  } finally { resetFetch(); }
});

test("notificationApi.markAllAsRead: calls PATCH /notifications/read-all", async () => {
  (globalThis as any).fetch = async (url: string, opts: RequestInit) => {
    assert.ok((url as string).includes("/notifications/read-all"), `Unexpected URL: ${url}`);
    assert.equal(opts.method, "PATCH");
    return makeResponse({ count: 4 });
  };
  try {
    const result = await notificationApi.markAllAsRead();
    assert.equal(result.count, 4);
  } finally { resetFetch(); }
});

test("notificationApi.deleteNotification: calls DELETE /notifications/:id", async () => {
  (globalThis as any).fetch = async (url: string, opts: RequestInit) => {
    assert.ok((url as string).includes("/notifications/notif-1"), `Unexpected URL: ${url}`);
    assert.equal(opts.method, "DELETE");
    return new Response(null, { status: 204 });
  };
  try {
    await assert.doesNotReject(() => notificationApi.deleteNotification("notif-1"));
  } finally { resetFetch(); }
});

/* ================================================================== */
/*  SECTION 4 — useNotificationStore                                   */
/* ================================================================== */

test("store.fetchNotifications: populates notifications and unreadCount", async () => {
  resetStore();
  const unread = makeNotif({ readAt: null });
  const read = makeNotif({ id: "notif-2", readAt: new Date().toISOString() });
  (globalThis as any).fetch = async () => makeResponse([unread, read]);
  try {
    await useNotificationStore.getState().fetchNotifications();
    const { notifications, unreadCount, isLoading, error } = useNotificationStore.getState();
    assert.equal(notifications.length, 2);
    assert.equal(unreadCount, 1);
    assert.equal(isLoading, false);
    assert.equal(error, null);
  } finally { resetFetch(); resetStore(); }
});

test("store.fetchNotifications: sets error state on 401 response", async () => {
  resetStore();
  (globalThis as any).fetch = async () => makeResponse({ message: "Unauthorized" }, 401);
  try {
    await useNotificationStore.getState().fetchNotifications();
    const { error, notifications } = useNotificationStore.getState();
    assert.ok(error !== null, "Expected error to be set");
    assert.equal(notifications.length, 0);
  } finally { resetFetch(); resetStore(); }
});

test("store.markAsRead: optimistically updates readAt and unreadCount", async () => {
  resetStore();
  useNotificationStore.setState({ notifications: [makeNotif()], unreadCount: 1 });
  const updated = makeNotif({ readAt: new Date().toISOString() });
  (globalThis as any).fetch = async () => makeResponse(updated);
  try {
    await useNotificationStore.getState().markAsRead("notif-1");
    const { notifications, unreadCount } = useNotificationStore.getState();
    assert.ok(notifications[0].readAt !== null);
    assert.equal(unreadCount, 0);
  } finally { resetFetch(); resetStore(); }
});

test("store.markAllAsRead: marks all unread items and sets unreadCount to 0", async () => {
  resetStore();
  useNotificationStore.setState({
    notifications: [
      makeNotif({ id: "n1", readAt: null }),
      makeNotif({ id: "n2", readAt: null }),
    ],
    unreadCount: 2,
  });
  (globalThis as any).fetch = async () => makeResponse({ count: 2 });
  try {
    await useNotificationStore.getState().markAllAsRead();
    const { notifications, unreadCount } = useNotificationStore.getState();
    assert.ok(notifications.every((n) => n.readAt !== null));
    assert.equal(unreadCount, 0);
  } finally { resetFetch(); resetStore(); }
});

test("store.deleteNotification: removes unread item and decrements unreadCount", async () => {
  resetStore();
  useNotificationStore.setState({ notifications: [makeNotif({ readAt: null })], unreadCount: 1 });
  (globalThis as any).fetch = async () => new Response(null, { status: 204 });
  try {
    await useNotificationStore.getState().deleteNotification("notif-1");
    const { notifications, unreadCount } = useNotificationStore.getState();
    assert.equal(notifications.length, 0);
    assert.equal(unreadCount, 0);
  } finally { resetFetch(); resetStore(); }
});

test("store.deleteNotification: does NOT decrement unreadCount for read item", async () => {
  resetStore();
  useNotificationStore.setState({
    notifications: [makeNotif({ readAt: new Date().toISOString() })],
    unreadCount: 0,
  });
  (globalThis as any).fetch = async () => new Response(null, { status: 204 });
  try {
    await useNotificationStore.getState().deleteNotification("notif-1");
    const { notifications, unreadCount } = useNotificationStore.getState();
    assert.equal(notifications.length, 0);
    assert.equal(unreadCount, 0);
  } finally { resetFetch(); resetStore(); }
});

test("store.clearNotificationState: resets all fields to initial values", () => {
  useNotificationStore.setState({
    notifications: [makeNotif()],
    unreadCount: 5,
    error: "some error",
  });
  useNotificationStore.getState().clearNotificationState();
  const { notifications, unreadCount, error, isLoading } = useNotificationStore.getState();
  assert.equal(notifications.length, 0);
  assert.equal(unreadCount, 0);
  assert.equal(error, null);
  assert.equal(isLoading, false);
});
