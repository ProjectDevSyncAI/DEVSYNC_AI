import assert from 'node:assert/strict';
import test from 'node:test';

import { ActivityService } from '../../src/activity/activity.service.js';
import { CommentsService } from '../../src/comments/comments.service.js';
import { DocumentsService } from '../../src/documents/documents.service.js';
import { GithubWebhookService } from '../../src/github/github-webhook.service.js';
import { IssuesService } from '../../src/issues/issues.service.js';
import { SprintsService } from '../../src/sprints/sprints.service.js';
import { TasksService } from '../../src/tasks/tasks.service.js';
async function getProcessDocumentJob(): Promise<any> {
  const modulePath = '../../../worker/src/processors/document.processor.js';
  const mod = await import(modulePath);
  return mod.processDocumentJob;
}

function createMockActivityService() {
  const events: any[] = [];
  return {
    events,
    async createEvent(params: any, txClient?: any) {
      events.push({ ...params, inTransaction: Boolean(txClient), txClient });
      return { id: `act-${events.length}`, ...params, createdAt: new Date() };
    },
  };
}

function createBaseMockPrisma() {
  return {
    $transaction: async (fn: any) => fn(createBaseMockPrisma()),
    project: {
      findUnique: async ({ where }: any) => ({
        id: where.id || 'proj-1',
        name: 'Project 1',
        organizationId: 'org-1',
        organization: { id: 'org-1', ownerId: 'user-actor-1' },
        members: [{ id: 'pm-1', userId: 'user-actor-1' }],
      }),
    },
    user: {
      findUnique: async () => ({ id: 'user-actor-1', status: 'ACTIVE', platformRole: 'USER' }),
      findFirst: async () => ({ id: 'user-actor-1', status: 'ACTIVE', platformRole: 'USER' }),
    },
    organizationMember: {
      findFirst: async () => ({ id: 'om-1', role: 'MEMBER', organizationId: 'org-1' }),
      findUnique: async () => ({ id: 'om-1', role: 'MEMBER', organizationId: 'org-1' }),
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Tasks Activity Writer Tests
// ---------------------------------------------------------------------------
test('TasksService emits TASK_CREATED on task creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      create: async ({ data }: any) => ({
        id: 'task-1',
        title: data.title,
        status: data.status,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  const result = await tasksService.create('user-actor-1', {
    title: 'Implement Activity Stream',
    description: 'Stream activity events',
    projectId: 'proj-1',
    status: 'TODO' as any,
  });

  assert.equal(result.id, 'task-1');
  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'TASK_CREATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.entityType, 'TASK');
  assert.equal(event.entityId, 'task-1');
  assert.equal(event.inTransaction, true);
});

test('TasksService emits TASK_STATUS_CHANGED on status update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      findUnique: async () => ({
        id: 'task-1',
        title: 'Implement Activity Stream',
        status: 'TODO',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async ({ data }: any) => ({
        id: 'task-1',
        title: 'Implement Activity Stream',
        status: data.status,
        projectId: 'proj-1',
        assigneeId: null,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  await tasksService.update('user-actor-1', 'task-1', { status: 'IN_PROGRESS' as any });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'TASK_STATUS_CHANGED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.metadata.oldStatus, 'TODO');
  assert.equal(event.metadata.newStatus, 'IN_PROGRESS');
});

test('TasksService emits TASK_ASSIGNED on assignee update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      findUnique: async () => ({
        id: 'task-1',
        title: 'Implement Activity Stream',
        status: 'TODO',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async ({ data }: any) => ({
        id: 'task-1',
        title: 'Implement Activity Stream',
        status: 'TODO',
        projectId: 'proj-1',
        assigneeId: data.assigneeId,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  await tasksService.update('user-actor-1', 'task-1', { assigneeId: 'user-actor-1' });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'TASK_ASSIGNED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.metadata.oldAssigneeId, null);
  assert.equal(event.metadata.newAssigneeId, 'user-actor-1');
});

test('TasksService emits TASK_UPDATED on non-status, non-assignment update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      findUnique: async () => ({
        id: 'task-1',
        title: 'Initial Title',
        description: 'Initial Description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async ({ data }: any) => ({
        id: 'task-1',
        title: data.title,
        description: data.description,
        status: 'TODO',
        priority: data.priority,
        projectId: 'proj-1',
        assigneeId: null,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  await tasksService.update('user-actor-1', 'task-1', {
    title: 'Updated Title',
    description: 'Updated Description',
    priority: 'HIGH' as any,
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'TASK_UPDATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.ok(event.metadata.updatedFields.includes('title'));
  assert.ok(event.metadata.updatedFields.includes('description'));
  assert.ok(event.metadata.updatedFields.includes('priority'));
});

test('TasksService does not emit redundant update events when no fields are modified', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      findUnique: async () => ({
        id: 'task-1',
        title: 'Initial Title',
        status: 'TODO',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async () => ({
        id: 'task-1',
        title: 'Initial Title',
        status: 'TODO',
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  await tasksService.update('user-actor-1', 'task-1', {});

  assert.equal(mockActivity.events.length, 0);
});

test('TasksService emits TASK_DELETED on task removal', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    task: {
      findUnique: async () => ({
        id: 'task-1',
        title: 'To Be Deleted',
        status: 'TODO',
        projectId: 'proj-1',
      }),
      delete: async () => ({ id: 'task-1' }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);
  await tasksService.remove('user-actor-1', 'task-1');

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'TASK_DELETED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.entityId, 'task-1');
});

// ---------------------------------------------------------------------------
// 2. Issues Activity Writer Tests
// ---------------------------------------------------------------------------
test('IssuesService emits ISSUE_CREATED on issue creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    issue: {
      create: async ({ data }: any) => ({
        id: 'issue-1',
        title: data.title,
        status: data.status,
        projectId: data.projectId,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const issuesService = new IssuesService(mockPrisma, mockActivity as unknown as ActivityService);
  const result = await issuesService.create('user-actor-1', {
    title: 'Database connection leak',
    projectId: 'proj-1',
    status: 'OPEN' as any,
  });

  assert.equal(result.id, 'issue-1');
  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'ISSUE_CREATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.entityType, 'ISSUE');
});

test('IssuesService emits ISSUE_STATUS_CHANGED on status update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    issue: {
      findUnique: async () => ({
        id: 'issue-1',
        title: 'Database connection leak',
        status: 'OPEN',
        projectId: 'proj-1',
      }),
      update: async ({ data }: any) => ({
        id: 'issue-1',
        title: 'Database connection leak',
        status: data.status,
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const issuesService = new IssuesService(mockPrisma, mockActivity as unknown as ActivityService);
  await issuesService.update('user-actor-1', 'issue-1', { status: 'RESOLVED' as any });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'ISSUE_STATUS_CHANGED');
  assert.equal(event.metadata.oldStatus, 'OPEN');
  assert.equal(event.metadata.newStatus, 'RESOLVED');
});

test('IssuesService emits ISSUE_ASSIGNED on assignee update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    issue: {
      findUnique: async () => ({
        id: 'issue-1',
        title: 'Database connection leak',
        status: 'OPEN',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async ({ data }: any) => ({
        id: 'issue-1',
        title: 'Database connection leak',
        status: 'OPEN',
        projectId: 'proj-1',
        assigneeId: data.assigneeId,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const issuesService = new IssuesService(mockPrisma, mockActivity as unknown as ActivityService);
  await issuesService.update('user-actor-1', 'issue-1', { assigneeId: 'user-actor-1' });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'ISSUE_ASSIGNED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.metadata.oldAssigneeId, null);
  assert.equal(event.metadata.newAssigneeId, 'user-actor-1');
});

test('IssuesService emits ISSUE_UPDATED on non-status, non-assignment update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    issue: {
      findUnique: async () => ({
        id: 'issue-1',
        title: 'Database connection leak',
        description: 'Old Description',
        status: 'OPEN',
        priority: 'MEDIUM',
        projectId: 'proj-1',
        assigneeId: null,
      }),
      update: async ({ data }: any) => ({
        id: 'issue-1',
        title: data.title,
        description: data.description,
        status: 'OPEN',
        priority: data.priority,
        projectId: 'proj-1',
        assigneeId: null,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const issuesService = new IssuesService(mockPrisma, mockActivity as unknown as ActivityService);
  await issuesService.update('user-actor-1', 'issue-1', {
    title: 'Severe memory leak in connection pool',
    description: 'Updated with stack trace',
    priority: 'HIGH' as any,
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'ISSUE_UPDATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.ok(event.metadata.updatedFields.includes('title'));
  assert.ok(event.metadata.updatedFields.includes('description'));
  assert.ok(event.metadata.updatedFields.includes('priority'));
});

test('IssuesService emits ISSUE_DELETED on issue removal', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    issue: {
      findUnique: async () => ({
        id: 'issue-1',
        title: 'Dead Issue',
        projectId: 'proj-1',
      }),
      delete: async () => ({ id: 'issue-1' }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const issuesService = new IssuesService(mockPrisma, mockActivity as unknown as ActivityService);
  await issuesService.remove('user-actor-1', 'issue-1');

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'ISSUE_DELETED');
  assert.equal(event.projectId, 'proj-1');
});

// ---------------------------------------------------------------------------
// 3. Sprints Activity Writer Tests
// ---------------------------------------------------------------------------
test('SprintsService emits SPRINT_CREATED on sprint creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      create: async ({ data }: any) => ({
        id: 'sprint-1',
        name: data.name,
        status: data.status,
        projectId: data.projectId,
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  const result = await sprintsService.create('user-actor-1', {
    name: 'Sprint 42',
    projectId: 'proj-1',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
  });

  assert.equal(result.id, 'sprint-1');
  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_CREATED');
  assert.equal(event.projectId, 'proj-1');
});

test('SprintsService emits SPRINT_STARTED when status changes to ACTIVE', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      findUnique: async () => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: 'PLANNED',
        projectId: 'proj-1',
      }),
      update: async ({ data }: any) => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: data.status,
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  await sprintsService.update('user-actor-1', 'sprint-1', { status: 'ACTIVE' as any });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_STARTED');
  assert.equal(event.metadata.oldStatus, 'PLANNED');
  assert.equal(event.metadata.newStatus, 'ACTIVE');
});

test('SprintsService emits SPRINT_COMPLETED when status changes to COMPLETED', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      findUnique: async () => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: 'ACTIVE',
        projectId: 'proj-1',
      }),
      update: async ({ data }: any) => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: data.status,
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  await sprintsService.update('user-actor-1', 'sprint-1', { status: 'COMPLETED' as any });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_COMPLETED');
  assert.equal(event.metadata.oldStatus, 'ACTIVE');
  assert.equal(event.metadata.newStatus, 'COMPLETED');
});

test('SprintsService emits SPRINT_STATUS_CHANGED on other status transitions (CANCELLED)', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      findUnique: async () => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: 'ACTIVE',
        projectId: 'proj-1',
      }),
      update: async ({ data }: any) => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        status: data.status,
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  await sprintsService.update('user-actor-1', 'sprint-1', { status: 'CANCELLED' as any });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_STATUS_CHANGED');
  assert.equal(event.metadata.oldStatus, 'ACTIVE');
  assert.equal(event.metadata.newStatus, 'CANCELLED');
});

test('SprintsService emits SPRINT_UPDATED on non-status update', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      findUnique: async () => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        goal: 'Initial Goal',
        status: 'PLANNED',
        capacity: 20,
        projectId: 'proj-1',
      }),
      update: async ({ data }: any) => ({
        id: 'sprint-1',
        name: data.name,
        goal: data.goal,
        status: 'PLANNED',
        capacity: data.capacity,
        projectId: 'proj-1',
      }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  await sprintsService.update('user-actor-1', 'sprint-1', {
    name: 'Sprint 42 - Scope Expansion',
    goal: 'Deliver all activity event writers',
    capacity: 35,
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_UPDATED');
  assert.equal(event.projectId, 'proj-1');
  assert.ok(event.metadata.updatedFields.includes('name'));
  assert.ok(event.metadata.updatedFields.includes('goal'));
  assert.ok(event.metadata.updatedFields.includes('capacity'));
});

test('SprintsService emits SPRINT_DELETED on sprint removal', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    sprint: {
      findUnique: async () => ({
        id: 'sprint-1',
        name: 'Sprint 42',
        projectId: 'proj-1',
      }),
      delete: async () => ({ id: 'sprint-1' }),
    },
  };
  mockPrisma.$transaction = async (fn: any) => fn(mockPrisma);

  const sprintsService = new SprintsService(mockPrisma, mockActivity as unknown as ActivityService);
  await sprintsService.remove('user-actor-1', 'sprint-1');

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'SPRINT_DELETED');
  assert.equal(event.projectId, 'proj-1');
});

// ---------------------------------------------------------------------------
// 4. Comments Activity Writer Tests
// ---------------------------------------------------------------------------
test('CommentsService emits COMMENT_CREATED on comment creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    comment: {
      create: async ({ data }: any) => ({
        id: 'comm-1',
        projectId: data.projectId,
        authorId: data.authorId,
        content: data.content,
        taskId: data.taskId,
      }),
    },
  };

  const commentsService = new CommentsService(mockPrisma, mockActivity as unknown as ActivityService);
  const result = await commentsService.create({
    projectId: 'proj-1',
    authorId: 'user-actor-1',
    content: 'Looks good to me!',
    taskId: 'task-1',
  });

  assert.equal(result.id, 'comm-1');
  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'COMMENT_CREATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.entityType, 'COMMENT');
  assert.equal(event.metadata.taskId, 'task-1');
});

