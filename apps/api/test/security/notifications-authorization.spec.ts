/**
 * DevSync AI — Milestone 4B.5 Phase 2A: Notifications Backend Security & Authorization Tests
 *
 * Verifies:
 * 1. Unauthenticated requests are rejected (JwtAuthGuard enforcement)
 * 2. Authenticated users can retrieve their own notifications
 * 3. User A cannot retrieve User B's notifications
 * 4. Unread counts are scoped to the authenticated user
 * 5. User A can mark their own notification as read
 * 6. User A cannot mark User B's notification as read
 * 7. Mark-all-as-read affects only the authenticated user's notifications
 * 8. User A can delete their own notification
 * 9. User A cannot delete User B's notification
 * 10. Client-provided userId cannot override JWT identity
 * 11. Client-provided recipientId cannot bypass recipient authorization
 * 12. Manipulated notification IDs are rejected (404 for non-existent IDs)
 * 13. Cross-organization notification access is rejected where applicable
 * 14. Existing legitimate system-generated notifications continue to work
 * 15. Invalid or unauthorized notification creation is rejected
 */

import test from 'node:test';
import assert from 'node:assert';
import { NotificationsController } from '../../src/notifications/notifications.controller.js';
import { NotificationsService } from '../../src/notifications/notifications.service.js';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard.js';

interface MockPrismaNotificationOptions {
  authorizedProjectIds?: string[];
  sharedOrgMemberships?: Array<{ userId: string; orgId: string }>;
}

function createMockPrismaForNotifications(options: MockPrismaNotificationOptions = {}) {
  const {
    authorizedProjectIds = ['proj-alpha-1'],
    sharedOrgMemberships = [
      { userId: 'user-a', orgId: 'org-1' },
      { userId: 'user-b', orgId: 'org-1' },
      { userId: 'user-cross-org', orgId: 'org-2' },
    ],
  } = options;

  let notificationsStore: any[] = [
    {
      id: 'notif-a-1',
      userId: 'user-a',
      projectId: 'proj-alpha-1',
      type: 'TASK_ASSIGNED',
      priority: 'NORMAL',
      title: 'Task Assigned',
      message: 'You have been assigned to task DevSync-101',
      metadata: null,
      readAt: null,
      createdAt: new Date('2026-11-01T10:00:00Z'),
    },
    {
      id: 'notif-a-2',
      userId: 'user-a',
      projectId: 'proj-alpha-1',
      type: 'MENTION',
      priority: 'HIGH',
      title: 'You were mentioned',
      message: 'Alex mentioned you in #general',
      metadata: null,
      readAt: new Date('2026-11-01T11:00:00Z'),
      createdAt: new Date('2026-11-01T10:30:00Z'),
    },
    {
      id: 'notif-b-1',
      userId: 'user-b',
      projectId: 'proj-alpha-1',
      type: 'SPRINT_STARTED',
      priority: 'NORMAL',
      title: 'Sprint Started',
      message: 'Sprint 01 is now active',
      metadata: null,
      readAt: null,
      createdAt: new Date('2026-11-01T09:00:00Z'),
    },
    {
      id: 'notif-b-2',
      userId: 'user-b',
      projectId: 'proj-alpha-1',
      type: 'ISSUE_ASSIGNED',
      priority: 'URGENT',
      title: 'Critical Bug Assigned',
      message: 'Please review memory leak on sync worker',
      metadata: null,
      readAt: null,
      createdAt: new Date('2026-11-01T09:30:00Z'),
    },
  ];

  const usersStore = [
    { id: 'user-a', status: 'ACTIVE' },
    { id: 'user-b', status: 'ACTIVE' },
    { id: 'user-cross-org', status: 'ACTIVE' },
    { id: 'user-inactive', status: 'SUSPENDED' },
  ];

  const projectsStore = [
    {
      id: 'proj-alpha-1',
      organizationId: 'org-1',
      organization: { id: 'org-1', ownerId: 'user-a' },
      members: [{ userId: 'user-a' }, { userId: 'user-b' }],
    },
    {
      id: 'proj-foreign-2',
      organizationId: 'org-2',
      organization: { id: 'org-2', ownerId: 'user-cross-org' },
      members: [{ userId: 'user-cross-org' }],
    },
  ];

  return {
    notification: {
      findMany: async (args: any) => {
        let result = notificationsStore.filter((n) => n.userId === args.where.userId);
        if (args.where.readAt === null) {
          result = result.filter((n) => n.readAt === null);
        }
        return [...result];
      },
      findUnique: async (args: any) => {
        const found = notificationsStore.find((n) => n.id === args.where.id);
        return found ? { ...found } : null;
      },
      count: async (args: any) => {
        let result = notificationsStore.filter((n) => n.userId === args.where.userId);
        if (args.where.readAt === null) {
          result = result.filter((n) => n.readAt === null);
        }
        return result.length;
      },
      create: async (args: any) => {
        const newNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          readAt: null,
          createdAt: new Date(),
        };
        notificationsStore.push(newNotif);
        return { ...newNotif };
      },
      update: async (args: any) => {
        const index = notificationsStore.findIndex((n) => n.id === args.where.id);
        if (index === -1) {
          return null;
        }
        notificationsStore[index] = {
          ...notificationsStore[index],
          ...args.data,
        };
        return { ...notificationsStore[index] };
      },
      updateMany: async (args: any) => {
        let count = 0;
        notificationsStore = notificationsStore.map((n) => {
          if (n.userId === args.where.userId) {
            if (args.where.readAt === null && n.readAt !== null) {
              return n;
            }
            count++;
            return { ...n, ...args.data };
          }
          return n;
        });
        return { count };
      },
      delete: async (args: any) => {
        const index = notificationsStore.findIndex((n) => n.id === args.where.id);
        if (index === -1) {
          return null;
        }
        const removed = notificationsStore.splice(index, 1)[0];
        return { ...removed };
      },
    },
    user: {
      findUnique: async (args: any) => {
        const user = usersStore.find((u) => u.id === args.where.id);
        return user ? { ...user } : null;
      },
    },
    project: {
      findUnique: async (args: any) => {
        const proj = projectsStore.find((p) => p.id === args.where.id);
        if (!proj) return null;
        return {
          id: proj.id,
          organizationId: proj.organizationId,
          organization: proj.organization,
          members: proj.members.filter((m) =>
            args.select?.members?.where?.userId
              ? m.userId === args.select.members.where.userId
              : true,
          ),
        };
      },
    },
    organizationMember: {
      findUnique: async (args: any) => {
        const member = sharedOrgMemberships.find(
          (m) =>
            m.userId === args.where?.organizationId_userId?.userId &&
            m.orgId === args.where?.organizationId_userId?.organizationId,
        );
        return member ? { role: 'MEMBER' } : null;
      },
      findFirst: async (args: any) => {
        const targetUserId = args.where.userId;
        const actorUserId = args.where.organization.members.some.userId;
        const actorOrgs = sharedOrgMemberships
          .filter((m) => m.userId === actorUserId)
          .map((m) => m.orgId);
        const targetOrgs = sharedOrgMemberships
          .filter((m) => m.userId === targetUserId)
          .map((m) => m.orgId);
        const shares = actorOrgs.some((org) => targetOrgs.includes(org));
        return shares ? { id: 'shared-org-1' } : null;
      },
    },
  } as any;
}

