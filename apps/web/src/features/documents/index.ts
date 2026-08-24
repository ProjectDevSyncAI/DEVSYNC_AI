export type DocumentType =
  | "markdown"
  | "text"
  | "pdf"
  | "word"
  | "spreadsheet"
  | "other";

export interface DocumentItem {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  size: number;
  projectId?: string;
  ownerId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  projectId?: string;
  createdAt: string;
}

export interface DocumentSearchResult {
  document: DocumentItem;
  score: number;
  matches: string[];
}

export function getDocumentExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
}

export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;

  return `${(mb / 1024).toFixed(1)} GB`;
}