test('CommentsService emits COMMENT_UPDATED and COMMENT_DELETED', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    comment: {
      findUnique: async () => ({
        id: 'comm-1',
        projectId: 'proj-1',
        authorId: 'user-actor-1',
        content: 'Original',
        taskId: 'task-1',
      }),
      update: async ({ data }: any) => ({
        id: 'comm-1',
        projectId: 'proj-1',
        authorId: 'user-actor-1',
        content: data.content,
      }),
      delete: async () => ({ id: 'comm-1' }),
    },
  };

  const commentsService = new CommentsService(mockPrisma, mockActivity as unknown as ActivityService);
  await commentsService.update('comm-1', { content: 'Edited' }, 'user-actor-1');
  await commentsService.remove('comm-1', 'user-actor-1');

  assert.equal(mockActivity.events.length, 2);
  assert.equal(mockActivity.events[0].type, 'COMMENT_UPDATED');
  assert.equal(mockActivity.events[1].type, 'COMMENT_DELETED');
});

// ---------------------------------------------------------------------------
// 5. Documents Activity Writer Tests
// ---------------------------------------------------------------------------
test('DocumentsService emits DOCUMENT_CREATED on uploaded document creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    document: {
      create: async ({ data }: any) => ({
        id: 'doc-1',
        projectId: data.projectId,
        title: data.title,
        metadata: data.metadata,
      }),
    },
  };

  const documentsService = new DocumentsService(
    mockPrisma,
    undefined,
    mockActivity as unknown as ActivityService,
  );

  const result = await documentsService.createUploadedDocument({
    projectId: 'proj-1',
    title: 'Architecture Blueprint',
    userId: 'user-actor-1',
    storageKey: 'key-123',
    storagePath: 'safe/path',
    originalFilename: 'arch.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    checksum: 'abc123sha',
  });

  assert.equal(result.id, 'doc-1');
  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'DOCUMENT_CREATED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.userId, 'user-actor-1');
  assert.equal(event.entityType, 'DOCUMENT');
  assert.equal(event.metadata.fileSize, 1024);
});

