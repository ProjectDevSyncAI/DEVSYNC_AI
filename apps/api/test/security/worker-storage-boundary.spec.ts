/**
 * Worker Storage Boundary & Symlink Protection Test Suite (H-1)
 * Milestone 4B.7 Phase 2.2
 *
 * Verifies:
 * - Valid stored file path resolution
 * - Path traversal attempts (..) in key and project ID are rejected
 * - Absolute path attempts are rejected
 * - Symlinks pointing outside storage root are detected and rejected
 * - Missing files throw appropriate ENOENT errors
 * - Worker cannot bypass storage boundary validation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  resolveSafeStoragePath,
  isPathContained,
  sanitizeProjectSegment,
  sanitizeStorageKey,
} from '../../src/documents/storage/storage-boundary.js';

test('H-1 [1] - Valid stored file resolves to expected physical path inside storage root', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-valid-'));
  const projectId = 'proj-valid-100';
  const storageKey = 'uuid-file-1234.pdf';

  const projectDir = path.join(tmpDir, projectId);
  await fs.mkdir(projectDir, { recursive: true });
  const filePath = path.join(projectDir, storageKey);
  await fs.writeFile(filePath, '%PDF-1.4 test document content');

  try {
    const resolved = await resolveSafeStoragePath(storageKey, projectId, tmpDir);
    assert.equal(resolved, path.resolve(filePath));
    assert.ok(isPathContained(resolved, tmpDir));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('H-1 [2] - Path traversal in storageKey is strictly rejected', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-traversal-'));
  const projectId = 'proj-valid-100';

  try {
    // Relative upward traversal
    await assert.rejects(
      () => resolveSafeStoragePath('../../../etc/passwd', projectId, tmpDir),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );

    // Sibling traversal
    await assert.rejects(
      () => resolveSafeStoragePath('..\\other-project\\file.txt', projectId, tmpDir),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );

    // Embedded traversal token
    await assert.rejects(
      () => resolveSafeStoragePath('sub/../../secret.txt', projectId, tmpDir),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('H-1 [3] - Absolute path attempts in storageKey or projectId are rejected', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-abs-'));

  try {
    // Absolute Unix path in storageKey
    await assert.rejects(
      () => resolveSafeStoragePath('/etc/shadow', 'proj-123', tmpDir),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );

    // Absolute Windows path in storageKey
    await assert.rejects(
      () => resolveSafeStoragePath('C:\\Windows\\System32\\cmd.exe', 'proj-123', tmpDir),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );

    // Absolute path in projectId
    assert.throws(
      () => sanitizeProjectSegment('/var/data/'),
      (err: any) => {
        assert.ok(err.message.includes('Invalid project identifier'));
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('H-1 [4] - Symlink pointing outside storage root is detected and rejected via realpath', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-symlink-'));
  const projectId = 'proj-sym-test';
  const projectDir = path.join(tmpDir, projectId);
  await fs.mkdir(projectDir, { recursive: true });

  // Outside sensitive file
  const secretFile = path.join(tmpDir, 'host-secret.txt');
  await fs.writeFile(secretFile, 'SuperSecretCredentials');

  const symlinkKey = 'innocent-doc.pdf';
  const symlinkPath = path.join(projectDir, symlinkKey);

  try {
    await fs.symlink(secretFile, symlinkPath).catch(() => null);
    const linkExists = await fs.lstat(symlinkPath).catch(() => null);

    if (linkExists) {
      await assert.rejects(
        () => resolveSafeStoragePath(symlinkKey, projectId, tmpDir),
        (err: any) => {
          assert.ok(err.message.includes('Symlink path traversal') || err.message.includes('outside'));
          return true;
        },
      );
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('H-1 [5] - Missing physical file throws typed ENOENT error', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-missing-'));
  const projectId = 'proj-missing-test';
  const storageKey = 'non-existent-uuid.txt';

  const projectDir = path.join(tmpDir, projectId);
  await fs.mkdir(projectDir, { recursive: true });

  try {
    // Missing file throws ENOENT during boundary-safe resolution
    await assert.rejects(
      () => resolveSafeStoragePath(storageKey, projectId, tmpDir),
      (err: any) => {
        assert.equal(err.code, 'ENOENT');
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('H-1 [6] - Worker storage boundary enforces same validation as API StorageService', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-h1-worker-'));
  const projectId = 'proj-worker-iso';

  try {
    // Malicious project ID with path separators
    assert.throws(
      () => sanitizeProjectSegment('../evil-dir'),
      (err: any) => {
        assert.ok(err.message.includes('Invalid project identifier'));
        return true;
      },
    );

    // Null byte injection attempt
    assert.throws(
      () => sanitizeStorageKey('safe-name\0attack.txt'),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );

    // Single dot or double dot basename
    assert.throws(
      () => sanitizeStorageKey('.'),
      (err: any) => {
        assert.ok(err.message.includes('path traversal'));
        return true;
      },
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});