/* =========================================================
   SCENARIO 1: UNAUTHENTICATED REQUESTS ARE REJECTED
   ========================================================= */
test('1. Unauthenticated requests are rejected by JwtAuthGuard metadata and controller validation', async () => {
  const guards = Reflect.getMetadata('__guards__', NotificationsController);
  assert.ok(Array.isArray(guards), 'NotificationsController must declare guards');
  assert.strictEqual(
    guards.includes(JwtAuthGuard),
    true,
    'NotificationsController must be guarded with JwtAuthGuard',
  );

  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  // Missing req.user throws ForbiddenException
  await assert.rejects(
    async () => controller.findAll({}),
    /User is not authenticated/,
  );

  await assert.rejects(
    async () => controller.findOne({}, 'notif-a-1'),
    /User is not authenticated/,
  );

  await assert.rejects(
    async () => controller.getUnreadCount({}),
    /User is not authenticated/,
  );

  await assert.rejects(
    async () => controller.markAsRead({}, 'notif-a-1'),
    /User is not authenticated/,
  );

  await assert.rejects(
    async () => controller.markAllAsRead({}),
    /User is not authenticated/,
  );

  await assert.rejects(
    async () => controller.remove({}, 'notif-a-1'),
    /User is not authenticated/,
  );
});

/* =========================================================
   SCENARIO 2: AUTHENTICATED USERS CAN RETRIEVE THEIR OWN NOTIFICATIONS
   ========================================================= */
test('2. Authenticated users can retrieve their own notifications', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };
  const notifications = await controller.findAll(userAReq);

  assert.strictEqual(Array.isArray(notifications), true);
  assert.strictEqual(notifications.length, 2);
  assert.strictEqual(notifications[0].userId, 'user-a');
  assert.strictEqual(notifications[1].userId, 'user-a');
});