test('DocumentsService emits DOCUMENT_DELETED on document removal', async () => {
  const mockActivity = createMockActivityService();
  const mockStorage: any = {
    deleteFile: async () => {},
  };
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    document: {
      findUnique: async () => ({
        id: 'doc-1',
        projectId: 'proj-1',
        title: 'Architecture Blueprint',
        metadata: { storageKey: 'key-123', uploadedBy: 'user-actor-1' },
      }),
      delete: async () => ({ id: 'doc-1' }),
    },
  };

  const documentsService = new DocumentsService(
    mockPrisma,
    mockStorage,
    mockActivity as unknown as ActivityService,
  );

  await documentsService.remove('doc-1', 'user-actor-1');

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'DOCUMENT_DELETED');
  assert.equal(event.projectId, 'proj-1');
});

// ---------------------------------------------------------------------------
// 6. Document Worker Indexing & Retry Deduplication Tests
// ---------------------------------------------------------------------------
test('DocumentWorker emits DOCUMENT_INDEXED on successful indexing within transaction', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'mock-openai-key';
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        data: [{ embedding: new Array(1536).fill(0.01), index: 0 }],
      }),
    } as any);

  try {
    const createdActivities: any[] = [];
    const mockPrisma: any = {
      document: {
        findUnique: async () => ({
          id: 'doc-idx-1',
          projectId: 'proj-1',
          title: 'Architecture Spec',
          content: 'This is a clean document with enough text content for indexing.',
          sourceType: 'DOCUMENTATION',
          metadata: { uploadedBy: 'user-actor-1' },
        }),
        update: async () => ({}),
      },
      documentChunk: {
        deleteMany: async () => ({}),
      },
      $executeRawUnsafe: async () => ({}),
      activity: {
        findFirst: async () => null,
        create: async ({ data }: any) => {
          createdActivities.push(data);
          return { id: 'act-idx-1', ...data, createdAt: new Date() };
        },
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const job = {
      id: 'job-idx-100',
      data: { documentId: 'doc-idx-1', projectId: 'proj-1' },
      attemptsMade: 0,
      opts: { attempts: 3 },
    };

    const processDocumentJob = await getProcessDocumentJob();
    const result = await processDocumentJob(job, mockPrisma);
    assert.equal(result.success, true);
    assert.equal(createdActivities.length, 1);
    assert.equal(createdActivities[0].type, 'DOCUMENT_INDEXED');
    assert.equal(createdActivities[0].projectId, 'proj-1');
    assert.equal(createdActivities[0].userId, 'user-actor-1');
    assert.equal(createdActivities[0].metadata.jobId, 'job-idx-100');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.OPENAI_API_KEY = originalApiKey;
  }
});

