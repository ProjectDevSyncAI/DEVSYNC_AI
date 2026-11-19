import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

export interface ExtractionMetadata {
  charCount: number;
  wordCount: number;
  pageCount?: number;
  mimeType: string;
}

export interface ExtractionResult {
  text: string;
  metadata: ExtractionMetadata;
}

@Injectable()
export class DocumentExtractionService {
  private readonly logger = new Logger(DocumentExtractionService.name);

  // Maximum file size in memory for extraction (30 MB)
  private readonly maxExtractionBytes = 30 * 1024 * 1024;

  /**
   * Extract plain text from supported document types (PDF, DOCX, TXT, MD)
   */
  async extractDocument(filePath: string, mimeType: string): Promise<ExtractionResult> {
    const stats = await fs.stat(filePath).catch((err) => {
      throw new BadRequestException(`Document file not found at ${filePath}: ${err.message}`);
    });

    if (stats.size === 0) {
      throw new BadRequestException('Document file is empty (0 bytes)');
    }

    if (stats.size > this.maxExtractionBytes) {
      throw new BadRequestException(
        `Document exceeds maximum extraction size limit of ${this.maxExtractionBytes / (1024 * 1024)}MB`,
      );
    }

    const buffer = await fs.readFile(filePath);
    return this.extractFromBuffer(buffer, mimeType);
  }

  /**
   * Extract plain text from buffer
   */
  async extractFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Buffer is empty (0 bytes)');
    }

    let rawText = '';
    let pageCount: number | undefined;

    switch (mimeType) {
      case 'application/pdf': {
        try {
          if (typeof pdfModule === 'function') {
            const pdfData = await pdfModule(buffer);
            rawText = pdfData.text || '';
            pageCount = pdfData.numpages;
          } else if (pdfModule?.PDFParse) {
            const parser = new pdfModule.PDFParse({ data: buffer });
            try {
              const textResult = await parser.getText();
              rawText = textResult?.text || '';
              pageCount = textResult?.total;
            } finally {
              if (typeof parser.destroy === 'function') {
                await parser.destroy().catch(() => null);
              }
            }
          } else {
            throw new Error('Unsupported pdf-parse module format');
          }
        } catch (err: any) {
          this.logger.error(`Failed to parse PDF document: ${err.message}`);
          throw new BadRequestException(`Failed to parse PDF document: ${err.message}`);
        }
        break;
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        try {
          const docxResult = await mammoth.extractRawText({ buffer });
          rawText = docxResult.value || '';
        } catch (err: any) {
          this.logger.error(`Failed to parse DOCX document: ${err.message}`);
          throw new BadRequestException(`Failed to parse DOCX document: ${err.message}`);
        }
        break;
      }

      case 'text/plain':
      case 'text/markdown': {
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          rawText = decoder.decode(buffer);
        } catch (err: any) {
          this.logger.error(`Failed to decode text document as UTF-8: ${err.message}`);
          throw new BadRequestException('Invalid UTF-8 encoding in text document');
        }
        break;
      }

      default:
        throw new BadRequestException(`Unsupported MIME type for text extraction: ${mimeType}`);
    }

    // Clean and normalize extracted text
    const cleanedText = this.normalizeExtractedText(rawText);

    if (!cleanedText.trim()) {
      throw new BadRequestException('Extracted document text is empty');
    }

    const wordCount = cleanedText.trim().split(/\s+/).filter(Boolean).length;
    const charCount = cleanedText.length;

    return {
      text: cleanedText,
      metadata: {
        charCount,
        wordCount,
        pageCount,
        mimeType,
      },
    };
  }

  /**
   * Normalize line endings, remove null bytes, and collapse excessive trailing whitespace
   */
  private normalizeExtractedText(text: string): string {
    return text
      .replace(/\0/g, '') // Strip null bytes
      .replace(/\r\n/g, '\n') // Normalize Windows CRLF to LF
      .replace(/\r/g, '\n') // Normalize old Mac CR to LF
      .replace(/[ \t]+/g, ' ') // Collapse multiple horizontal spaces to single space
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to at most 2
      .trim();
  }
}