/* =========================================================
   SCENARIO 3: USER A CANNOT RETRIEVE USER B'S NOTIFICATIONS
   ========================================================= */
test("3. User A cannot retrieve User B's notifications (via list query or direct ID)", async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // Attempt to query User B's notifications via ?userId=user-b
  await assert.rejects(
    async () => controller.findAll(userAReq, undefined, 'user-b'),
    /Cannot access notifications of another user/,
  );

  // Attempt to read User B's notification via direct ID
  await assert.rejects(
    async () => controller.findOne(userAReq, 'notif-b-1'),
    /You do not have access to this notification/,
  );
});

/* =========================================================
   SCENARIO 4: UNREAD COUNTS ARE SCOPED TO THE AUTHENTICATED USER
   ========================================================= */
test('4. Unread counts are scoped strictly to the authenticated user', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  // User A has 2 total, 1 unread (notif-a-1 is unread, notif-a-2 is read)
  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };
  const countA = await controller.getUnreadCount(userAReq);
  assert.strictEqual(countA.count, 1);

  // User B has 2 unread (notif-b-1 and notif-b-2)
  const userBReq = { user: { userId: 'user-b', id: 'user-b' } };
  const countB = await controller.getUnreadCount(userBReq);
  assert.strictEqual(countB.count, 2);
});

/* =========================================================
   SCENARIO 5: USER A CAN MARK THEIR OWN NOTIFICATION AS READ
   ========================================================= */
test('5. User A can mark their own notification as read', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // Initial unread count is 1
  let count = await controller.getUnreadCount(userAReq);
  assert.strictEqual(count.count, 1);

  // Mark notif-a-1 as read
  const updated = await controller.markAsRead(userAReq, 'notif-a-1');
  assert.ok(updated.readAt !== null);

  // Unread count is now 0
  count = await controller.getUnreadCount(userAReq);
  assert.strictEqual(count.count, 0);
});

/* =========================================================
   SCENARIO 6: USER A CANNOT MARK USER B'S NOTIFICATION AS READ
   ========================================================= */
test("6. User A cannot mark User B's notification as read (403 Forbidden)", async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // Attempt to mark User B's notification
  await assert.rejects(
    async () => controller.markAsRead(userAReq, 'notif-b-1'),
    /You do not have access to this notification/,
  );

  // User B's notification remains unread
  const userBReq = { user: { userId: 'user-b', id: 'user-b' } };
  const notifB = await controller.findOne(userBReq, 'notif-b-1');
  assert.strictEqual(notifB.readAt, null);
});

/* =========================================================
   SCENARIO 7: MARK-ALL-AS-READ AFFECTS ONLY AUTHENTICATED USER
   ========================================================= */
test('7. Mark-all-as-read affects only the authenticated user notifications', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };
  const userBReq = { user: { userId: 'user-b', id: 'user-b' } };

  // User A marks all as read via clean route
  await controller.markAllAsRead(userAReq);

  // User A unread count is 0
  const countA = await controller.getUnreadCount(userAReq);
  assert.strictEqual(countA.count, 0);

  // User B's unread notifications must remain intact (2 unread)
  const countB = await controller.getUnreadCount(userBReq);
  assert.strictEqual(countB.count, 2);

  // User A cannot use legacy user/:userId/read-all with User B's ID
  await assert.rejects(
    async () => controller.markAllAsReadByUser(userAReq, 'user-b'),
    /Cannot mark notifications for another user/,
  );
});

/* =========================================================
   SCENARIO 8: USER A CAN DELETE THEIR OWN NOTIFICATION
   ========================================================= */
test('8. User A can delete their own notification', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  const removed = await controller.remove(userAReq, 'notif-a-1');
  assert.strictEqual(removed.id, 'notif-a-1');

  // Verify it is gone
  await assert.rejects(
    async () => controller.findOne(userAReq, 'notif-a-1'),
    /Notification not found/,
  );
});

/* =========================================================
   SCENARIO 9: USER A CANNOT DELETE USER B'S NOTIFICATION
   ========================================================= */
test("9. User A cannot delete User B's notification (403 Forbidden)", async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  await assert.rejects(
    async () => controller.remove(userAReq, 'notif-b-1'),
    /You do not have access to this notification/,
  );

  // User B's notification remains intact
  const userBReq = { user: { userId: 'user-b', id: 'user-b' } };
  const notifB = await controller.findOne(userBReq, 'notif-b-1');
  assert.strictEqual(notifB.id, 'notif-b-1');
});

/* =========================================================
   SCENARIO 10: CLIENT-PROVIDED USERID CANNOT OVERRIDE JWT IDENTITY
   ========================================================= */
