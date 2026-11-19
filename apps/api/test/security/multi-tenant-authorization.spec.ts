import test from 'node:test';
import assert from 'node:assert';
import { assertProjectAccess } from '../../src/common/helpers/project-access.helper.js';

function createMockPrisma(options: {
  projectExists?: boolean;
  isProjectMember?: boolean;
  isOrgOwner?: boolean;
  orgRole?: string | null;
}) {
  const {
    projectExists = true,
    isProjectMember = false,
    isOrgOwner = false,
    orgRole = isOrgOwner ? 'OWNER' : null,
  } = options;

  return {
    project: {
      findUnique: async ({ where }: any) => {
        if (!projectExists) return null;
        return {
          id: where.id,
          organizationId: 'org-target-1',
          organization: {
            id: 'org-target-1',
            ownerId: isOrgOwner ? 'user-attacker-1' : 'user-victim-owner',
          },
          members: isProjectMember ? [{ id: 'pm-1' }] : [],
        };
      },
    },
    organizationMember: {
      findUnique: async () => {
        if (!orgRole) return null;
        return { role: orgRole };
      },
    },
  } as any;
}

test('Multi-Tenant Security - User with no project or org membership is rejected with 403', async () => {
  const mockPrisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    isOrgOwner: false,
    orgRole: null,
  });

  await assert.rejects(
    () => assertProjectAccess(mockPrisma, 'user-attacker-1', 'project-target-1'),
    (err: any) => err.status === 403 && err.message === 'You do not have access to this project',
    'Cross-org request without membership must throw 403 Forbidden'
  );
});

test('Multi-Tenant Security - Non-existent project is rejected with 404', async () => {
  const mockPrisma = createMockPrisma({ projectExists: false });

  await assert.rejects(
    () => assertProjectAccess(mockPrisma, 'user-attacker-1', 'non-existent-proj'),
    (err: any) => err.status === 404 && err.message === 'Project not found',
    'Non-existent project must throw 404 Not Found'
  );
});

test('Multi-Tenant Security - Direct project member is granted access', async () => {
  const mockPrisma = createMockPrisma({
    projectExists: true,
    isProjectMember: true,
  });

  const res = await assertProjectAccess(mockPrisma, 'user-member-1', 'project-target-1');
  assert.strictEqual(res.projectId, 'project-target-1');
  assert.strictEqual(res.organizationId, 'org-target-1');
});

test('Multi-Tenant Security - Organization Owner is granted access', async () => {
  const mockPrisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    isOrgOwner: true,
  });

  const res = await assertProjectAccess(mockPrisma, 'user-attacker-1', 'project-target-1');
  assert.strictEqual(res.projectId, 'project-target-1');
});

test('Multi-Tenant Security - Organization Admin is granted access', async () => {
  const mockPrisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    isOrgOwner: false,
    orgRole: 'ADMIN',
  });

  const res = await assertProjectAccess(mockPrisma, 'user-admin-1', 'project-target-1');
  assert.strictEqual(res.projectId, 'project-target-1');
});

test('Multi-Tenant Security - Regular org member (ENGINEER) without project membership is rejected with 403', async () => {
  const mockPrisma = createMockPrisma({
    projectExists: true,
    isProjectMember: false,
    isOrgOwner: false,
    orgRole: 'ENGINEER',
  });

  await assert.rejects(
    () => assertProjectAccess(mockPrisma, 'user-eng-1', 'project-target-1'),
    (err: any) => err.status === 403 && err.message === 'You do not have access to this project',
    'Non-admin org member without direct project membership must be blocked'
  );
});
