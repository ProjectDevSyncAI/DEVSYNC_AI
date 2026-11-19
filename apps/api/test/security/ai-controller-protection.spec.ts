import test from 'node:test';
import assert from 'node:assert';
import { assertProjectAccess } from '../../src/common/helpers/project-access.helper.js';

function createMockPrismaForAI(userHasAccess: boolean) {
  return {
    project: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'unauthorized-project') {
          return {
            id: 'unauthorized-project',
            organizationId: 'org-other',
            organization: { id: 'org-other', ownerId: 'other-owner' },
            members: [],
          };
        }
        if (where.id === 'authorized-project') {
          return {
            id: 'authorized-project',
            organizationId: 'org-mine',
            organization: { id: 'org-mine', ownerId: 'my-owner' },
            members: userHasAccess ? [{ id: 'member-1' }] : [],
          };
        }
        return null;
      },
    },
    organizationMember: {
      findUnique: async () => null,
    },
  } as any;
}

test('AI/RAG Security - Unauthenticated project access throws 403 Forbidden', async () => {
  const mockPrisma = createMockPrismaForAI(false);

  await assert.rejects(
    () => assertProjectAccess(mockPrisma, '', 'authorized-project'),
    (err: any) => err.status === 403 && err.message === 'User is not authenticated',
    'Empty or unauthenticated user must be rejected'
  );
});

test('AI/RAG Security - Foreign project request to unauthorized project is rejected with 403', async () => {
  const mockPrisma = createMockPrismaForAI(false);

  let aiServiceInvoked = false;
  const mockAiService = {
    ask: async () => {
      aiServiceInvoked = true;
      return { answer: 'sensitive project knowledge' };
    },
  };

  await assert.rejects(
    async () => {
      await assertProjectAccess(mockPrisma, 'user-attacker', 'unauthorized-project');
      await mockAiService.ask();
    },
    (err: any) => err.status === 403 && err.message === 'You do not have access to this project',
    'Attacker must be blocked from querying foreign project AI context'
  );

  assert.strictEqual(aiServiceInvoked, false, 'AI Service must never be invoked when project authorization fails');
});

test('AI/RAG Security - Authorized user is permitted to query AI/RAG project context', async () => {
  const mockPrisma = createMockPrismaForAI(true);

  let aiServiceInvoked = false;
  const mockAiService = {
    ask: async () => {
      aiServiceInvoked = true;
      return { answer: 'valid project knowledge' };
    },
  };

  const access = await assertProjectAccess(mockPrisma, 'user-authorized', 'authorized-project');
  assert.strictEqual(access.projectId, 'authorized-project');

  const result = await mockAiService.ask();
  assert.strictEqual(aiServiceInvoked, true);
  assert.strictEqual(result.answer, 'valid project knowledge');
});
