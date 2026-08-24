export type ReleaseNoteCategory =
  | "feature"
  | "improvement"
  | "bugfix"
  | "security"
  | "breaking";

export interface ReleaseChange {
  id: string;
  title: string;
  description: string;
  category: ReleaseNoteCategory;
  issueKey?: string;
  pullRequestNumber?: number;
}

export interface ReleaseNotesRequest {
  version: string;
  changes: ReleaseChange[];
  releaseDate?: string;
  projectName?: string;
}

export interface ReleaseNotesResult {
  version: string;
  title: string;
  summary: string;
  sections: {
    category: ReleaseNoteCategory;
    title: string;
    changes: ReleaseChange[];
  }[];
  generatedAt: string;
}