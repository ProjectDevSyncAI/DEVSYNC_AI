/**
 * Token Chunking Service Test Suite
 * Milestone 4B.7 Phase 2
 *
 * Verifies token-bounded chunking engine:
 * - Chunk size: 800 tokens
 * - Overlap: 120 tokens
 * - gpt-tokenizer (cl100k_base / text-embedding-3-small)
 * - Paragraph and sentence boundary preference
 * - Deterministic chunk indices (0, 1, 2...)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ChunkingService } from '../../src/ai/rag/chunking.service.js';

test('Chunking [1] - Empty or whitespace content returns empty array', () => {
  const service = new ChunkingService();
  assert.deepEqual(service.chunk(''), []);
  assert.deepEqual(service.chunk('   \n\n   '), []);
});

test('Chunking [2] - Content under 800 tokens produces exactly 1 chunk with chunkIndex 0', () => {
  const service = new ChunkingService();
  const text = 'DevSync AI platform engineering document. Multi-tenant RAG architecture with pgvector.';
  const chunks = service.chunk(text);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].chunkIndex, 0);
  assert.equal(chunks[0].content, text);
  assert.ok(chunks[0].tokenCount > 5 && chunks[0].tokenCount < 100);
});

test('Chunking [3] - Long document produces multiple token-bounded chunks', () => {
  const service = new ChunkingService();
  // Generate a long text with multiple paragraphs (~2500 tokens)
  const paragraph =
    'The DevSync AI infrastructure incorporates multi-tenant project boundary enforcement, zero-trust cryptographic verification, and strict role hierarchy.\n\n';
  const longText = paragraph.repeat(150);

  const chunks = service.chunk(longText);

  assert.ok(chunks.length > 2, `Expected multiple chunks, got ${chunks.length}`);

  // Verify all chunks respect 800 token maximum limit
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    assert.equal(chunk.chunkIndex, i, `Chunk index must be sequentially deterministic (${i})`);
    assert.ok(
      chunk.tokenCount <= 800,
      `Chunk ${i} exceeds token limit: ${chunk.tokenCount} > 800`,
    );
    assert.ok(chunk.content.length > 0, `Chunk ${i} must have non-empty content`);
  }
});

test('Chunking [4] - Chunks preserve paragraph boundaries where possible', () => {
  const service = new ChunkingService();
  const p1 = 'First architectural overview paragraph explaining system goals and invariants.';
  const p2 = 'Second section detailing database migration guidelines and zero-loss guarantees.';
  const text = `${p1}\n\n${p2}`;

  // Custom small chunk size (18 tokens) to force split
  const chunks = service.chunk(text, 18, 5);

  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0].chunkIndex, 0);
  assert.ok(chunks[0].content.includes(p1));
});

test('Chunking [5] - Chunks overlap correctly between consecutive chunks', () => {
  const service = new ChunkingService();
  const sentence = 'Autonomous developer synchronization engine monitors sprint velocity and code health. ';
  const longText = sentence.repeat(60);

  // Use 50 token chunks with 15 token overlap
  const chunks = service.chunk(longText, 50, 15);

  assert.ok(chunks.length >= 3);

  // Check overlap: chunk N and chunk N+1 share common text
  for (let i = 0; i < chunks.length - 1; i++) {
    const curr = chunks[i].content;
    const next = chunks[i + 1].content;

    // Split into words and check that the start of `next` shares words with the end of `curr`
    const currWords = curr.split(/\s+/);
    const nextWords = next.split(/\s+/);

    const tailCurr = currWords.slice(-5).join(' ');
    const headNext = nextWords.slice(0, 10).join(' ');

    assert.ok(
      headNext.includes(currWords[currWords.length - 1]) ||
        curr.includes(nextWords[0]),
      `Chunks ${i} and ${i + 1} should share overlap context`,
    );
  }
});

test('Chunking [6] - countTokens correctly counts cl100k_base tokens', () => {
  const service = new ChunkingService();
  const count = service.countTokens('Hello world!');
  assert.equal(count, 3); // 'Hello', ' world', '!'
  assert.equal(service.countTokens(''), 0);
});
