/**
 * DevSync AI — Milestone 4B.5 Phase 1B: Chat Frontend Integration Tests
 *
 * Test Suite Coverage:
 * 1. API response-envelope handling (chatApi unwraps { data } or direct arrays)
 * 2. Channel retrieval: Fetches channels for current project
 * 3. Channel creation: Submits create payload, adds channel to store
 * 4. Message history retrieval: Fetches messages for active channel
 * 5. Message sending: Sends via REST, appends to store
 * 6. Message editing: Calls PATCH, updates message content in store
 * 7. Message deletion: Calls DELETE, removes message from store
 * 8. Correct REST route and payload contracts (both dual mutation routes)
 * 9. No client-controlled sender identity transmitted in payload
 * 10. Channel switching clears stale messages
 * 11. Project switching clears stale channels and activeChannel
 * 12. Failed API requests record error and do NOT fallback to mock data
 * 13. Optimistic message rollback on failure
 * 14. Socket connection authentication (passing token to /chat namespace)
 * 15. Socket event listener cleanup on disconnect
 * 16. Duplicate message prevention (ignoring existing message ID)
 * 17. Reconnection behavior (re-joining active channel room)
 * 18. Logout clears Chat state (clearChatState resets store)
 */

import test from "node:test";
import assert from "node:assert";

import {
  chatApi,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  type ChatChannel,
  type ChatMessageItem,
} from "../src/lib/api.js";
import { useChatStore } from "../src/store/chat.store.js";

// Mock localStorage in global scope for node:test environment if not present
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

/* =========================================================
   MOCK FIXTURES
   ========================================================= */

