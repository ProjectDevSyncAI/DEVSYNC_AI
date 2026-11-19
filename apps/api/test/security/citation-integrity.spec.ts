/**
 * Citation Integrity & Relevance Score Test Suite (F-9)
 * Milestone 4B.7 Phase 3.2
 *
 * Verifies:
 * - Relevance score is derived directly from measured distance (1 - distance) or undefined
 * - Arbitrary fallback relevance score (0.85) is completely eliminated
 * - 1-to-1 alignment between returned sources and persisted AIMessageCitation records
 * - Local fallback bug queries do not fabricate document citations
 * - Chunks with distance > 1 clamp safely to 0; distance <= 0 clamp safely to 1
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../../src/ai/ai.service.js';

function createMockPrismaWithCitations() {
  const conversations = new Map<string, any>();
  const messages = new Map<string, any>();
  const citations: any[] = [];

  return {
    aIConversation: {
      findUnique: async ({ where }: any) => conversations.get(where.id) || null,
      create: async ({ data }: any) => {
        const conv = { id: `conv-${Date.now()}`, ...data };
        conversations.set(conv.id, conv);
        return conv;
      },
    },
    aIMessage: {
      create: async ({ data }: any) => {
        const msg = { id: `msg-${Date.now()}-${Math.random()}`, ...data };
        messages.set(msg.id, msg);
        return msg;
      },
    },
    aIMessageCitation: {
      create: async ({ data }: any) => {
        const citation = { id: `cit-${citations.length + 1}`, ...data };
        citations.push(citation);
        return citation;
      },
    },
    project: {
      findUnique: async () => ({ id: 'proj-1', name: 'DevSync Test' }),
    },
    commit: {
      findMany: async () => [],
    },
    issue: {
      findMany: async () => [
        { id: 'iss-1', title: 'Bug in login', priority: 'HIGH', status: 'OPEN', type: 'BUG' },
      ],
    },
    sprint: {
      findFirst: async () => null,
    },
    task: {
      findMany: async () => [],
    },
    getCitations: () => citations,
    clear: () => {
      conversations.clear();
      messages.clear();
      citations.length = 0;
    },
  };
}

function createAIService(prisma: any, ragChunks: any[] = []) {
  const ragService = {
    search: async () => ({
      query: 'test',
      chunks: ragChunks,
      context: ragChunks.map((c) => c.content).join('\n'),
    }),
  };
  const openAIService = {
    isConfigured: () => false,
    generateCompletion: async () => {
      throw new Error('OpenAI not configured');
    },
  };
  const promptService = {
    buildProjectPrompt: (_q: string, ctx: string) => `Prompt with ${ctx}`,
    buildSystemPrompt: () => 'System prompt',
  };

  return new AIService(
    prisma as any,
    ragService as any,
    openAIService as any,
    promptService as any,
  );
}

test('F-9 [1] - Relevance score is derived directly from distance (1 - distance)', async () => {
  const prisma = createMockPrismaWithCitations();
  const ragChunks = [
    {
      id: 'chunk-1',
      documentId: 'doc-1',
      content: 'Authentication architecture notes',
      distance: 0.25, // expected relevance: 0.75
      metadata: { title: 'Auth Guide' },
    },
  ];

  const service = createAIService(prisma, ragChunks);
  const result = await service.ask('user-1', 'proj-1', 'How does authentication work?');

  const citations = prisma.getCitations();
  assert.equal(citations.length, 1);
  assert.equal(citations[0].chunkId, 'chunk-1');
  assert.equal(citations[0].relevanceScore, 0.75);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].id, 'chunk-1');
});

test('F-9 [2] - Missing or non-finite distance results in undefined relevanceScore (never 0.85)', async () => {
  const prisma = createMockPrismaWithCitations();
  const ragChunks = [
    {
      id: 'chunk-nan',
      documentId: 'doc-1',
      content: 'Authentication token details',
      distance: NaN,
      metadata: { title: 'Auth Guide' },
    },
  ];

  const service = createAIService(prisma, ragChunks);
  await service.ask('user-1', 'proj-1', 'How does authentication work?');

  const citations = prisma.getCitations();
  assert.equal(citations.length, 1);
  assert.equal(citations[0].chunkId, 'chunk-nan');
  // Must NOT be the arbitrary 0.85 fallback
  assert.equal(citations[0].relevanceScore, undefined);
});

test('F-9 [3] - Extreme distance values clamp safely to [0, 1]', async () => {
  const prisma = createMockPrismaWithCitations();
  const ragChunks = [
    {
      id: 'chunk-far',
      documentId: 'doc-1',
      content: 'Authentication distant chunk',
      distance: 1.8, // 1 - 1.8 = -0.8 -> clamp to 0
      metadata: { title: 'Auth Guide' },
    },
  ];

  const service = createAIService(prisma, ragChunks);
  await service.ask('user-1', 'proj-1', 'How does authentication work?');

  const citations = prisma.getCitations();
  assert.equal(citations.length, 1);
  assert.equal(citations[0].relevanceScore, 0);
});

test('F-9 [4] - Local fallback bug queries return zero document citations', async () => {
  const prisma = createMockPrismaWithCitations();
  const ragChunks = [
    {
      id: 'chunk-general',
      documentId: 'doc-1',
      content: 'Irrelevant documentation',
      distance: 0.1,
      metadata: { title: 'General Info' },
    },
  ];

  const service = createAIService(prisma, ragChunks);
  const result = await service.ask('user-1', 'proj-1', 'Summarize unresolved bugs and suggest priorities');

  // Answer should be bug-focused
  assert.ok(result.answer.includes('Unresolved Bugs'));

  // Must have 0 citations persisted
  const citations = prisma.getCitations();
  assert.equal(citations.length, 0);

  // Must have 0 sources returned
  assert.equal(result.sources.length, 0);
});

test('F-9 [5] - 1-to-1 alignment between returned sources and persisted citations', async () => {
  const prisma = createMockPrismaWithCitations();
  const ragChunks = [
    {
      id: 'chunk-auth-1',
      documentId: 'doc-1',
      content: 'Authentication module token rotation',
      distance: 0.15,
      metadata: { title: 'Auth Architecture' },
    },
  ];

  const service = createAIService(prisma, ragChunks);
  const result = await service.ask('user-1', 'proj-1', 'What changed in authentication?');

  const citations = prisma.getCitations();
  assert.equal(citations.length, result.sources.length);
  for (let i = 0; i < citations.length; i++) {
    assert.equal(citations[i].chunkId, result.sources[i].id);
    assert.equal(citations[i].documentId, result.sources[i].documentId);
  }
});