test('10. Client-provided userId cannot override JWT identity', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // Explicit override attempt in query string is rejected
  await assert.rejects(
    async () => controller.findAll(userAReq, undefined, 'user-b'),
    /Cannot access notifications of another user/,
  );

  // Calling findAll with matching or omitted userId returns only user-a's records
  const resultMatching = await controller.findAll(userAReq, undefined, 'user-a');
  assert.strictEqual(resultMatching.every((n: any) => n.userId === 'user-a'), true);

  const resultOmitted = await controller.findAll(userAReq);
  assert.strictEqual(resultOmitted.every((n: any) => n.userId === 'user-a'), true);
});

/* =========================================================
   SCENARIO 11: RECIPIENT AUTHORIZATION ENFORCEMENT
   ========================================================= */
test('11. Client-provided recipientId cannot bypass recipient authorization', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // Attempt to notify a non-existent user
  await assert.rejects(
    async () =>
      controller.create(userAReq, {
        userId: 'non-existent-user-uuid',
        title: 'Spam',
        message: 'Hello',
        type: 'SYSTEM' as any,
      }),
    /Recipient user not found/,
  );

  // Attempt to notify an inactive/suspended user
  await assert.rejects(
    async () =>
      controller.create(userAReq, {
        userId: 'user-inactive',
        title: 'Notice',
        message: 'Account alert',
        type: 'SYSTEM' as any,
      }),
    /Recipient user account is inactive or suspended/,
  );
});

/* =========================================================
   SCENARIO 12: MANIPULATED NOTIFICATION IDS ARE REJECTED
   ========================================================= */
test('12. Manipulated notification IDs are rejected with 404', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  await assert.rejects(
    async () => controller.findOne(userAReq, 'manipulated-id-999'),
    /Notification not found/,
  );

  await assert.rejects(
    async () => controller.markAsRead(userAReq, 'manipulated-id-999'),
    /Notification not found/,
  );

  await assert.rejects(
    async () => controller.remove(userAReq, 'manipulated-id-999'),
    /Notification not found/,
  );
});

/* =========================================================
   SCENARIO 13: CROSS-ORGANIZATION NOTIFICATION ACCESS REJECTED
   ========================================================= */
test('13. Cross-organization notification access is rejected where applicable', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // User A (org-1) tries to send a direct notification to user-cross-org (org-2 only)
  await assert.rejects(
    async () =>
      controller.create(userAReq, {
        userId: 'user-cross-org',
        title: 'Cross Org Message',
        message: 'Intrusion attempt',
        type: 'MENTION' as any,
      }),
    /Cannot send notifications to a user outside your organizations or projects/,
  );
});

/* =========================================================
   SCENARIO 14: LEGITIMATE SYSTEM-GENERATED NOTIFICATIONS WORK
   ========================================================= */
test('14. Existing legitimate system-generated notifications continue to work', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);

  // Calling service.create directly (as backend services do) succeeds without actor session
  const systemNotif = await service.create({
    userId: 'user-a',
    projectId: 'proj-alpha-1',
    type: 'TASK_UPDATED' as any,
    title: 'Background Worker Alert',
    message: 'Worker finished nightly indexing',
  });

  assert.ok(systemNotif.id);
  assert.strictEqual(systemNotif.userId, 'user-a');
  assert.strictEqual(systemNotif.title, 'Background Worker Alert');
});

/* =========================================================
   SCENARIO 15: INVALID OR UNAUTHORIZED CREATION IS REJECTED
   ========================================================= */
test('15. Invalid or unauthorized notification creation is rejected (project boundary)', async () => {
  const mockDb = createMockPrismaForNotifications();
  const service = new NotificationsService(mockDb);
  const controller = new NotificationsController(service);

  const userAReq = { user: { userId: 'user-a', id: 'user-a' } };

  // User A tries to create a notification scoped to a foreign project (proj-foreign-2)
  await assert.rejects(
    async () =>
      controller.create(userAReq, {
        userId: 'user-b',
        projectId: 'proj-foreign-2',
        title: 'Tampered Project Notification',
        message: 'Unauthorized scope',
        type: 'TASK_ASSIGNED' as any,
      }),
    /You do not have access to this project/,
  );

  // User A tries to notify user-cross-org (who is not in proj-alpha-1) using proj-alpha-1
  await assert.rejects(
    async () =>
      controller.create(userAReq, {
        userId: 'user-cross-org',
        projectId: 'proj-alpha-1',
        title: 'Project Member Boundary Violation',
        message: 'User does not belong to project',
        type: 'TASK_ASSIGNED' as any,
      }),
    /Recipient does not belong to this project or organization/,
  );
});