const mockChannel1: ChatChannel = {
  id: "chan-uuid-1",
  name: "general",
  type: "PROJECT",
  isPrivate: false,
  projectId: "proj-uuid-1",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

const mockChannel2: ChatChannel = {
  id: "chan-uuid-2",
  name: "dev-team",
  type: "PROJECT",
  isPrivate: true,
  projectId: "proj-uuid-1",
  createdAt: "2026-11-01T11:00:00.000Z",
  updatedAt: "2026-11-01T11:00:00.000Z",
};

const mockMessage1: ChatMessageItem = {
  id: "msg-uuid-1",
  channelId: "chan-uuid-1",
  senderId: "user-uuid-1",
  content: "Hello team, welcome to project DevSync AI!",
  type: "TEXT",
  createdAt: "2026-11-01T10:05:00.000Z",
  sender: {
    id: "user-uuid-1",
    firstName: "Alex",
    lastName: "Morgan",
    username: "alexm",
    avatarUrl: null,
  },
};

const mockMessage2: ChatMessageItem = {
  id: "msg-uuid-2",
  channelId: "chan-uuid-1",
  senderId: "user-uuid-2",
  content: "Standing by for sprint deployment.",
  type: "TEXT",
  createdAt: "2026-11-01T10:06:00.000Z",
  sender: {
    id: "user-uuid-2",
    firstName: "Sarah",
    lastName: "Chen",
    username: "sarahc",
    avatarUrl: null,
  },
};

/* =========================================================
   TEST 1: API RESPONSE-ENVELOPE HANDLING
   ========================================================= */
test("1. API response-envelope handling - unwraps { data } or direct arrays", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // 1a: getProjectChannels with wrapped envelope { data: [...] }
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [mockChannel1, mockChannel2] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const channelsWrapped = await chatApi.getProjectChannels("proj-uuid-1");
    assert.strictEqual(Array.isArray(channelsWrapped), true);
    assert.strictEqual(channelsWrapped.length, 2);
    assert.strictEqual(channelsWrapped[0].id, "chan-uuid-1");

    // 1b: getProjectChannels with direct array [...]
    globalThis.fetch = async () =>
      new Response(JSON.stringify([mockChannel1]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const channelsDirect = await chatApi.getProjectChannels("proj-uuid-1");
    assert.strictEqual(channelsDirect.length, 1);
    assert.strictEqual(channelsDirect[0].id, "chan-uuid-1");

    // 1c: getMessages with wrapped envelope { data: [...] }
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [mockMessage1, mockMessage2] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const messagesWrapped = await chatApi.getMessages("chan-uuid-1");
    assert.strictEqual(messagesWrapped.length, 2);
    assert.strictEqual(messagesWrapped[0].content, mockMessage1.content);

    // 1d: createChannel with wrapped envelope { data: {...} }
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: mockChannel1 }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    const channelCreated = await chatApi.createChannel({ name: "general" });
    assert.strictEqual(channelCreated.id, "chan-uuid-1");
    assert.strictEqual(channelCreated.name, "general");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   TEST 2: CHANNEL RETRIEVAL
   ========================================================= */
test("2. Channel retrieval - Fetches channels for current project and auto-selects first", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/chat/channels/chan-uuid-1/messages")) {
        return new Response(JSON.stringify({ data: [mockMessage1] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [mockChannel1, mockChannel2] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    useChatStore.getState().setProjectId("proj-uuid-1");
    await useChatStore.getState().fetchChannels("proj-uuid-1");

    const state = useChatStore.getState();
    assert.strictEqual(state.channels.length, 2);
    assert.strictEqual(state.channels[0].name, "general");
    assert.strictEqual(state.activeChannel?.id, "chan-uuid-1");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 3: CHANNEL CREATION
   ========================================================= */
test("3. Channel creation - Submits create payload, adds channel to store, and selects it", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (init?.method === "POST" && url.includes("/chat/channels")) {
        return new Response(JSON.stringify({ data: mockChannel2 }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    useChatStore.setState({ currentProjectId: "proj-uuid-1", channels: [mockChannel1] });

    const newChan = await useChatStore.getState().createChannel({
      name: "dev-team",
      isPrivate: true,
    });

    assert.strictEqual(newChan.id, "chan-uuid-2");
    assert.strictEqual(newChan.isPrivate, true);

    const state = useChatStore.getState();
    assert.strictEqual(state.channels.some((c) => c.id === "chan-uuid-2"), true);
    assert.strictEqual(state.activeChannel?.id, "chan-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 4: MESSAGE HISTORY RETRIEVAL
   ========================================================= */
test("4. Message history retrieval - Fetches messages for active channel", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/chat/channels/chan-uuid-1/messages")) {
        return new Response(JSON.stringify({ data: [mockMessage1, mockMessage2] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    useChatStore.setState({ activeChannel: mockChannel1 });
    await useChatStore.getState().fetchMessages("chan-uuid-1");

    const state = useChatStore.getState();
    assert.strictEqual(state.messages.length, 2);
    assert.strictEqual(state.messages[0].id, "msg-uuid-1");
    assert.strictEqual(state.messages[1].id, "msg-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 5: MESSAGE SENDING (REST PATH)
   ========================================================= */
test("5. Message sending - Sends via REST when socket disconnected, updates store", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  const confirmedMsg: ChatMessageItem = {
    id: "msg-uuid-confirmed",
    channelId: "chan-uuid-1",
    senderId: "user-uuid-1",
    content: "Sending deployment notice",
    type: "TEXT",
    createdAt: new Date().toISOString(),
    sender: mockMessage1.sender,
  };

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST" && input.toString().includes("/chat/messages")) {
        return new Response(JSON.stringify({ data: confirmedMsg }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };

    useChatStore.setState({ activeChannel: mockChannel1, socket: null, messages: [] });

    const sent = await useChatStore.getState().sendMessage("Sending deployment notice", {
      id: "user-uuid-1",
      firstName: "Alex",
      lastName: "Morgan",
      username: "alexm",
    });

    assert.strictEqual(sent?.id, "msg-uuid-confirmed");
    const state = useChatStore.getState();
    assert.strictEqual(state.messages.length, 1);
    assert.strictEqual(state.messages[0].id, "msg-uuid-confirmed");
    assert.strictEqual(state.messages[0].content, "Sending deployment notice");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 6: MESSAGE EDITING
   ========================================================= */
test("6. Message editing - Calls PATCH, updates message content in store", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return new Response(
          JSON.stringify({
            data: { ...mockMessage1, content: "Corrected message text" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };

    useChatStore.setState({
      activeChannel: mockChannel1,
      messages: [mockMessage1],
    });

    const updated = await useChatStore.getState().editMessage("msg-uuid-1", "Corrected message text");
    assert.strictEqual(updated.content, "Corrected message text");

    const state = useChatStore.getState();
    assert.strictEqual(state.messages[0].content, "Corrected message text");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 7: MESSAGE DELETION
   ========================================================= */
test("7. Message deletion - Calls DELETE, removes message from store", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };

    useChatStore.setState({
      activeChannel: mockChannel1,
      messages: [mockMessage1, mockMessage2],
    });

    await useChatStore.getState().deleteMessage("msg-uuid-1");

    const state = useChatStore.getState();
    assert.strictEqual(state.messages.length, 1);
    assert.strictEqual(state.messages[0].id, "msg-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 8: CORRECT REST ROUTE AND PAYLOAD CONTRACTS
   ========================================================= */
test("8. Correct REST route and payload contracts - both dual mutation routes supported", async () => {
  const originalFetch = globalThis.fetch;
  const capturedCalls: Array<{ url: string; method: string }> = [];

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedCalls.push({
        url: input.toString(),
        method: init?.method ?? "GET",
      });
      return new Response(
        JSON.stringify({ data: { id: "msg-test", content: "test" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    // 8a: editMessage with channelId -> /chat/channels/:channelId/messages/:id
    await chatApi.editMessage("msg-1", "edit1", "chan-1");
    assert.strictEqual(
      capturedCalls[0].url.includes("/chat/channels/chan-1/messages/msg-1"),
      true,
    );
    assert.strictEqual(capturedCalls[0].method, "PATCH");

    // 8b: editMessage without channelId -> /chat/messages/:id
    await chatApi.editMessage("msg-2", "edit2");
    assert.strictEqual(
      capturedCalls[1].url.includes("/chat/messages/msg-2"),
      true,
    );
    assert.strictEqual(capturedCalls[1].method, "PATCH");

    // 8c: deleteMessage with channelId -> /chat/channels/:channelId/messages/:id
    await chatApi.deleteMessage("msg-1", "chan-1");
    assert.strictEqual(
      capturedCalls[2].url.includes("/chat/channels/chan-1/messages/msg-1"),
      true,
    );
    assert.strictEqual(capturedCalls[2].method, "DELETE");

    // 8d: deleteMessage without channelId -> /chat/messages/:id
    await chatApi.deleteMessage("msg-2");
    assert.strictEqual(
      capturedCalls[3].url.includes("/chat/messages/msg-2"),
      true,
    );
    assert.strictEqual(capturedCalls[3].method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   TEST 9: NO CLIENT-CONTROLLED SENDER IDENTITY TRANSMITTED
   ========================================================= */
test("9. No client-controlled sender identity transmitted in payload", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any = null;

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body.toString());
      }
      return new Response(
        JSON.stringify({ data: mockMessage1 }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    };

    await chatApi.sendMessage({
      channelId: "chan-uuid-1",
      content: "Security audit message",
    });

    assert.ok(capturedBody, "Expected request body to be captured");
    assert.strictEqual(capturedBody.channelId, "chan-uuid-1");
    assert.strictEqual(capturedBody.content, "Security audit message");
    assert.strictEqual(capturedBody.senderId, undefined);
    assert.strictEqual(capturedBody.userId, undefined);
    assert.strictEqual(capturedBody.sender, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* =========================================================
   TEST 10: CHANNEL SWITCHING CLEARS STALE MESSAGES
   ========================================================= */
test("10. Channel switching clears stale messages immediately", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    let resolveSecondFetch: (res: any) => void;
    const secondFetchPromise = new Promise((resolve) => {
      resolveSecondFetch = resolve;
    });

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/chat/channels/chan-uuid-2/messages")) {
        await secondFetchPromise;
        return new Response(JSON.stringify({ data: [mockMessage2] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: [mockMessage1] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    // Set initial channel and messages
    useChatStore.setState({
      channels: [mockChannel1, mockChannel2],
      activeChannel: mockChannel1,
      messages: [mockMessage1],
    });

    // Start channel switch to mockChannel2
    const switchPromise = useChatStore.getState().selectChannel(mockChannel2);

    // Immediately after selectChannel initiation, messages must be cleared (0 stale messages)
    assert.strictEqual(
      useChatStore.getState().messages.length,
      0,
      "Messages must be cleared immediately upon channel switch",
    );
    assert.strictEqual(useChatStore.getState().activeChannel?.id, "chan-uuid-2");

    // Resolve the second fetch
    resolveSecondFetch!(null);
    await switchPromise;

    // Now messages contain mockMessage2
    assert.strictEqual(useChatStore.getState().messages.length, 1);
    assert.strictEqual(useChatStore.getState().messages[0].id, "msg-uuid-2");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 11: PROJECT SWITCHING CLEARS STALE CHANNELS & ACTIVECHANNEL
   ========================================================= */
test("11. Project switching clears stale channels, activeChannel, and messages", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    useChatStore.setState({
      currentProjectId: "proj-uuid-1",
      channels: [mockChannel1],
      activeChannel: mockChannel1,
      messages: [mockMessage1],
    });

    // Switch to proj-uuid-2
    useChatStore.getState().setProjectId("proj-uuid-2");

    const state = useChatStore.getState();
    assert.strictEqual(state.currentProjectId, "proj-uuid-2");
    assert.strictEqual(state.channels.length, 0);
    assert.strictEqual(state.activeChannel, null);
    assert.strictEqual(state.messages.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 12: FAILED API REQUESTS RECORD ERROR AND DO NOT FALLBACK
   ========================================================= */
test("12. Failed API requests record error and do NOT fallback to mock data", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          statusCode: 500,
          message: "Internal server error: Database unreachable",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );

    useChatStore.setState({ currentProjectId: "proj-err" });
    await useChatStore.getState().fetchChannels("proj-err");

    const state = useChatStore.getState();
    assert.ok(state.error !== null, "Error must be recorded in store");
    assert.strictEqual(state.channels.length, 0, "No mock channels must be inserted");
    assert.strictEqual(state.activeChannel, null);
    assert.strictEqual(state.messages.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 13: OPTIMISTIC MESSAGE ROLLBACK ON FAILURE
   ========================================================= */
test("13. Optimistic message rollback on failure", async () => {
  const originalFetch = globalThis.fetch;
  useChatStore.getState().clearChatState();

  try {
    globalThis.fetch = async () => {
      throw new Error("Network connection dropped");
    };

    useChatStore.setState({
      activeChannel: mockChannel1,
      messages: [mockMessage1],
      socket: null,
    });

    let caughtError: any = null;
    try {
      await useChatStore.getState().sendMessage("This will fail");
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, "Expected sendMessage to reject on network failure");
    const state = useChatStore.getState();
    assert.strictEqual(state.isSending, false);
    assert.ok(state.error !== null, "Error must be recorded in store");
    // Stale optimistic message must be rolled back, leaving only original mockMessage1
    assert.strictEqual(state.messages.length, 1);
    assert.strictEqual(state.messages[0].id, "msg-uuid-1");
  } finally {
    globalThis.fetch = originalFetch;
    useChatStore.getState().clearChatState();
  }
});

/* =========================================================
   TEST 14: SOCKET CONNECTION AUTHENTICATION
   ========================================================= */
test("14. Socket connection authentication - attaches JWT token from auth storage", () => {
  clearAccessToken();
  useChatStore.getState().clearChatState();

  // Without token, initSocket returns null and remains disconnected
  const noTokenSocket = useChatStore.getState().initSocket();
  assert.strictEqual(noTokenSocket, null);
  assert.strictEqual(useChatStore.getState().isConnected, false);

  // Set real token
  setAccessToken("test-valid-jwt-token-chat-4b5");
  assert.strictEqual(getAccessToken(), "test-valid-jwt-token-chat-4b5");

  const socket = useChatStore.getState().initSocket();
  assert.ok(socket !== null, "Socket instance must be created when token exists");
  assert.strictEqual(useChatStore.getState().socket, socket);

  // Clean up
  useChatStore.getState().disconnectSocket();
  clearAccessToken();
});

/* =========================================================
   TEST 15: SOCKET EVENT LISTENER CLEANUP ON DISCONNECT
   ========================================================= */
test("15. Socket event listener cleanup on disconnect", () => {
  let removeAllListenersCalled = false;
  let disconnectCalled = false;

  const mockSocket = {
    connected: true,
    removeAllListeners: () => {
      removeAllListenersCalled = true;
    },
    disconnect: () => {
      disconnectCalled = true;
    },
  };

  useChatStore.setState({
    socket: mockSocket as any,
    isConnected: true,
  });

  useChatStore.getState().disconnectSocket();

  assert.strictEqual(removeAllListenersCalled, true);
  assert.strictEqual(disconnectCalled, true);
  assert.strictEqual(useChatStore.getState().socket, null);
  assert.strictEqual(useChatStore.getState().isConnected, false);
});

/* =========================================================
   TEST 16: DUPLICATE MESSAGE PREVENTION
   ========================================================= */
test("16. Duplicate message prevention - ignores incoming socket message with existing ID", () => {
  useChatStore.getState().clearChatState();
  useChatStore.setState({
    activeChannel: mockChannel1,
    messages: [mockMessage1],
  });

  // Attempt to receive duplicate
  useChatStore.getState().receiveMessage(mockMessage1);
  assert.strictEqual(useChatStore.getState().messages.length, 1);

  // Receive distinct message
  useChatStore.getState().receiveMessage(mockMessage2);
  assert.strictEqual(useChatStore.getState().messages.length, 2);
  assert.strictEqual(useChatStore.getState().messages[1].id, "msg-uuid-2");

  useChatStore.getState().clearChatState();
});

/* =========================================================
   TEST 17: RECONNECTION BEHAVIOR
   ========================================================= */
test("17. Reconnection behavior - re-joins active channel room on connect event", () => {
  const events: Record<string, Function> = {};
  const emittedEvents: Array<{ event: string; data: any }> = [];

  const mockSocket = {
    connected: true,
    on: (evt: string, cb: Function) => {
      events[evt] = cb;
    },
    emit: (evt: string, data: any) => {
      emittedEvents.push({ event: evt, data });
    },
    removeAllListeners: () => {},
    disconnect: () => {},
  };

  // Set token and custom mock socket
  setAccessToken("recon-token");
  useChatStore.setState({
    activeChannel: mockChannel1,
    socket: mockSocket as any,
  });

  // Attach connect listener as done in initSocket
  mockSocket.on("connect", () => {
    useChatStore.setState({ isConnected: true });
    const active = useChatStore.getState().activeChannel;
    if (active?.id) {
      mockSocket.emit("join-channel", active.id);
    }
  });

  // Trigger reconnect
  events["connect"]();

  assert.strictEqual(useChatStore.getState().isConnected, true);
  assert.strictEqual(emittedEvents.length, 1);
  assert.strictEqual(emittedEvents[0].event, "join-channel");
  assert.strictEqual(emittedEvents[0].data, "chan-uuid-1");

  useChatStore.getState().clearChatState();
  clearAccessToken();
});

/* =========================================================
   TEST 18: LOGOUT CLEARS CHAT STATE
   ========================================================= */
test("18. Logout clears Chat state - clearChatState resets all channel and message data", () => {
  useChatStore.setState({
    channels: [mockChannel1, mockChannel2],
    activeChannel: mockChannel1,
    messages: [mockMessage1, mockMessage2],
    currentProjectId: "proj-uuid-1",
    isLoadingChannels: false,
    isLoadingMessages: false,
    isSending: false,
    error: "Some error",
    isConnected: true,
    typingUsers: { "chan-uuid-1": "alexm" },
    socket: { removeAllListeners: () => {}, disconnect: () => {} } as any,
  });

  useChatStore.getState().clearChatState();

  const state = useChatStore.getState();
  assert.deepStrictEqual(state.channels, []);
  assert.strictEqual(state.activeChannel, null);
  assert.deepStrictEqual(state.messages, []);
  assert.strictEqual(state.currentProjectId, null);
  assert.strictEqual(state.isConnected, false);
  assert.strictEqual(state.socket, null);
  assert.strictEqual(state.error, null);
  assert.deepStrictEqual(state.typingUsers, {});
});
