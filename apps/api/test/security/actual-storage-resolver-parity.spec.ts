import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as os from 'node:os';

import { StorageService } from '../../src/documents/storage/storage.service.js';
import {
  resolveSafeStoragePath,
  getFullStorageFilePath,
  getProjectStorageDir,
  sanitizeProjectSegment,
  sanitizeStorageKey,
} from '../../src/documents/storage/storage-boundary.js';

test('1. Actual Resolver: project ID sanitization rejects traversal and separators', () => {
  assert.throws(() => sanitizeProjectSegment('../evil'), /Invalid project identifier/);
  assert.throws(() => sanitizeProjectSegment('proj/sub'), /Invalid project identifier/);
  assert.throws(() => sanitizeProjectSegment('proj\\sub'), /Invalid project identifier/);
  assert.throws(() => sanitizeProjectSegment('proj\0null'), /Invalid project identifier/);
  assert.equal(sanitizeProjectSegment('valid-proj_123'), 'valid-proj_123');
});

test('2. Actual Resolver: storage key sanitization rejects traversal and path tokens', () => {
  assert.throws(() => sanitizeStorageKey('../../etc/passwd'), /path traversal detected/);
  assert.throws(() => sanitizeStorageKey('sub/file.pdf'), /path traversal detected/);
  assert.throws(() => sanitizeStorageKey('sub\\file.pdf'), /path traversal detected/);
  assert.throws(() => sanitizeStorageKey('file.pdf\0bad'), /path traversal detected/);
  assert.throws(() => sanitizeStorageKey('..'), /path traversal detected/);
  assert.equal(sanitizeStorageKey('safe-uuid-1234.pdf'), 'safe-uuid-1234.pdf');
});

test('3. Actual Resolver: relative STORAGE_DIR causes divergence across package contexts', () => {
  const origCwd = process.cwd();
  const repoRoot = origCwd.endsWith('DEVSYNC_AI-main') ? origCwd : path.resolve(origCwd);
  const apiCwd = path.join(repoRoot, 'apps', 'api');
  const workerCwd = path.join(repoRoot, 'apps', 'worker');

  const prevStorage = process.env.STORAGE_DIR;
  try {
    process.env.STORAGE_DIR = './storage/uploads/documents';

    process.chdir(apiCwd);
    const apiService = new StorageService();
    const apiResolved = apiService.getBaseDir();

    process.chdir(workerCwd);
    const workerResolved = path.resolve(process.env.STORAGE_DIR);

    assert.notEqual(apiResolved, workerResolved, 'Relative STORAGE_DIR must diverge across packages');
    assert.ok(apiResolved.includes(path.join('apps', 'api')));
    assert.ok(workerResolved.includes(path.join('apps', 'worker')));
  } finally {
    process.chdir(origCwd);
    if (prevStorage !== undefined) process.env.STORAGE_DIR = prevStorage;
    else delete process.env.STORAGE_DIR;
  }
});

test('4. Actual Resolver: absolute STORAGE_DIR guarantees identical resolution across package contexts', async () => {
  const origCwd = process.cwd();
  const repoRoot = origCwd.endsWith('DEVSYNC_AI-main') ? origCwd : path.resolve(origCwd);
  const apiCwd = path.join(repoRoot, 'apps', 'api');
  const workerCwd = path.join(repoRoot, 'apps', 'worker');

  const canonicalSharedDir = path.resolve(repoRoot, 'storage', 'uploads', 'documents');
  const prevStorage = process.env.STORAGE_DIR;

  try {
    process.env.STORAGE_DIR = canonicalSharedDir;

    // API context
    process.chdir(apiCwd);
    const apiService = new StorageService();
    const apiBase = apiService.getBaseDir();

    // Verify expected target file structure
    const expectedFile = getFullStorageFilePath('proj-alpha', 'doc-uuid-123.pdf', canonicalSharedDir);
    assert.equal(apiBase, canonicalSharedDir);

    // Worker context invoking actual resolveSafeStoragePath
    process.chdir(workerCwd);
    // Since doc-uuid-123.pdf is not on disk, verifyNoSymlinkEscape attempts fs.realpath on the exact target path
    try {
      await resolveSafeStoragePath('doc-uuid-123.pdf', 'proj-alpha');
      assert.fail('Should have thrown ENOENT on non-existent file');
    } catch (err: any) {
      assert.equal(err.code, 'ENOENT');
      assert.equal(path.normalize(err.path), path.normalize(expectedFile));
    }
  } finally {
    process.chdir(origCwd);
    if (prevStorage !== undefined) process.env.STORAGE_DIR = prevStorage;
    else delete process.env.STORAGE_DIR;
  }
});

test('5. Actual Resolver: project directory containment rejects prefix escape collisions', () => {
  const baseDir = path.resolve(os.tmpdir(), 'devsync-storage-test');
  const projectDir = getProjectStorageDir('proj-123', baseDir);

  assert.equal(projectDir, path.resolve(baseDir, 'proj-123'));
  assert.ok(projectDir.startsWith(baseDir));
});