test('DocumentWorker emits DOCUMENT_INDEXING_FAILED on failure and preserves error message', async () => {
  const createdActivities: any[] = [];
  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-idx-fail',
        projectId: 'proj-1',
        title: 'Failing Doc',
        content: '', // Empty content causes error
        sourceType: 'DOCUMENTATION',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async () => null,
      create: async ({ data }: any) => {
        createdActivities.push(data);
        return { id: 'act-fail-1', ...data, createdAt: new Date() };
      },
    },
  };

  const job = {
    id: 'job-fail-200',
    data: { documentId: 'doc-idx-fail', projectId: 'proj-1' },
    attemptsMade: 0,
    opts: { attempts: 3 },
  };

  const processDocumentJob = await getProcessDocumentJob();
  await assert.rejects(
    async () => {
      await processDocumentJob(job, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );

  assert.equal(createdActivities.length, 1);
  assert.equal(createdActivities[0].type, 'DOCUMENT_INDEXING_FAILED');
  assert.equal(createdActivities[0].projectId, 'proj-1');
  assert.equal(createdActivities[0].userId, 'user-actor-1');
  assert.equal(createdActivities[0].metadata.error, 'Extracted content is empty');
});

test('DocumentWorker retry deduplication: repeated failed attempts of same job update existing event without creating duplicate rows', async () => {
  const activityRows: any[] = [];
  let updateCalled = false;

  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-retry-test',
        projectId: 'proj-1',
        title: 'Retry Test Document',
        content: '', // Fails with empty content
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async ({ where }: any) => {
        return activityRows.find((a) => {
          if (where.entityId && a.entityId !== where.entityId) return false;
          if (where.type && a.type !== where.type) return false;
          if (where.projectId && a.projectId !== where.projectId) return false;
          if (where.metadata?.path && where.metadata?.equals !== undefined) {
            const [key] = where.metadata.path;
            return a.metadata?.[key] === where.metadata.equals;
          }
          return true;
        }) || null;
      },
      create: async ({ data }: any) => {
        const row = { id: `act-${activityRows.length + 1}`, ...data };
        activityRows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        updateCalled = true;
        const row = activityRows.find((a) => a.id === where.id);
        if (row) {
          Object.assign(row, data);
        }
        return row;
      },
    },
  };

  const job = {
    id: 'job-stable-id-1',
    data: { documentId: 'doc-retry-test', projectId: 'proj-1' },
    attemptsMade: 0,
    opts: { attempts: 3 },
  };

  const processDocumentJob = await getProcessDocumentJob();

  // Attempt 1: Initial failure
  await assert.rejects(async () => {
    await processDocumentJob(job, mockPrisma);
  });
  assert.equal(activityRows.length, 1);
  assert.equal(activityRows[0].metadata.attempts, 1);

  // Attempt 2: BullMQ retries same job
  job.attemptsMade = 1;
  await assert.rejects(async () => {
    await processDocumentJob(job, mockPrisma);
  });
  // Deduplication check: NO new row created, existing row was updated
  assert.equal(activityRows.length, 1);
  assert.equal(updateCalled, true);
  assert.equal(activityRows[0].metadata.attempts, 2);

  // Attempt 3: Final attempt
  job.attemptsMade = 2;
  await assert.rejects(async () => {
    await processDocumentJob(job, mockPrisma);
  });
  // Still strictly 1 row with updated attempt count
  assert.equal(activityRows.length, 1);
  assert.equal(activityRows[0].metadata.attempts, 3);
  assert.ok(activityRows[0].metadata.lastFailedAt);
});

