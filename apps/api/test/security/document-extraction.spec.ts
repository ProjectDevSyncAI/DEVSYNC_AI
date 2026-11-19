/**
 * Document Extraction Service Test Suite
 * Milestone 4B.7 Phase 2
 *
 * Verifies text extraction engine across all 4 supported document types:
 * - PDF (pdf-parse)
 * - DOCX (mammoth)
 * - TXT & MD (UTF-8, line ending normalization, null byte removal)
 * - Robust error handling (empty, corrupt, missing, unsupported)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { BadRequestException } from '@nestjs/common';
import { DocumentExtractionService } from '../../src/documents/extraction/document-extraction.service.js';

function crc32(buf: Buffer): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createMinimalDocxBuffer(xmlContent: string): Buffer {
  const entries = [
    {
      name: 'word/document.xml',
      data: Buffer.from(xmlContent, 'utf8'),
    },
  ];

  const parts: Buffer[] = [];
  const cdParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = entry.data;
    const crc = crc32(dataBuf);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBuf.length, 18);
    local.writeUInt32LE(dataBuf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    parts.push(local, nameBuf, dataBuf);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(dataBuf.length, 20);
    cd.writeUInt32LE(dataBuf.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);

    cdParts.push(cd, nameBuf);
    offset += local.length + nameBuf.length + dataBuf.length;
  }

  const cdBuf = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, cdBuf, eocd]);
}

function createMinimalPdfBuffer(textContent: string): Buffer {
  const contentStream = `BT /F1 12 Tf 72 712 Td (${textContent}) Tj ET`;
  return Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000336 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
417
%%EOF`,
  );
}

test('Extraction [1] - Plain text extraction normalizes CRLF and counts words', async () => {
  const service = new DocumentExtractionService();
  const textBuffer = Buffer.from('Line 1 of architecture document.\r\nLine 2 of specification.\r\n\r\nParagraph 2.');
  const result = await service.extractFromBuffer(textBuffer, 'text/plain');

  assert.ok(result.text.includes('Line 1 of architecture document.'));
  assert.ok(result.text.includes('\nLine 2'));
  assert.ok(!result.text.includes('\r\n'), 'CRLF must be normalized to LF');
  assert.equal(result.metadata.mimeType, 'text/plain');
  assert.ok(result.metadata.wordCount > 5);
  assert.equal(result.metadata.charCount, result.text.length);
});

test('Extraction [2] - Markdown extraction preserves document headings and structure', async () => {
  const service = new DocumentExtractionService();
  const mdBuffer = Buffer.from('# Architecture Guide\n\n## Subheading\n\n- Point 1\n- Point 2');
  const result = await service.extractFromBuffer(mdBuffer, 'text/markdown');

  assert.ok(result.text.startsWith('# Architecture Guide'));
  assert.ok(result.text.includes('## Subheading'));
  assert.equal(result.metadata.mimeType, 'text/markdown');
});

test('Extraction [3] - Strips null bytes from text content', async () => {
  const service = new DocumentExtractionService();
  const dirtyBuffer = Buffer.from('Safe text with \0 embedded null bytes \0 stripped out.');
  const result = await service.extractFromBuffer(dirtyBuffer, 'text/plain');

  assert.ok(!result.text.includes('\0'), 'Null bytes must be completely stripped');
  assert.ok(result.text.includes('Safe text with embedded null bytes stripped out.'));
});

test('Extraction [4] - PDF text extraction retrieves content and page count', async () => {
  const service = new DocumentExtractionService();
  const pdfBuffer = createMinimalPdfBuffer('DevSync AI Autonomous Architecture');
  const result = await service.extractFromBuffer(pdfBuffer, 'application/pdf');

  assert.ok(result.text.includes('DevSync AI Autonomous Architecture'));
  assert.equal(result.metadata.pageCount, 1);
  assert.equal(result.metadata.mimeType, 'application/pdf');
});

test('Extraction [5] - DOCX text extraction parses WordprocessingML XML', async () => {
  const service = new DocumentExtractionService();
  const docxXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DevSync OpenXML Test Document Body</w:t></w:r></w:p></w:body></w:document>';
  const docxBuffer = createMinimalDocxBuffer(docxXml);
  const result = await service.extractFromBuffer(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  assert.ok(result.text.includes('DevSync OpenXML Test Document Body'));
  assert.ok(result.metadata.wordCount >= 5);
});

test('Extraction [6] - Empty file buffer throws BadRequestException', async () => {
  const service = new DocumentExtractionService();
  await assert.rejects(
    () => service.extractFromBuffer(Buffer.alloc(0), 'text/plain'),
    (err: any) => err instanceof BadRequestException && err.message.includes('empty'),
  );
});

test('Extraction [7] - Corrupted PDF throws BadRequestException', async () => {
  const service = new DocumentExtractionService();
  const badPdf = Buffer.from('%PDF-1.4\nCorrupted binary noise without valid xref table');
  await assert.rejects(
    () => service.extractFromBuffer(badPdf, 'application/pdf'),
    (err: any) => err instanceof BadRequestException && err.message.includes('PDF'),
  );
});

test('Extraction [8] - Unsupported MIME type throws BadRequestException', async () => {
  const service = new DocumentExtractionService();
  await assert.rejects(
    () => service.extractFromBuffer(Buffer.from('binary data'), 'application/x-executable'),
    (err: any) => err instanceof BadRequestException && err.message.includes('Unsupported MIME type'),
  );
});

test('Extraction [9] - Filesystem extractDocument reads file from path', async () => {
  const service = new DocumentExtractionService();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devsync-extract-test-'));
  const filePath = path.join(tmpDir, 'test-doc.txt');

  try {
    await fs.writeFile(filePath, 'Hello from physical file on disk for extraction test.');
    const result = await service.extractDocument(filePath, 'text/plain');

    assert.equal(result.text, 'Hello from physical file on disk for extraction test.');
    assert.equal(result.metadata.wordCount, 9);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  }
});

test('Extraction [10] - Non-existent physical file throws BadRequestException', async () => {
  const service = new DocumentExtractionService();
  await assert.rejects(
    () => service.extractDocument('C:/non-existent-file-path-12345.pdf', 'application/pdf'),
    (err: any) => err instanceof BadRequestException && err.message.includes('not found'),
  );
});
