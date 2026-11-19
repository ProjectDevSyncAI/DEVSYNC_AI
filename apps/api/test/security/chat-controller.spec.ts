import test from 'node:test';
import assert from 'node:assert';
import { ChatController } from '../../src/chat/chat.controller.js';
import { ChatService } from '../../src/chat/chat.service.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

interface MockPrismaChatOptions {
  authorizedProjectIds?: string[];
  orgOwnerUserId?: string;
  orgAdminUserId?: string;
}

function createMockPrismaForChat(options: MockPrismaChatOptions = {}) {
  const {
    authorizedProjectIds = ['proj-auth-1'],
    orgOwnerUserId = 'user-org-owner',
    orgAdminUserId = 'user-org-admin',
  } = options;

  const channelsStore: any[] = [
    {
      id: 'chan-public-1',
      projectId: 'proj-auth-1',
      name: 'general',
      type: 'PROJECT',
      isPrivate: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: 'chan-private-1',
      projectId: 'proj-auth-1',
      name: 'private-devs',
      type: 'PROJECT',
      isPrivate: true,
      createdAt: new Date('2026-01-02T00:00:00Z'),
    },
    {
      id: 'chan-foreign-1',
      projectId: 'proj-foreign-1',
      name: 'foreign-secrets',
      type: 'PROJECT',
      isPrivate: false,
      createdAt: new Date('2026-01-03T00:00:00Z'),
    },
  ];

  const channelMembersStore: any[] = [
    { id: 'cm-1', channelId: 'chan-private-1', userId: 'user-private-member' },
  ];

  const messagesStore: any[] = [
    {
      id: 'msg-1',
      channelId: 'chan-public-1',
      senderId: 'user-auth-1',
      content: 'Hello team',
      type: 'TEXT',
      metadata: null,
      deletedAt: null,
      createdAt: new Date('2026-01-01T01:00:00Z'),
    },
    {
      id: 'msg-foreign-1',
      channelId: 'chan-foreign-1',
      senderId: 'user-foreign-1',
      content: 'Confidential foreign message',
      type: 'TEXT',
      metadata: null,
      deletedAt: null,
      createdAt: new Date('2026-01-01T02:00:00Z'),
    },
  ];

  return {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'user-suspended') return { id: 'user-suspended', status: 'SUSPENDED' };
        return { id: where.id, status: 'ACTIVE' };
      },
    },
    project: {
      findUnique: async ({ where, select }: any) => {
        if (where.id === 'proj-nonexistent') return null;
        const isAuth = authorizedProjectIds.includes(where.id);
        const queryUserId = select?.members?.where?.userId ?? where?.members?.where?.userId;
        const isProjectMember = isAuth && (queryUserId === 'user-auth-1' || queryUserId === 'user-private-member');

        return {
          id: where.id,
          organizationId: isAuth ? 'org-auth' : 'org-foreign',
          organization: {
            id: isAuth ? 'org-auth' : 'org-foreign',
            ownerId: isAuth ? orgOwnerUserId : 'foreign-owner',
          },
          members: isProjectMember ? [{ id: 'pm-1' }] : [],
        };
      },
    },
    projectMember: {
      findMany: async ({ where }: any) => {
        if (where?.userId === 'user-auth-1' || where?.userId === 'user-private-member') {
          return authorizedProjectIds.map((pId) => ({ projectId: pId }));
        }
        return [];
      },
    },
    organizationMember: {
      findUnique: async ({ where }: any) => {
        const { organizationId_userId } = where;
        if (organizationId_userId?.userId === orgAdminUserId) {
          return { role: 'ADMIN' };
        }
        if (organizationId_userId?.userId === orgOwnerUserId) {
          return { role: 'OWNER' };
        }
        return null;
      },
    },
    chatChannel: {
      create: async ({ data }: any) => {
        const created = { id: `chan-${Date.now()}`, ...data, createdAt: new Date() };
        channelsStore.push(created);
        return created;
      },
      findUnique: async ({ where, select }: any) => {
        const chan = channelsStore.find((c) => c.id === where.id);
        if (!chan) return null;

        const isAuth = authorizedProjectIds.includes(chan.projectId);
        const queryUserId = select?.members?.where?.userId;
        const channelMembers = channelMembersStore.filter(
          (cm) => cm.channelId === chan.id && (!queryUserId || cm.userId === queryUserId),
        );

        const project = chan.projectId
          ? {
              id: chan.projectId,
              organizationId: isAuth ? 'org-auth' : 'org-foreign',
              organization: {
                id: isAuth ? 'org-auth' : 'org-foreign',
                ownerId: isAuth ? orgOwnerUserId : 'foreign-owner',
              },
              members: isAuth && queryUserId && (queryUserId === 'user-auth-1' || queryUserId === 'user-private-member')
                ? [{ id: 'pm-1' }]
                : [],
            }
          : null;

        return {
          ...chan,
          members: channelMembers,
          project,
        };
      },
      findMany: async ({ where, include }: any) => {
        let results = channelsStore.filter((c) => c.projectId === where.projectId);
        const queryUserId = include?.members?.where?.userId;
        return results.map((c) => {
          const members = channelMembersStore.filter(
            (cm) => cm.channelId === c.id && (!queryUserId || cm.userId === queryUserId),
          );
          return { ...c, members };
        });
      },
      delete: async ({ where }: any) => {
        const idx = channelsStore.findIndex((c) => c.id === where.id);
        if (idx >= 0) channelsStore.splice(idx, 1);
        return { id: where.id };
      },
    },
    chatChannelMember: {
      create: async ({ data }: any) => {
        const created = { id: `cm-${Date.now()}`, ...data };
        channelMembersStore.push(created);
        return created;
      },
      findMany: async () => channelMembersStore,
    },
    chatMessage: {
      create: async ({ data }: any) => {
        const created = {
          id: `msg-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          deletedAt: null,
          sender: {
            id: data.senderId,
            firstName: 'Auth',
            lastName: 'User',
            username: 'authuser',
            avatarUrl: null,
          },
        };
        messagesStore.push(created);
        return created;
      },
      findUnique: async ({ where }: any) => {
        const msg = messagesStore.find((m) => m.id === where.id);
        if (!msg) return null;

        const chan = channelsStore.find((c) => c.id === msg.channelId);
        const isAuth = chan ? authorizedProjectIds.includes(chan.projectId) : false;

        return {
          ...msg,
          channel: chan
            ? {
                ...chan,
                project: {
                  organizationId: isAuth ? 'org-auth' : 'org-foreign',
                  organization: { ownerId: isAuth ? orgOwnerUserId : 'foreign-owner' },
                },
              }
            : null,
        };
      },
      findMany: async ({ where }: any) => {
        return messagesStore.filter((m) => m.channelId === where.channelId && m.deletedAt === null);
      },
      update: async ({ where, data }: any) => {
        const msg = messagesStore.find((m) => m.id === where.id);
        if (msg) Object.assign(msg, data);
        return msg;
      },
    },
  } as any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: Class-Level Guard Protection
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [1] - ChatController is decorated with JwtAuthGuard at class level', () => {
  const guards = Reflect.getMetadata('__guards__', ChatController);
  assert.ok(Array.isArray(guards), 'ChatController must have guards applied');
  assert.ok(
    guards.includes(JwtAuthGuard),
    'ChatController class must be protected by JwtAuthGuard',
  );
});

test('Chat Security [1b] - Unauthenticated requests are rejected', async () => {
  const prisma = createMockPrismaForChat();
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const unauthenticatedReq = { user: undefined };

  await assert.rejects(
    () => controller.createChannel(unauthenticatedReq, { name: 'test-chan' }),
    (err: any) => err.status === 403,
    'Unauthenticated request must be rejected with 403 Forbidden',
  );

  await assert.rejects(
    () => controller.sendMessage(unauthenticatedReq, { channelId: 'chan-public-1', content: 'test' }),
    (err: any) => err.status === 403,
    'Unauthenticated message sending must be rejected with 403 Forbidden',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 2 & 3: Channel Creation Authorization
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [2] - Authenticated authorized user can create a project channel', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };
  const channel = await controller.createChannel(req, {
    projectId: 'proj-auth-1',
    name: 'backend-team',
    isPrivate: false,
  });

  assert.ok(channel.id);
  assert.strictEqual(channel.name, 'backend-team');
  assert.strictEqual(channel.projectId, 'proj-auth-1');
});

test('Chat Security [3] - Unauthorized user cannot create a channel in another project (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () =>
      controller.createChannel(req, {
        projectId: 'proj-foreign-1',
        name: 'intruder-channel',
      }),
    (err: any) => err.status === 403,
    'Creating channel in unauthorized project must throw 403 Forbidden',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 4 & 5: Channel Retrieval & Private Channel Protection
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [4] - Authorized user can retrieve permitted project channels', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };
  const channels = await controller.getProjectChannels(req, 'proj-auth-1');

  assert.ok(Array.isArray(channels));
  const publicChan = channels.find((c: any) => c.id === 'chan-public-1');
  assert.ok(publicChan, 'Authorized member must be able to view public channels');
});

test('Chat Security [5] - Unauthorized user cannot retrieve private channels or foreign channels', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // user-auth-1 is a project member, but NOT a direct member of chan-private-1
  const req = { user: { userId: 'user-auth-1' } };
  const channels = await controller.getProjectChannels(req, 'proj-auth-1');

  const privateChan = channels.find((c: any) => c.id === 'chan-private-1');
  assert.strictEqual(
    privateChan,
    undefined,
    'Non-member regular project user must NOT see private channel in listing',
  );

  // Direct channel retrieval of private channel without membership must throw 403
  await assert.rejects(
    () => controller.getChannel(req, 'chan-private-1'),
    (err: any) => err.status === 403,
    'Direct access to private channel without membership must throw 403 Forbidden',
  );

  // Direct access to foreign organization channel must throw 403
  await assert.rejects(
    () => controller.getChannel(req, 'chan-foreign-1'),
    (err: any) => err.status === 403,
    'Direct access to foreign channel must throw 403 Forbidden',
  );
});

test('Chat Security [5b] - Private channel member can retrieve private channel', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // user-private-member IS a member of chan-private-1
  const req = { user: { userId: 'user-private-member' } };
  const channel = await controller.getChannel(req, 'chan-private-1');
  assert.strictEqual(channel.id, 'chan-private-1');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 6, 7 & 8: Message Sending & Sender Spoofing Prevention
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [6] - Authorized user can send a message', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };
  const msg = await controller.sendMessage(req, {
    channelId: 'chan-public-1',
    content: 'Valid team message',
  });

  assert.ok(msg.id);
  assert.strictEqual(msg.senderId, 'user-auth-1');
  assert.strictEqual(msg.content, 'Valid team message');
});

test('Chat Security [7] - Client-provided senderId cannot spoof another user', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // Attacker is user-auth-1, but supplies senderId: 'victim-ceo-user' in payload
  const req = { user: { userId: 'user-auth-1' } };
  const msg = await controller.sendMessage(req, {
    channelId: 'chan-public-1',
    senderId: 'victim-ceo-user',
    content: 'Spoofed message attempt',
  });

  assert.strictEqual(
    msg.senderId,
    'user-auth-1',
    'Message senderId must be strictly bound to authenticated JWT user, overriding client payload',
  );
});

test('Chat Security [8] - Unauthorized user cannot send messages to another project channel (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () =>
      controller.sendMessage(req, {
        channelId: 'chan-foreign-1',
        content: 'Cross-tenant message injection',
      }),
    (err: any) => err.status === 403,
    'Sending message to unauthorized channel must throw 403 Forbidden',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 9: Message History Retrieval
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [9] - Unauthorized user cannot retrieve message history (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () => controller.getMessages(req, 'chan-foreign-1'),
    (err: any) => err.status === 403,
    'Unauthorized user cannot view foreign message history',
  );

  // Authorized user CAN retrieve message history for permitted channel
  const messages = await controller.getMessages(req, 'chan-public-1');
  assert.ok(Array.isArray(messages));
  assert.ok(messages.length > 0);
  assert.strictEqual(messages[0].id, 'msg-1');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 10: Message Editing Permissions
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [10a] - Message author can edit their own message', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // user-auth-1 created msg-1
  const req = { user: { userId: 'user-auth-1' } };
  const updated = await controller.editMessage(req, 'msg-1', 'Updated content');

  assert.strictEqual(updated.content, 'Updated content');
});

test('Chat Security [10b] - Non-author regular user cannot edit another user message (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // user-private-member did NOT author msg-1 and is not org admin
  const req = { user: { userId: 'user-private-member' } };

  await assert.rejects(
    () => controller.editMessage(req, 'msg-1', 'Malicious edit attempt'),
    (err: any) => err.status === 403,
    'Non-author regular user must not edit another user message',
  );
});

test('Chat Security [10c] - Org admin can edit another user message', async () => {
  const prisma = createMockPrismaForChat({
    authorizedProjectIds: ['proj-auth-1'],
    orgAdminUserId: 'user-org-admin',
  });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-org-admin' } };
  const updated = await controller.editMessage(req, 'msg-1', 'Admin moderated content');

  assert.strictEqual(updated.content, 'Admin moderated content');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 11: Message Deletion Permissions
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [11a] - Message author can delete their own message', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };
  const deleted = await controller.deleteMessage(req, 'msg-1');

  assert.ok(deleted.deletedAt instanceof Date, 'Message must be soft-deleted with timestamp');
});

test('Chat Security [11b] - Non-author regular user cannot delete another user message (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-private-member' } };

  await assert.rejects(
    () => controller.deleteMessage(req, 'msg-1'),
    (err: any) => err.status === 403,
    'Non-author regular user must not delete another user message',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 12: Cross-Channel Message ID Manipulation
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [12] - Cross-channel message ID manipulation is rejected (400)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  // msg-1 belongs to chan-public-1. Attacker attempts to edit/delete it under chan-private-1
  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () => controller.editChannelMessage(req, 'chan-private-1', 'msg-1', 'Cross-channel edit attempt'),
    (err: any) => err.status === 400 && err.message.includes('Message does not belong to the specified channel'),
    'Cross-channel edit manipulation must be rejected with 400 Bad Request',
  );

  await assert.rejects(
    () => controller.deleteChannelMessage(req, 'chan-private-1', 'msg-1'),
    (err: any) => err.status === 400 && err.message.includes('Message does not belong to the specified channel'),
    'Cross-channel delete manipulation must be rejected with 400 Bad Request',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE 13: Channel Deletion Authorization
// ═══════════════════════════════════════════════════════════════════════════════

test('Chat Security [13a] - Regular user cannot delete a channel (403)', async () => {
  const prisma = createMockPrismaForChat({ authorizedProjectIds: ['proj-auth-1'] });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-auth-1' } };

  await assert.rejects(
    () => controller.deleteChannel(req, 'chan-public-1'),
    (err: any) => err.status === 403 && err.message.includes('administrative permission'),
    'Regular project member must be forbidden from deleting channel',
  );
});

test('Chat Security [13b] - Organization owner or admin can delete a channel', async () => {
  const prisma = createMockPrismaForChat({
    authorizedProjectIds: ['proj-auth-1'],
    orgOwnerUserId: 'user-org-owner',
  });
  const service = new ChatService(prisma);
  const controller = new ChatController(service);

  const req = { user: { userId: 'user-org-owner' } };
  const result = await controller.deleteChannel(req, 'chan-public-1');

  assert.strictEqual(result.id, 'chan-public-1');
});
