import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import * as path from 'node:path';

export interface FileValidationOptions {
  maxSizeBytes?: number; // Default 10MB
  allowedExtensions?: string[];
}

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'] as const;

export class FileUploadValidator {
  /**
   * Sanitizes user-provided filename to prevent path traversal or malformed characters.
   */
  static sanitizeFilename(originalName: string): string {
    if (!originalName || typeof originalName !== 'string') {
      return 'document';
    }

    // Strip path elements, null bytes, and control characters
    let name = path.basename(originalName);
    name = name.replace(/[\x00-\x1F\x7F]/g, '');
    name = name.replace(/[\/\\]/g, '');
    name = name.trim();

    if (!name) {
      return 'document';
    }

    return name.slice(0, 255);
  }

  /**
   * Validates file presence, size, extension, and content signature.
   */
  static validate(
    file: {
      buffer?: Buffer;
      originalname?: string;
      size?: number;
      mimetype?: string;
    },
    options: FileValidationOptions = {},
  ): {
    sanitizedFilename: string;
    extension: string;
    mimeType: string;
  } {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }

    // 1. Buffer & size validation
    const buffer = file.buffer;
    const size = typeof file.size === 'number' ? file.size : buffer?.length ?? 0;
    const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE;

    if (!buffer || buffer.length === 0 || size === 0) {
      throw new BadRequestException('Empty files cannot be uploaded');
    }

    if (size > maxSize) {
      throw new PayloadTooLargeException(
        `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (${(maxSize / (1024 * 1024)).toFixed(0)} MB)`,
      );
    }

    // 2. Extension validation
    const rawName = file.originalname || '';
    const ext = path.extname(rawName).toLowerCase();
    const allowed = options.allowedExtensions ?? (ALLOWED_EXTENSIONS as unknown as string[]);

    if (!ext || !allowed.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file extension "${ext || 'none'}". Allowed formats: ${allowed.join(', ')}`,
      );
    }

    // 3. Signature & Magic Bytes Validation
    this.validateMagicBytes(ext, buffer, file.mimetype);

    const sanitizedFilename = this.sanitizeFilename(rawName);

    return {
      sanitizedFilename,
      extension: ext,
      mimeType: file.mimetype || 'application/octet-stream',
    };
  }

  private static validateMagicBytes(
    ext: string,
    buffer: Buffer,
    mimetype?: string,
  ): void {
    if (ext === '.pdf') {
      // PDF files must start with %PDF (0x25, 0x50, 0x44, 0x46)
      if (
        buffer.length < 4 ||
        buffer[0] !== 0x25 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x44 ||
        buffer[3] !== 0x46
      ) {
        throw new BadRequestException(
          'File signature mismatch: file with .pdf extension does not contain valid PDF magic header',
        );
      }
    } else if (ext === '.docx') {
      this.validateDocxStructure(buffer);
    } else if (ext === '.txt' || ext === '.md') {
      // Complete UTF-8 validation
      try {
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        if (decoded.includes('\0')) {
          throw new BadRequestException(
            `File validation error: ${ext} files must contain valid text and no binary control characters`,
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(
          `File validation error: ${ext} files must contain valid UTF-8 text`,
        );
      }

      // Check first 1024 bytes for binary control characters
      const checkLength = Math.min(buffer.length, 1024);
      for (let i = 0; i < checkLength; i++) {
        const byte = buffer[i];
        if (
          byte === 0x00 ||
          (byte < 0x09 && byte > 0x00) ||
          byte === 0x0b ||
          byte === 0x0c ||
          (byte >= 0x0e && byte <= 0x1f)
        ) {
          throw new BadRequestException(
            `File validation error: ${ext} files must contain valid text and no binary control characters`,
          );
        }
      }
    }
  }

  /**
   * Validates DOCX internal archive structure:
   * - Must start with PK\x03\x04
   * - Must contain word/document.xml entry
   * - Enforces max decompressed size to prevent zip bomb attacks
   */
  public static validateDocxStructure(buffer: Buffer): void {
    if (
      buffer.length < 30 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4B ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      throw new BadRequestException(
        'File signature mismatch: file with .docx extension does not contain valid Office Open XML (ZIP) header',
      );
    }

    let foundWordDocumentXml = false;
    let totalUncompressedSize = 0;
    const MAX_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB decompressed limit

    // 1. Check for End of Central Directory Record (EOCD: 0x06054b50)
    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
      if (
        buffer[i] === 0x50 &&
        buffer[i + 1] === 0x4b &&
        buffer[i + 2] === 0x05 &&
        buffer[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset !== -1) {
      const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
      const cdTotalEntries = buffer.readUInt16LE(eocdOffset + 10);
      let ptr = cdOffset;

      for (let i = 0; i < cdTotalEntries && ptr + 46 <= buffer.length; i++) {
        if (buffer.readUInt32LE(ptr) !== 0x02014b50) {
          break;
        }
        const uncompressedSize = buffer.readUInt32LE(ptr + 24);
        const fileNameLength = buffer.readUInt16LE(ptr + 28);
        const extraFieldLength = buffer.readUInt16LE(ptr + 30);
        const fileCommentLength = buffer.readUInt16LE(ptr + 32);

        totalUncompressedSize += uncompressedSize;
        if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
          throw new BadRequestException(
            'DOCX rejected: decompressed archive size exceeds 50MB safety limit (zip bomb protection)',
          );
        }

        const fileNameStart = ptr + 46;
        if (fileNameStart + fileNameLength <= buffer.length) {
          const entryName = buffer.toString('utf8', fileNameStart, fileNameStart + fileNameLength);
          if (entryName === 'word/document.xml' || entryName === 'word\\document.xml') {
            foundWordDocumentXml = true;
          }
        }

        ptr += 46 + fileNameLength + extraFieldLength + fileCommentLength;
      }
    } else {
      // Fallback: Scan local file headers (0x04034b50)
      let offset = 0;
      while (offset + 30 <= buffer.length) {
        if (
          buffer[offset] !== 0x50 ||
          buffer[offset + 1] !== 0x4b ||
          buffer[offset + 2] !== 0x03 ||
          buffer[offset + 3] !== 0x04
        ) {
          break;
        }

        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        totalUncompressedSize += uncompressedSize;
        if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
          throw new BadRequestException(
            'DOCX rejected: decompressed archive size exceeds 50MB safety limit (zip bomb protection)',
          );
        }

        const fileNameStart = offset + 30;
        if (fileNameStart + fileNameLength <= buffer.length) {
          const entryName = buffer.toString('utf8', fileNameStart, fileNameStart + fileNameLength);
          if (entryName === 'word/document.xml' || entryName === 'word\\document.xml') {
            foundWordDocumentXml = true;
          }
        }

        offset += 30 + fileNameLength + extraFieldLength + compressedSize;
      }
    }

    if (!foundWordDocumentXml) {
      throw new BadRequestException(
        'Invalid DOCX file: archive missing required word/document.xml component',
      );
    }
  }
}
