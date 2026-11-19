import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  isPathContained,
  sanitizeProjectSegment,
  sanitizeStorageKey,
  getProjectStorageDir,
  getFullStorageFilePath,
  verifyNoSymlinkEscape,
  resolveSafeStoragePath,
} from './storage-boundary.js';

export interface StorageResult {
  storageKey: string;
  storagePath: string; // Relative path, never absolute
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
}

export interface UploadInputFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(
      process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'uploads', 'documents'),
    );
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  private isPathContained(targetPath: string, parentDir: string): boolean {
    return isPathContained(targetPath, parentDir);
  }

  private sanitizeProjectSegment(projectId: string): string {
    return sanitizeProjectSegment(projectId);
  }

  private sanitizeStorageKey(storageKey: string): string {
    return sanitizeStorageKey(storageKey);
  }

  private getProjectDir(projectId: string): string {
    return getProjectStorageDir(projectId, this.baseDir);
  }

  private getFullFilePath(projectId: string, storageKey: string): string {
    return getFullStorageFilePath(projectId, storageKey, this.baseDir);
  }

  private async verifyNoSymlinkEscape(fullPath: string, expectedDir: string): Promise<string> {
    return await verifyNoSymlinkEscape(fullPath, expectedDir);
  }

  async saveFile(file: UploadInputFile, projectId: string): Promise<StorageResult> {
    const projectDir = this.getProjectDir(projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Derive safe extension
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const storageKey = `${crypto.randomUUID()}${ext}`;
    const fullPath = this.getFullFilePath(projectId, storageKey);

    // Compute checksum
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Write file to disk
    await fs.writeFile(fullPath, file.buffer);

    const relativePath = path.join(this.sanitizeProjectSegment(projectId), storageKey).replace(/\\/g, '/');

    this.logger.log(`Stored file ${storageKey} (${file.size} bytes) for project ${projectId}`);

    return {
      storageKey,
      storagePath: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
    };
  }

  async getFile(storageKey: string, projectId: string): Promise<Buffer> {
    const fullPath = await this.getPhysicalPath(storageKey, projectId);
    try {
      return await fs.readFile(fullPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new NotFoundException('Stored document binary file not found');
      }
      this.logger.error(`Failed to read file ${storageKey}: ${err.message}`);
      throw err;
    }
  }

  async deleteFile(storageKey: string, projectId: string): Promise<boolean> {
    try {
      const fullPath = await this.getPhysicalPath(storageKey, projectId);
      await fs.unlink(fullPath);
      this.logger.log(`Deleted file ${storageKey} for project ${projectId}`);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.warn(`File ${storageKey} already absent on disk during deletion`);
        return false;
      }
      this.logger.error(`Failed to delete file ${storageKey}: ${err.message}`);
      throw err;
    }
  }

  async getPhysicalPath(storageKey: string, projectId: string): Promise<string> {
    return await resolveSafeStoragePath(storageKey, projectId, this.baseDir);
  }

  async fileExists(storageKey: string, projectId: string): Promise<boolean> {
    try {
      const fullPath = await this.getPhysicalPath(storageKey, projectId);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
