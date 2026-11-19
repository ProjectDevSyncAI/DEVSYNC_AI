/**
 * Document Security & File Upload Tests
 * Milestone 4B.7 Phase 1
 *
 * 20 required security scenarios covering:
 * - Unauthenticated upload rejection
 * - Mandatory projectId validation & project authorization
 * - Allowed extensions whitelist & magic byte signature verification
 * - Empty & oversized file rejection
 * - Uploader identity derived strictly from JWT
 * - Persistent disk storage outside public web root
 * - Path traversal prevention & unique UUID filenames
 * - Database rollback file cleanup
 * - Document retrieval & deletion authorization
 * - File cleanup on document deletion
 * - Legacy null-projectId document fail-closed protection
 * - Concurrent upload non-collision
 * - Real filesystem integration with isolated temporary directory
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentsController } from '../../src/documents/documents.controller.js';
import { DocumentsService } from '../../src/documents/documents.service.js';
import { StorageService } from '../../src/documents/storage/storage.service.js';
import { FileUploadValidator } from '../../src/documents/validators/file-upload.validator.js';

// ─── Helpers & Test Fixtures ────────────────────────────────────────────────

// Sample valid file buffers with authentic magic bytes
const VALID_PDF_BUFFER = Buffer.concat([
  Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
]);

const VALID_DOCX_BUFFER = Buffer.concat([
  Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK zip signature
  Buffer.from('sample docx zip stream content for devsync testing'),
]);

const VALID_TXT_BUFFER = Buffer.from('Architecture specification for DevSync AI RAG system.');
const VALID_MD_BUFFER = Buffer.from('# Technical Specification\n\n- Milestone 4B.7\n- Phase 1 Secure Upload');

function createIsolatedStorageDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devsync-doc-test-'));
}

function makeMockPrisma(initialDocs: any[] = []) {
  const documents: any[] = [...initialDocs];
  const users: any[] = [
    { id: 'user-member-1', status: 'ACTIVE' },
    { id: 'user-foreign-2', status: 'ACTIVE' },
    { id: 'user-suspended-3', status: 'SUSPENDED' },
  ];

  const projects: any[] = [
    {
      id: 'proj-alpha-123',
      organizationId: 'org-alpha',
      organization: { id: 'org-alpha', ownerId: 'user-owner' },
      members: [{ id: 'm-1', userId: 'user-member-1' }],
    },
    {
      id: 'proj-beta-456',
      organizationId: 'org-beta',
      organization: { id: 'org-beta', ownerId: 'user-beta-owner' },
      members: [],
    },
  ];

  return {
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) || null,
    },
    project: {
      findUnique: async (args: any) => {
        const id = args?.where?.id;
        const p = projects.find((proj) => proj.id === id);
        if (!p) return null;
        const memberUserId = args?.select?.members?.where?.userId ?? args?.where?.userId;
        const members = memberUserId !== undefined
          ? p.members.filter((m: any) => m.userId === memberUserId)
          : p.members;
        return {
          id: p.id,
          organizationId: p.organizationId,
          organization: { ...p.organization },
          members,
        };
      },
      findMany: async () => projects.map((p) => ({ id: p.id })),
    },
    projectMember: {
      findMany: async ({ where }: any) => {
        return projects
          .filter((proj) => proj.members.some((m: any) => m.userId === where.userId))
          .map((proj) => ({ projectId: proj.id }));
      },
    },
    organizationMember: {
      findUnique: async () => null,
    },
    document: {
      create: async ({ data }: any) => {
        const created = {
          id: data.id || `doc-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        documents.push(created);
        return created;
      },
      findUnique: async ({ where }: any) => {
        const doc = documents.find((d) => d.id === where.id);
        return doc ? { ...doc } : null;
      },
      findMany: async ({ where }: any) => {
        return documents.filter((d) => {
          if (where?.projectId && d.projectId !== where.projectId) return false;
          if (where?.projectId?.in && !where.projectId.in.includes(d.projectId)) return false;
          return true;
        });
      },
      update: async ({ where, data }: any) => {
        const idx = documents.findIndex((d) => d.id === where.id);
        if (idx === -1) throw new NotFoundException('Document not found');
        documents[idx] = { ...documents[idx], ...data, updatedAt: new Date() };
        return documents[idx];
      },
      delete: async ({ where }: any) => {
        const idx = documents.findIndex((d) => d.id === where.id);
        if (idx === -1) throw new NotFoundException('Document not found');
        const [del] = documents.splice(idx, 1);
        return del;
      },
    },
    documentChunk: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      delete: async () => ({}),
    },
    _documents: documents,
  } as any;
}

// ─── Test Suite ────────────────────────────────────────────────────────────

test('1. Unauthenticated upload is rejected with 401 Unauthorized', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const reqWithoutUser = { user: null };
    const fakeFile = {
      buffer: VALID_TXT_BUFFER,
      originalname: 'spec.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    await assert.rejects(
      () => controller.uploadFile(reqWithoutUser, fakeFile, 'proj-alpha-123'),
      (err: any) => {
        assert.ok(err instanceof UnauthorizedException);
        assert.equal(err.message, 'Authentication required');
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('2. Authenticated upload without projectId is rejected with 400 Bad Request', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };
    const fakeFile = {
      buffer: VALID_TXT_BUFFER,
      originalname: 'spec.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    await assert.rejects(
      () => controller.uploadFile(req, fakeFile, ''),
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.ok(err.message.includes('Project ID is required'));
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('3. Invalid / non-existent projectId is rejected with 404', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };
    const fakeFile = {
      buffer: VALID_TXT_BUFFER,
      originalname: 'spec.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    await assert.rejects(
      () => controller.uploadFile(req, fakeFile, 'non-existent-proj-id'),
      (err: any) => {
        assert.ok(err.status === 404 || err.name === 'NotFoundException' || err instanceof NotFoundException);
        assert.ok(err.message.includes('Project not found'));
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('4. User without project access cannot upload (rejected with 403 Forbidden)', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    // user-foreign-2 is not a member of proj-alpha-123
    const req = { user: { userId: 'user-foreign-2' } };
    const fakeFile = {
      buffer: VALID_PDF_BUFFER,
      originalname: 'architecture.pdf',
      mimetype: 'application/pdf',
      size: VALID_PDF_BUFFER.length,
    };

    await assert.rejects(
      () => controller.uploadFile(req, fakeFile, 'proj-alpha-123'),
      (err: any) => {
        assert.ok(err.status === 403 || err.name === 'ForbiddenException' || err instanceof ForbiddenException);
        assert.ok(err.message.includes('access to this project'));
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('5. Valid project member can upload an allowed file (.pdf persisted on disk)', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };
    const fakeFile = {
      buffer: VALID_PDF_BUFFER,
      originalname: 'arch_spec.pdf',
      mimetype: 'application/pdf',
      size: VALID_PDF_BUFFER.length,
    };

    const doc = await controller.uploadFile(req, fakeFile, 'proj-alpha-123', 'Architecture Spec');
    const meta = (doc.metadata || {}) as Record<string, any>;

    assert.ok(doc.id, 'Document ID must be generated');
    assert.equal(doc.projectId, 'proj-alpha-123');
    assert.equal(doc.title, 'Architecture Spec');
    assert.equal(meta.originalFilename, 'arch_spec.pdf');
    assert.equal(meta.uploadedBy, 'user-member-1');
    assert.ok(meta.storageKey, 'Storage key must be present');

    // Verify physical file existence on disk
    const exists = await storageService.fileExists(meta.storageKey, 'proj-alpha-123');
    assert.equal(exists, true, 'File must exist on disk');

    const fileContent = await storageService.getFile(meta.storageKey, 'proj-alpha-123');
    assert.equal(fileContent.toString(), VALID_PDF_BUFFER.toString());
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('6. Unsupported file extension is rejected with 400 Bad Request', () => {
  const badExtensions = ['script.sh', 'malware.exe', 'index.html', 'payload.py', 'archive.zip'];

  for (const filename of badExtensions) {
    assert.throws(
      () =>
        FileUploadValidator.validate({
          buffer: Buffer.from('test content'),
          originalname: filename,
          mimetype: 'application/octet-stream',
          size: 12,
        }),
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.ok(err.message.includes('Unsupported file extension'));
        return true;
      },
    );
  }
});

test('7. Invalid MIME / file-signature mismatch is rejected with 400 Bad Request', () => {
  // A file claiming to be .pdf but containing plain text or executable code
  const fakePdfContent = Buffer.from('MZ executable binary fake PDF payload');

  assert.throws(
    () =>
      FileUploadValidator.validate({
        buffer: fakePdfContent,
        originalname: 'exploit.pdf',
        mimetype: 'application/pdf',
        size: fakePdfContent.length,
      }),
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.ok(err.message.includes('File signature mismatch'));
      return true;
    },
  );

  // A file claiming to be .docx but without PK zip header
  const fakeDocxContent = Buffer.from('Not a zip file at all');
  assert.throws(
    () =>
      FileUploadValidator.validate({
        buffer: fakeDocxContent,
        originalname: 'fake.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: fakeDocxContent.length,
      }),
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.ok(err.message.includes('File signature mismatch'));
      return true;
    },
  );
});

test('8. Empty files are rejected with 400 Bad Request', () => {
  assert.throws(
    () =>
      FileUploadValidator.validate({
        buffer: Buffer.alloc(0),
        originalname: 'empty.txt',
        mimetype: 'text/plain',
        size: 0,
      }),
    (err: any) => {
      assert.ok(err instanceof BadRequestException);
      assert.ok(err.message.includes('Empty files cannot be uploaded'));
      return true;
    },
  );
});

test('9. Oversized files exceeding maximum limit are rejected with 413 Payload Too Large', () => {
  // Mock file reporting size of 15 MB with small buffer for test speed
  assert.throws(
    () =>
      FileUploadValidator.validate(
        {
          buffer: VALID_PDF_BUFFER,
          originalname: 'huge.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024, // 15MB > 10MB
        },
        { maxSizeBytes: 10 * 1024 * 1024 },
      ),
    (err: any) => {
      assert.ok(err instanceof PayloadTooLargeException);
      assert.ok(err.message.includes('exceeds maximum allowed limit'));
      return true;
    },
  );
});

test('10. Missing file in upload request throws 400 Bad Request', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };

    await assert.rejects(
      () => controller.uploadFile(req, null as any, 'proj-alpha-123'),
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.ok(err.message.includes('File is required'));
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('11. Client-supplied uploader identity cannot override JWT identity', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    // Attacker tries to pass body spoofing another user
    const req = {
      user: { userId: 'user-member-1' },
      body: { userId: 'admin-attacker-spoofed-id', uploaderId: 'spoofed' },
    };

    const file = {
      buffer: VALID_TXT_BUFFER,
      originalname: 'safe.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    const doc = await controller.uploadFile(req, file, 'proj-alpha-123');
    const meta = (doc.metadata || {}) as Record<string, any>;

    // DB metadata must record verified JWT userId, never spoofed body value
    assert.equal(meta.uploadedBy, 'user-member-1');
    assert.notEqual(meta.uploadedBy, 'admin-attacker-spoofed-id');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('12. Uploaded files are stored outside the public web root', () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const storageService = new StorageService();
    const baseDir = storageService.getBaseDir();

    // Verify storage directory does not point into apps/web/public or dist
    assert.ok(!baseDir.includes('apps/web/public'));
    assert.ok(!baseDir.includes('apps/web/dist'));
    assert.ok(!baseDir.includes('apps/api/dist/public'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('13. Server-generated filenames prevent path traversal', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const storageService = new StorageService();

    // Malicious filename with traversal attempt
    const maliciousFile = {
      buffer: VALID_TXT_BUFFER,
      originalname: '../../../../etc/passwd.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    const stored = await storageService.saveFile(maliciousFile, 'proj-alpha-123');

    // The storage key must be a sanitized UUID, not containing traversal components
    assert.ok(!stored.storageKey.includes('..'));
    assert.ok(!stored.storageKey.includes('/'));
    assert.ok(!stored.storageKey.includes('\\'));

    // Check that stored file is inside project dir
    const exists = await storageService.fileExists(stored.storageKey, 'proj-alpha-123');
    assert.equal(exists, true);

    // Direct path traversal attempts via getFile must be blocked
    await assert.rejects(
      () => storageService.getFile('../../secret.txt', 'proj-alpha-123'),
      (err: any) => {
        assert.ok(err.message.includes('traversal'));
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('14. Database failure triggers uploaded-file cleanup (rollback)', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();

    // Inject database crash on create
    prisma.document.create = async () => {
      throw new Error('Database connection dropped unexpectedly during INSERT');
    };

    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };
    const fakeFile = {
      buffer: VALID_MD_BUFFER,
      originalname: 'crash-test.md',
      mimetype: 'text/markdown',
      size: VALID_MD_BUFFER.length,
    };

    let errorThrown = false;
    try {
      await controller.uploadFile(req, fakeFile, 'proj-alpha-123');
    } catch (err: any) {
      errorThrown = true;
      assert.ok(err.message.includes('Database connection dropped'));
    }
    assert.equal(errorThrown, true);

    // Verify that NO files were left orphaned in the project storage directory
    const projectDir = path.join(tmpDir, 'proj-alpha-123');
    if (fs.existsSync(projectDir)) {
      const remainingFiles = fs.readdirSync(projectDir);
      assert.equal(
        remainingFiles.length,
        0,
        `Expected 0 orphaned files, found: ${remainingFiles.join(', ')}`,
      );
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('15. Unauthorized document retrieval is rejected with 403 Forbidden', async () => {
  const prisma = makeMockPrisma([
    {
      id: 'doc-private-1',
      projectId: 'proj-alpha-123',
      title: 'Confidential Spec',
      metadata: {},
    },
  ]);
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  // user-foreign-2 is not authorized on proj-alpha-123
  const req = { user: { userId: 'user-foreign-2' } };

  await assert.rejects(
    () => controller.findOne(req, 'doc-private-1'),
    (err: any) => {
      assert.ok(err.status === 403 || err.name === 'ForbiddenException' || err instanceof ForbiddenException);
      assert.ok(err.message.includes('access to this project'));
      return true;
    },
  );
});

test('16. Unauthorized document deletion is rejected with 403 Forbidden', async () => {
  const prisma = makeMockPrisma([
    {
      id: 'doc-private-2',
      projectId: 'proj-alpha-123',
      title: 'Protected Document',
      metadata: {},
    },
  ]);
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-foreign-2' } };

  await assert.rejects(
    () => controller.remove(req, 'doc-private-2'),
    (err: any) => {
      assert.ok(err.status === 403 || err.name === 'ForbiddenException' || err instanceof ForbiddenException);
      return true;
    },
  );
});

test('17. Successful deletion cleans up the associated binary file on disk', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };
    const fakeFile = {
      buffer: VALID_TXT_BUFFER,
      originalname: 'to_be_deleted.txt',
      mimetype: 'text/plain',
      size: VALID_TXT_BUFFER.length,
    };

    // 1. Upload file
    const doc = await controller.uploadFile(req, fakeFile, 'proj-alpha-123');
    const storageKey = ((doc.metadata || {}) as Record<string, any>).storageKey;

    assert.equal(await storageService.fileExists(storageKey, 'proj-alpha-123'), true);

    // 2. Delete document via controller
    await controller.remove(req, doc.id);

    // 3. Verify file was unlinked from disk
    const existsAfterDelete = await storageService.fileExists(storageKey, 'proj-alpha-123');
    assert.equal(existsAfterDelete, false, 'Binary file must be deleted from disk upon document removal');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('18. Existing JSON document APIs remain compatible when valid projectId provided', async () => {
  const prisma = makeMockPrisma();
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-member-1' } };
  const jsonDto = {
    projectId: 'proj-alpha-123',
    title: 'Pure JSON Documentation',
    content: 'Full markdown documentation text submitted via REST API.',
    sourceType: 'DOCUMENTATION' as any,
  };

  const created = await controller.create(req, jsonDto);
  assert.ok(created.id);
  assert.equal(created.title, 'Pure JSON Documentation');
  assert.equal(created.projectId, 'proj-alpha-123');
});

test('19. Legacy documents with null projectId fail closed (403 Forbidden)', async () => {
  // Simulate legacy unassigned document stored in DB before hardening
  const prisma = makeMockPrisma([
    {
      id: 'legacy-doc-no-project',
      projectId: null,
      title: 'Legacy Orphan Document',
      content: 'Secret legacy notes without project assignment',
      metadata: {},
    },
  ]);
  const service = new DocumentsService(prisma);
  const controller = new DocumentsController(service, prisma);

  const req = { user: { userId: 'user-member-1' } };

  // 1. findOne on legacy unassigned doc must fail closed
  await assert.rejects(
    () => controller.findOne(req, 'legacy-doc-no-project'),
    (err: any) => {
      assert.ok(err instanceof ForbiddenException);
      assert.ok(err.message.includes('legacy document without project association'));
      return true;
    },
  );

  // 2. update on legacy unassigned doc must fail closed
  await assert.rejects(
    () => controller.update(req, 'legacy-doc-no-project', { title: 'hacked' }),
    (err: any) => {
      assert.ok(err instanceof ForbiddenException);
      return true;
    },
  );

  // 3. delete on legacy unassigned doc must fail closed
  await assert.rejects(
    () => controller.remove(req, 'legacy-doc-no-project'),
    (err: any) => {
      assert.ok(err instanceof ForbiddenException);
      return true;
    },
  );
});

test('20. Concurrent uploads do not overwrite one another (distinct UUID storage keys)', async () => {
  const tmpDir = createIsolatedStorageDir();
  process.env.STORAGE_DIR = tmpDir;

  try {
    const prisma = makeMockPrisma();
    const storageService = new StorageService();
    const service = new DocumentsService(prisma, storageService);
    const controller = new DocumentsController(service, prisma, storageService);

    const req = { user: { userId: 'user-member-1' } };

    // Simulate 5 simultaneous uploads of files having the SAME original filename
    const uploads = Array.from({ length: 5 }, (_, i) =>
      controller.uploadFile(
        req,
        {
          buffer: Buffer.from(`Unique file content variation #${i}`),
          originalname: 'same_name.txt',
          mimetype: 'text/plain',
          size: 28,
        },
        'proj-alpha-123',
      ),
    );

    const results = await Promise.all(uploads);

    // Verify all 5 documents have distinct storage keys
    const storageKeys = results.map((r) => ((r.metadata || {}) as Record<string, any>).storageKey);
    const uniqueKeys = new Set(storageKeys);
    assert.equal(uniqueKeys.size, 5, 'All 5 concurrent uploads must produce distinct storage keys');

    // Verify all 5 files physically exist on disk
    for (const key of storageKeys) {
      assert.equal(await storageService.fileExists(key, 'proj-alpha-123'), true);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