test('DocumentWorker deduplication: different job IDs for the same document produce separate events', async () => {
  const activityRows: any[] = [];
  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-multi-job',
        projectId: 'proj-1',
        title: 'Multi Job Doc',
        content: '',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async ({ where }: any) => {
        return activityRows.find((a) => {
          if (where.entityId && a.entityId !== where.entityId) return false;
          if (where.type && a.type !== where.type) return false;
          if (where.projectId && a.projectId !== where.projectId) return false;
          if (where.metadata?.path && where.metadata?.equals !== undefined) {
            const [key] = where.metadata.path;
            return a.metadata?.[key] === where.metadata.equals;
          }
          return true;
        }) || null;
      },
      create: async ({ data }: any) => {
        const row = { id: `act-${activityRows.length + 1}`, ...data };
        activityRows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = activityRows.find((a) => a.id === where.id);
        if (row) Object.assign(row, data);
        return row;
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();

  // Job A fails
  const jobA = {
    id: 'job-alpha',
    data: { documentId: 'doc-multi-job', projectId: 'proj-1' },
    attemptsMade: 0,
  };
  await assert.rejects(async () => {
    await processDocumentJob(jobA, mockPrisma);
  });
  assert.equal(activityRows.length, 1);
  assert.equal(activityRows[0].metadata.jobId, 'job-alpha');

  // Job B fails for the same document
  const jobB = {
    id: 'job-beta',
    data: { documentId: 'doc-multi-job', projectId: 'proj-1' },
    attemptsMade: 0,
  };
  await assert.rejects(async () => {
    await processDocumentJob(jobB, mockPrisma);
  });
  // Both events exist distinctly
  assert.equal(activityRows.length, 2);
  const ids = activityRows.map((r) => r.metadata.jobId);
  assert.ok(ids.includes('job-alpha'));
  assert.ok(ids.includes('job-beta'));
});

test('DocumentWorker deduplication: an older matching event is found even when more than 50 newer events belong to other jobs', async () => {
  const activityRows: any[] = [];

  // Add the original failure for job-target (oldest event)
  activityRows.push({
    id: 'act-target-old',
    projectId: 'proj-1',
    entityType: 'DOCUMENT',
    entityId: 'doc-many-jobs',
    type: 'DOCUMENT_INDEXING_FAILED',
    createdAt: new Date(Date.now() - 100000),
    metadata: { documentId: 'doc-many-jobs', jobId: 'job-target', attempts: 1 },
  });

  // Add 60 newer failure events belonging to other jobs
  for (let i = 1; i <= 60; i++) {
    activityRows.push({
      id: `act-noise-${i}`,
      projectId: 'proj-1',
      entityType: 'DOCUMENT',
      entityId: 'doc-many-jobs',
      type: 'DOCUMENT_INDEXING_FAILED',
      createdAt: new Date(Date.now() - (100000 - i * 1000)),
      metadata: { documentId: 'doc-many-jobs', jobId: `job-noise-${i}`, attempts: 1 },
    });
  }

  assert.equal(activityRows.length, 61);

  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-many-jobs',
        projectId: 'proj-1',
        title: 'Many Jobs Doc',
        content: '',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async ({ where }: any) => {
        return activityRows.find((a) => {
          if (where.entityId && a.entityId !== where.entityId) return false;
          if (where.type && a.type !== where.type) return false;
          if (where.projectId && a.projectId !== where.projectId) return false;
          if (where.metadata?.path && where.metadata?.equals !== undefined) {
            const [key] = where.metadata.path;
            return a.metadata?.[key] === where.metadata.equals;
          }
          return true;
        }) || null;
      },
      create: async ({ data }: any) => {
        const row = { id: `act-${activityRows.length + 1}`, ...data };
        activityRows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = activityRows.find((a) => a.id === where.id);
        if (row) Object.assign(row, data);
        return row;
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();

  // Retry job-target (attempt 2). Even with 60 newer events, exact JSON lookup locates the record.
  const retryTargetJob = {
    id: 'job-target',
    data: { documentId: 'doc-many-jobs', projectId: 'proj-1' },
    attemptsMade: 1,
  };

  await assert.rejects(async () => {
    await processDocumentJob(retryTargetJob, mockPrisma);
  });

  // Exactly 61 records remain: NO new record created beyond the 60 newer events
  assert.equal(activityRows.length, 61);
  const targetRow = activityRows.find((r) => r.metadata.jobId === 'job-target');
  assert.equal(targetRow.metadata.attempts, 2);
});

test('DocumentWorker deduplication: interleaved retries do not update another job event', async () => {
  const activityRows: any[] = [
    {
      id: 'act-prior-1',
      projectId: 'proj-1',
      entityType: 'DOCUMENT',
      entityId: 'doc-interfering',
      type: 'DOCUMENT_INDEXING_FAILED',
      createdAt: new Date(Date.now() - 5000),
      metadata: { documentId: 'doc-interfering', jobId: 'job-alpha', attempts: 1 },
    },
    {
      id: 'act-prior-2',
      projectId: 'proj-1',
      entityType: 'DOCUMENT',
      entityId: 'doc-interfering',
      type: 'DOCUMENT_INDEXING_FAILED',
      createdAt: new Date(), // Newer event from another job
      metadata: { documentId: 'doc-interfering', jobId: 'job-beta', attempts: 1 },
    },
  ];

  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-interfering',
        projectId: 'proj-1',
        title: 'Interfering Doc',
        content: '',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async ({ where }: any) => {
        return activityRows.find((a) => {
          if (where.entityId && a.entityId !== where.entityId) return false;
          if (where.type && a.type !== where.type) return false;
          if (where.projectId && a.projectId !== where.projectId) return false;
          if (where.metadata?.path && where.metadata?.equals !== undefined) {
            const [key] = where.metadata.path;
            return a.metadata?.[key] === where.metadata.equals;
          }
          return true;
        }) || null;
      },
      create: async ({ data }: any) => {
        const row = { id: `act-${activityRows.length + 1}`, ...data };
        activityRows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = activityRows.find((a) => a.id === where.id);
        if (row) Object.assign(row, data);
        return row;
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();

  // Retry job-alpha (attempt 2)
  const retryJobA = {
    id: 'job-alpha',
    data: { documentId: 'doc-interfering', projectId: 'proj-1' },
    attemptsMade: 1,
  };

  await assert.rejects(async () => {
    await processDocumentJob(retryJobA, mockPrisma);
  });

  // Exactly 2 events remain (no duplicate created for job-alpha, and job-beta remains untouched)
  assert.equal(activityRows.length, 2);
  const rowA = activityRows.find((r) => r.metadata.jobId === 'job-alpha');
  const rowB = activityRows.find((r) => r.metadata.jobId === 'job-beta');
  assert.equal(rowA.metadata.attempts, 2);
  assert.equal(rowB.metadata.attempts, 1);
});

test('DocumentWorker error shielding: activity lookup failure does not mask original processing error', async () => {
  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-lookup-fail',
        projectId: 'proj-1',
        title: 'Lookup Fail Doc',
        content: '', // Causes 'Extracted content is empty'
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async () => {
        throw new Error('Database read query timeout / connection severed');
      },
      create: async () => {},
      update: async () => {},
    },
  };

  const processDocumentJob = await getProcessDocumentJob();
  const job = {
    id: 'job-lookup-1',
    data: { documentId: 'doc-lookup-fail', projectId: 'proj-1' },
    attemptsMade: 0,
  };

  // Must cleanly throw the original extraction error, NOT the activity error
  await assert.rejects(
    async () => {
      await processDocumentJob(job, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );
});

test('DocumentWorker error shielding: activity persistence failure does not mask original processing error', async () => {
  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-shield-test',
        projectId: 'proj-1',
        title: 'Shield Test Doc',
        content: '', // Causes 'Extracted content is empty'
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async () => null,
      create: async () => {
        throw new Error('Database write failure: disk full');
      },
      update: async () => {
        throw new Error('Database update failure: constraint violation');
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();
  const job = {
    id: 'job-shield-1',
    data: { documentId: 'doc-shield-test', projectId: 'proj-1' },
    attemptsMade: 0,
  };

  // Must cleanly throw the original extraction error, NOT the activity error
  await assert.rejects(
    async () => {
      await processDocumentJob(job, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );
});

test('DocumentWorker handles missing or malformed job IDs safely', async () => {
  const createdActivities: any[] = [];
  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-malformed-job',
        projectId: 'proj-1',
        title: 'Malformed Job Doc',
        content: '',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async () => null,
      create: async ({ data }: any) => {
        createdActivities.push(data);
        return { id: 'act-mal-1', ...data, createdAt: new Date() };
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();

  // Test with undefined job.id
  await assert.rejects(
    async () => {
      await processDocumentJob({ data: { documentId: 'doc-malformed-job', projectId: 'proj-1' } }, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );
  assert.equal(createdActivities.length, 1);
  assert.equal(createdActivities[0].metadata.jobId, undefined);

  // Test with empty string job.id
  await assert.rejects(
    async () => {
      await processDocumentJob({ id: '   ', data: { documentId: 'doc-malformed-job', projectId: 'proj-1' } }, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );
  assert.equal(createdActivities.length, 2);
  assert.equal(createdActivities[1].metadata.jobId, undefined);
});

test('DocumentWorker preserves existing event metadata on retry update', async () => {
  const existingEvent = {
    id: 'act-meta-1',
    projectId: 'proj-1',
    entityType: 'DOCUMENT',
    entityId: 'doc-meta-preserve',
    type: 'DOCUMENT_INDEXING_FAILED',
    createdAt: new Date(),
    metadata: {
      documentId: 'doc-meta-preserve',
      jobId: 'job-meta-preserve-1',
      attempts: 1,
      customTag: 'audit-preserve-test',
      storageBucket: 's3-us-east-1',
    },
  };

  const mockPrisma: any = {
    document: {
      findUnique: async () => ({
        id: 'doc-meta-preserve',
        projectId: 'proj-1',
        title: 'Meta Preserve Doc',
        content: '',
        metadata: { uploadedBy: 'user-actor-1' },
      }),
      update: async () => ({}),
    },
    activity: {
      findFirst: async () => existingEvent,
      update: async ({ data }: any) => {
        Object.assign(existingEvent, data);
        return existingEvent;
      },
    },
  };

  const processDocumentJob = await getProcessDocumentJob();
  const retryJob = {
    id: 'job-meta-preserve-1',
    data: { documentId: 'doc-meta-preserve', projectId: 'proj-1' },
    attemptsMade: 1,
  };

  await assert.rejects(
    async () => {
      await processDocumentJob(retryJob, mockPrisma);
    },
    { message: 'Extracted content is empty' },
  );

  // Custom metadata fields are preserved
  assert.equal(existingEvent.metadata.customTag, 'audit-preserve-test');
  assert.equal(existingEvent.metadata.storageBucket, 's3-us-east-1');
  // Attempt count is updated
  assert.equal(existingEvent.metadata.attempts, 2);
  assert.ok((existingEvent.metadata as any).lastFailedAt);
});

// ---------------------------------------------------------------------------
// 7. GitHub Webhook Activity Writer Tests
// ---------------------------------------------------------------------------
test('GithubWebhookService emits GITHUB_COMMITS_SYNCED on PUSH webhook', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    gitHubWebhookEvent: {
      create: async ({ data }: any) => ({ id: 'we-1', ...data }),
      update: async () => {},
    },
    repository: {
      findUnique: async () => ({
        id: 'gh-repo-1',
        fullName: 'org/repo',
        projectId: 'proj-1',
      }),
    },
    commit: {
      upsert: async () => ({}),
    },
  };

  const webhookService = new GithubWebhookService(
    mockPrisma,
    mockActivity as unknown as ActivityService,
  );

  await webhookService.create({
    deliveryId: 'del-1',
    eventType: 'PUSH',
    action: 'push',
    repositoryId: 'gh-repo-1',
    payload: {
      ref: 'refs/heads/main',
      commits: [
        { id: 'sha1', message: 'feat: add activity logging', added: [], removed: [], modified: [] },
      ],
    },
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'GITHUB_COMMITS_SYNCED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.metadata.commitCount, 1);
  assert.equal(event.inTransaction, true);
});

test('GithubWebhookService emits GITHUB_PR_SYNCED on PULL_REQUEST webhook', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    $transaction: async (fn: any) => fn(mockPrisma),
    gitHubWebhookEvent: {
      create: async ({ data }: any) => ({ id: 'we-2', ...data }),
      update: async () => {},
    },
    repository: {
      findUnique: async () => ({
        id: 'gh-repo-1',
        fullName: 'org/repo',
        projectId: 'proj-1',
      }),
    },
    pullRequest: {
      upsert: async () => ({}),
    },
  };

  const webhookService = new GithubWebhookService(
    mockPrisma,
    mockActivity as unknown as ActivityService,
  );

  await webhookService.create({
    deliveryId: 'del-2',
    eventType: 'PULL_REQUEST',
    action: 'opened',
    repositoryId: 'gh-repo-1',
    payload: {
      pull_request: {
        id: 999,
        number: 42,
        title: 'Feature PR',
        state: 'open',
        merged: false,
      },
    },
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'GITHUB_PR_SYNCED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.metadata.prNumber, 42);
  assert.equal(event.inTransaction, true);
});

test('GithubWebhookService emits GITHUB_ISSUE_SYNCED on ISSUES webhook', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    $transaction: async (fn: any) => fn(mockPrisma),
    gitHubWebhookEvent: {
      create: async ({ data }: any) => ({ id: 'we-3', ...data }),
      update: async () => {},
    },
    repository: {
      findUnique: async () => ({
        id: 'gh-repo-1',
        fullName: 'org/repo',
        projectId: 'proj-1',
      }),
    },
    issue: {
      findFirst: async () => null,
      create: async ({ data }: any) => ({ id: 'iss-new-1', ...data }),
    },
  };

  const webhookService = new GithubWebhookService(
    mockPrisma,
    mockActivity as unknown as ActivityService,
  );

  await webhookService.create({
    deliveryId: 'del-3',
    eventType: 'ISSUES',
    action: 'opened',
    repositoryId: 'gh-repo-1',
    payload: {
      issue: {
        id: 12345,
        number: 77,
        title: 'Webhook reported bug',
        body: 'Bug description',
        state: 'open',
      },
    },
  });

  assert.equal(mockActivity.events.length, 1);
  const event = mockActivity.events[0];
  assert.equal(event.type, 'GITHUB_ISSUE_SYNCED');
  assert.equal(event.projectId, 'proj-1');
  assert.equal(event.metadata.issueNumber, 77);
  assert.equal(event.inTransaction, true);
});

test('GithubWebhookService passes same transaction client tx to mutations and activity write', async () => {
  const txClientsUsed: any[] = [];
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    gitHubWebhookEvent: {
      create: async ({ data }: any) => ({ id: 'we-tx', ...data }),
      update: async () => {},
    },
    repository: {
      findUnique: async () => ({
        id: 'gh-repo-1',
        fullName: 'org/repo',
        projectId: 'proj-1',
      }),
    },
    $transaction: async (fn: any) => {
      const txInstance = { id: 'unique-tx-client-instance' };
      (txInstance as any).pullRequest = {
        upsert: async () => {
          txClientsUsed.push(txInstance);
        },
      };
      return fn(txInstance);
    },
  };

  const mockActivity: any = {
    events: [],
    async createEvent(params: any, txClient?: any) {
      txClientsUsed.push(txClient);
    },
  };

  const webhookService = new GithubWebhookService(mockPrisma, mockActivity);

  await webhookService.create({
    deliveryId: 'del-tx',
    eventType: 'PULL_REQUEST',
    action: 'opened',
    repositoryId: 'gh-repo-1',
    payload: {
      pull_request: {
        id: 111,
        number: 10,
        title: 'Transactional PR',
        state: 'open',
      },
    },
  });

  assert.equal(txClientsUsed.length, 2);
  assert.equal(txClientsUsed[0], txClientsUsed[1]);
  assert.equal(txClientsUsed[0].id, 'unique-tx-client-instance');
});

test('GithubWebhookService rolls back commit upserts if activity creation fails', async () => {
  let commitUpserted = false;
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    gitHubWebhookEvent: {
      create: async ({ data }: any) => ({ id: 'we-fail', ...data }),
      update: async () => {},
    },
    repository: {
      findUnique: async () => ({
        id: 'gh-repo-1',
        fullName: 'org/repo',
        projectId: 'proj-1',
      }),
    },
    $transaction: async (fn: any) => {
      const tx = {
        commit: {
          upsert: async () => {
            commitUpserted = true;
          },
        },
      };
      try {
        await fn(tx);
      } catch (err) {
        commitUpserted = false; // Transaction rollback simulated
        throw err;
      }
    },
  };

  const failingActivityService: any = {
    async createEvent() {
      throw new Error('Activity DB constraint violation');
    },
  };

  const webhookService = new GithubWebhookService(mockPrisma, failingActivityService);

  await webhookService.create({
    deliveryId: 'del-fail',
    eventType: 'PUSH',
    action: 'push',
    repositoryId: 'gh-repo-1',
    payload: {
      ref: 'refs/heads/main',
      commits: [{ id: 'sha-rollback', message: 'test', added: [], removed: [], modified: [] }],
    },
  });

  assert.equal(commitUpserted, false);
});

// ---------------------------------------------------------------------------
// 8. Security Controls & Boundaries
// ---------------------------------------------------------------------------
test('Transactional rollback integrity: database failure aborts activity creation', async () => {
  const mockActivity = createMockActivityService();
  const mockPrisma: any = {
    ...createBaseMockPrisma(),
    $transaction: async (fn: any) => {
      return fn({
        ...createBaseMockPrisma(),
        task: {
          create: async () => {
            throw new Error('Database constraint violation');
          },
        },
      });
    },
  };

  const tasksService = new TasksService(mockPrisma, mockActivity as unknown as ActivityService);

  await assert.rejects(
    async () => {
      await tasksService.create('user-actor-1', {
        title: 'Will Fail',
        projectId: 'proj-1',
      });
    },
    { message: 'Database constraint violation' },
  );

  assert.equal(mockActivity.events.length, 0);
});

test('ActivityService rejects metadata containing sensitive credentials or deep nesting', async () => {
  const mockPrisma: any = {
    activity: {
      create: async () => {},
    },
  };

  const activityService = new ActivityService(mockPrisma);

  // Sensitive key: password
  await assert.rejects(
    async () => {
      await activityService.createEvent({
        projectId: 'proj-1',
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Task with secret',
        entityType: 'TASK',
        entityId: 't-1',
        metadata: { password: 'plaintextpassword' },
      });
    },
    /prohibited/i,
  );

  // Sensitive key: token
  await assert.rejects(
    async () => {
      await activityService.createEvent({
        projectId: 'proj-1',
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Task with token',
        entityType: 'TASK',
        entityId: 't-1',
        metadata: { api_token: 'secret123' },
      });
    },
    /prohibited/i,
  );
});

test('ActivityService bounds title and description length', async () => {
  let createdRecord: any = null;
  const mockPrisma: any = {
    activity: {
      create: async ({ data }: any) => {
        createdRecord = data;
        return { id: 'act-1', ...data, createdAt: new Date() };
      },
    },
  };

  const activityService = new ActivityService(mockPrisma);
  const oversizedTitle = 'A'.repeat(500);
  const oversizedDescription = 'B'.repeat(3000);

  await activityService.createEvent({
    projectId: 'proj-1',
    userId: 'user-1',
    type: 'TASK_CREATED',
    title: oversizedTitle,
    description: oversizedDescription,
    entityType: 'TASK',
    entityId: 't-1',
  });

  assert.ok(createdRecord);
  assert.equal(createdRecord.title.length, 250);
  assert.equal(createdRecord.description.length, 2000);
});
