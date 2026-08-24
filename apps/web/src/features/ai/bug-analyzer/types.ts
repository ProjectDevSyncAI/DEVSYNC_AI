export type BugSeverity = "low" | "medium" | "high" | "critical";

export type BugCategory =
  | "logic"
  | "runtime"
  | "performance"
  | "security"
  | "ui"
  | "network"
  | "database"
  | "configuration"
  | "unknown";

export interface BugAnalyzerRequest {
  code: string;
  language?: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: string;
}

export interface BugIssue {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  category: BugCategory;
  line?: number;
  confidence: number;
  suggestion: string;
}

export interface BugAnalyzerResult {
  summary: string;
  severity: BugSeverity;
  issues: BugIssue[];
  fixedCode?: string;
  explanation: string[];
  analyzedAt: string;
}

export interface BugAnalyzerOptions {
  includeFixedCode?: boolean;
  includeExplanation?: boolean;
  maxIssues?: number;
}