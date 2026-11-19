import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * Boundary-safe storage containment utilities.
 * Shared between API and Background Worker to guarantee consistent
 * path traversal and symlink escape protections.
 */

/**
 * Determines whether targetPath is strictly inside parentDir.
 * Prevents prefix collision attacks (e.g. uploads vs uploads-evil).
 */
export function isPathContained(targetPath: string, parentDir: string): boolean {
  const relative = path.relative(parentDir, targetPath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates and sanitizes a project identifier segment.
 * Rejects traversal, path separators, and null bytes.
 */
export function sanitizeProjectSegment(projectId: string): string {
  if (
    !projectId ||
    typeof projectId !== 'string' ||
    projectId.includes('/') ||
    projectId.includes('\\') ||
    projectId.includes('..') ||
    projectId.includes('\0')
  ) {
    throw new Error('Invalid project identifier for storage path');
  }
  const clean = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) {
    throw new Error('Invalid project identifier for storage path');
  }
  return clean;
}

/**
 * Validates and sanitizes a storage key.
 * Strictly disallows traversal tokens (..), path separators (/ or \), and null bytes.
 */
export function sanitizeStorageKey(storageKey: string): string {
  if (
    !storageKey ||
    typeof storageKey !== 'string' ||
    storageKey.includes('..') ||
    storageKey.includes('/') ||
    storageKey.includes('\\') ||
    storageKey.includes('\0')
  ) {
    throw new Error('Invalid storage key: path traversal detected');
  }
  const base = path.basename(storageKey);
  if (!base || base === '.' || base === '..') {
    throw new Error('Invalid storage key: path traversal detected');
  }
  return base;
}

/**
 * Resolves and validates the project directory within the storage root.
 */
export function getProjectStorageDir(projectId: string, baseDir: string): string {
  const safeProject = sanitizeProjectSegment(projectId);
  const projectDir = path.resolve(baseDir, safeProject);

  if (!isPathContained(projectDir, baseDir)) {
    throw new Error('Path traversal detected in project directory resolution');
  }

  return projectDir;
}

/**
 * Resolves the full file path and verifies containment within project directory.
 */
export function getFullStorageFilePath(projectId: string, storageKey: string, baseDir: string): string {
  const safeKey = sanitizeStorageKey(storageKey);
  const projectDir = getProjectStorageDir(projectId, baseDir);
  const fullPath = path.resolve(projectDir, safeKey);

  if (!isPathContained(fullPath, projectDir)) {
    throw new Error('Path traversal detected in file path resolution');
  }

  return fullPath;
}

/**
 * Resolves realpath on targetPath and ensures it does not escape expectedDir via symlinks.
 */
export async function verifyNoSymlinkEscape(fullPath: string, expectedDir: string): Promise<string> {
  try {
    const real = await fs.realpath(fullPath);
    let realExpected = expectedDir;
    try {
      realExpected = await fs.realpath(expectedDir);
    } catch {
      // expectedDir may not need realpath resolution
    }
    if (!isPathContained(real, realExpected)) {
      throw new Error('Symlink path traversal detected: file targets directory outside storage boundary');
    }
    return real;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw err;
    }
    if (err.message && err.message.includes('Symlink path traversal')) {
      throw err;
    }
    return fullPath;
  }
}

/**
 * Master path resolution function used by both API and Worker.
 * Enforces:
 * 1. Project ID sanitization
 * 2. Storage key sanitization
 * 3. Boundary containment within storage root
 * 4. Symlink resolution and escape rejection via fs.realpath
 */
export async function resolveSafeStoragePath(
  storageKey: string,
  projectId: string,
  customBaseDir?: string,
): Promise<string> {
  const resolvedBase = path.resolve(
    customBaseDir ||
      process.env.STORAGE_DIR ||
      path.join(process.cwd(), 'storage', 'uploads', 'documents'),
  );

  const fullPath = getFullStorageFilePath(projectId, storageKey, resolvedBase);
  const projectDir = getProjectStorageDir(projectId, resolvedBase);

  return await verifyNoSymlinkEscape(fullPath, projectDir);
}
