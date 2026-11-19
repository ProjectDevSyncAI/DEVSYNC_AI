import test from 'node:test';
import assert from 'node:assert';
import { TasksService } from '../../src/tasks/tasks.service.js';

function createMockPrisma(authorizedProjectIds: string[]) {
  const tasksStore: any[] = [
    {
      id: 'task-accessible-1',
      projectId: 'proj-auth-1',
      creatorId: 'user-auth-1',
      title: 'Accessible Task',
      status: 'TODO',
      priority: 'MEDIUM',
    },
    {
      id: 'task-foreign-1',
      projectId: 'proj-foreign-1',
      creatorId: 'user-foreign-1',
      title: 'Foreign Secret Task',
      status: 'TODO',
      priority: 'HIGH',
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
      findUnique: async ({ where }: any) => {
        if (where.id === 'proj-nonexistent') return null;
        const isAuth = authorizedProjectIds.includes(where.id);
        return {
          id: where.id,
          organizationId: isAuth ? 'org-auth' : 'org-foreign',
          organization: {
            id: isAuth ? 'org-auth' : 'org-foreign',
            ownerId: isAuth ? 'user-auth-1' : 'user-foreign-owner',
          },
          members: isAuth ? [{ id: 'pm-auth-1' }] : [],
        };
      },
      findMany: async () => [],
    },
    projectMember: {
      findMany: async ({ where }: any) => {
        return authorizedProjectIds.map((pId) => ({ projectId: pId }));
      },
    },
    organizationMember: {
      findUnique: async () => null,
    },
    task: {
      create: async ({ data }: any) => {
        const created = { id: `task-${Date.now()}`, ...data };
        tasksStore.push(created);
        return created;
      },
      findMany: async ({ where }: any) => {
        if (where?.projectId?.in) {
          return tasksStore.filter((t) => where.projectId.in.includes(t.projectId));
        }
        if (where?.projectId) {
          return tasksStore.filter((t) => t.projectId === where.projectId);
        }
        return tasksStore;
      },
      findUnique: async ({ where }: any) => {
        return tasksStore.find((t) => t.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const task = tasksStore.find((t) => t.id === where.id);
        if (task) Object.assign(task, data);
        return task;
      },
      delete: async ({ where }: any) => {
        const idx = tasksStore.findIndex((t) => t.id === where.id);
        if (idx >= 0) tasksStore.splice(idx, 1);
        return { id: where.id };
      },
    },
    sprint: {
      findUnique: async ({ where }: any) => {
        const sprints = [
          { id: 'sprint-auth-1', projectId: 'proj-auth-1', name: 'Sprint 1 Auth' },
          { id: 'sprint-foreign-1', projectId: 'proj-foreign-1', name: 'Sprint 1 Foreign' },
        ];
        return sprints.find((s) => s.id === where.id) || null;
      },
    },
  } as any;
}

test('Tasks Service Security - Authorized user can create a task and creatorId matches authenticated user', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  const task = await service.create('user-auth-1', {
    projectId: 'proj-auth-1',
    title: 'Test Authorized Task',
    status: 'TODO' as any,
    priority: 'MEDIUM' as any,
  } as any);

  assert.strictEqual(task.projectId, 'proj-auth-1');
  assert.strictEqual(task.creatorId, 'user-auth-1', 'Creator ID must strictly match authenticated user identity');
});

test('Tasks Service Security - Unauthorized user cannot create task in another organization', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  await assert.rejects(
    () =>
      service.create('user-auth-1', {
        projectId: 'proj-foreign-1', // Unauthorized project
        title: 'Malicious Task Injection',
      } as any),
    (err: any) => err.status === 403,
    'Attempt to create task in foreign project must throw 403 Forbidden'
  );
});

test('Tasks Service Security - Authorized user can retrieve an accessible task', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  const task = await service.findOne('user-auth-1', 'task-accessible-1');
  assert.strictEqual(task.id, 'task-accessible-1');
});

test('Tasks Service Security - Unauthorized user cannot retrieve a foreign task', async () => {
  const prisma = createMockPrisma(['proj-auth-1']); // Not authorized for proj-foreign-1
  const service = new TasksService(prisma);

  await assert.rejects(
    () => service.findOne('user-auth-1', 'task-foreign-1'),
    (err: any) => err.status === 403,
    'Attempt to read foreign task must be blocked with 403'
  );
});

test('Tasks Service Security - Unauthorized user cannot update a foreign task', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  await assert.rejects(
    () => service.update('user-auth-1', 'task-foreign-1', { title: 'Hacked Title' } as any),
    (err: any) => err.status === 403,
    'Attempt to update foreign task must throw 403'
  );
});

test('Tasks Service Security - Unauthorized user cannot delete a foreign task', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  await assert.rejects(
    () => service.remove('user-auth-1', 'task-foreign-1'),
    (err: any) => err.status === 403,
    'Attempt to delete foreign task must throw 403'
  );
});

test('Tasks Service Security - findAll without projectId only returns authorized projects tasks', async () => {
  const prisma = createMockPrisma(['proj-auth-1']); // User only belongs to proj-auth-1
  const service = new TasksService(prisma);

  const tasks = await service.findAll('user-auth-1');
  assert.strictEqual(tasks.length, 1);
  assert.strictEqual(tasks[0].id, 'task-accessible-1');
  assert.ok(!tasks.some((t: any) => t.projectId === 'proj-foreign-1'), 'Foreign tasks must not leak into results');
});

test('Tasks Service Security - Authorized task can be assigned to a sprint in the same project', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  const updated = await service.update('user-auth-1', 'task-accessible-1', {
    sprintId: 'sprint-auth-1',
  } as any);

  assert.strictEqual(updated.sprintId, 'sprint-auth-1');
});

test('Tasks Service Security - Task cannot be assigned to a sprint in another project (400)', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  await assert.rejects(
    () =>
      service.update('user-auth-1', 'task-accessible-1', {
        sprintId: 'sprint-foreign-1', // belongs to proj-foreign-1
      } as any),
    (err: any) => err.status === 400 && err.message === 'Sprint does not belong to this project',
    'Assigning task to sprint from different project must throw 400 Bad Request'
  );
});

test('Tasks Service Security - Unauthorized user cannot change sprint association (403)', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  await assert.rejects(
    () =>
      service.update('user-auth-1', 'task-foreign-1', {
        sprintId: 'sprint-auth-1',
      } as any),
    (err: any) => err.status === 403,
    'Unauthorized user attempting to update sprint association on foreign task must be rejected with 403'
  );
});

test('Tasks Service Security - sprintId null removes the sprint association cleanly', async () => {
  const prisma = createMockPrisma(['proj-auth-1']);
  const service = new TasksService(prisma);

  const updated = await service.update('user-auth-1', 'task-accessible-1', {
    sprintId: null,
  } as any);

  assert.strictEqual(updated.sprintId, null, 'Setting sprintId to null must clear the association');
});

