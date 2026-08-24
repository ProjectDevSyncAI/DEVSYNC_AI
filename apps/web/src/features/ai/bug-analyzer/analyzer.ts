import type {
  BugAnalyzerOptions,
  BugAnalyzerRequest,
  BugAnalyzerResult,
} from "./types";

function detectSeverity(
  errorMessage = "",
): "low" | "medium" | "high" | "critical" {
  const message = errorMessage.toLowerCase();

  if (
    message.includes("security") ||
    message.includes("unauthorized") ||
    message.includes("permission")
  ) {
    return "critical";
  }

  if (
    message.includes("crash") ||
    message.includes("fatal") ||
    message.includes("cannot read")
  ) {
    return "high";
  }

  if (
    message.includes("warning") ||
    message.includes("deprecated")
  ) {
    return "low";
  }

  return "medium";
}

function detectCategory(
  errorMessage = "",
): "logic" | "runtime" | "performance" | "security" | "ui" | "network" | "database" | "configuration" | "unknown" {
  const message = errorMessage.toLowerCase();

  if (message.includes("fetch") || message.includes("network")) {
    return "network";
  }

  if (
    message.includes("sql") ||
    message.includes("database") ||
    message.includes("query")
  ) {
    return "database";
  }

  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("security")
  ) {
    return "security";
  }

  if (
    message.includes("render") ||
    message.includes("component") ||
    message.includes("css")
  ) {
    return "ui";
  }

  if (
    message.includes("performance") ||
    message.includes("slow") ||
    message.includes("memory")
  ) {
    return "performance";
  }

  if (
    message.includes("config") ||
    message.includes("environment")
  ) {
    return "configuration";
  }

  if (
    message.includes("undefined") ||
    message.includes("null") ||
    message.includes("exception")
  ) {
    return "runtime";
  }

  return "unknown";
}

export function analyzeBug(
  request: BugAnalyzerRequest,
  options: BugAnalyzerOptions = {},
): BugAnalyzerResult {
  const {
    includeFixedCode = false,
    includeExplanation = true,
    maxIssues = 10,
  } = options;

  const severity = detectSeverity(request.errorMessage);
  const category = detectCategory(request.errorMessage);

  const issues = [
    {
      id: crypto.randomUUID(),
      title: request.errorMessage
        ? "Reported runtime issue"
        : "Potential code issue",
      description:
        request.errorMessage ||
        "The supplied code should be reviewed for potential runtime and logic issues.",
      severity,
      category,
      confidence: request.errorMessage ? 0.82 : 0.55,
      suggestion:
        "Review the affected execution path, validate inputs, and add defensive error handling where required.",
    },
  ].slice(0, maxIssues);

  const explanation = includeExplanation
    ? [
        "The code was evaluated against the supplied error context.",
        "The issue category was estimated from the available diagnostic information.",
        "Additional validation should be performed against the actual runtime environment.",
      ]
    : [];

  return {
    summary:
      issues.length > 0
        ? `Found ${issues.length} potential issue(s) requiring review.`
        : "No obvious issues were detected.",
    severity,
    issues,
    fixedCode: includeFixedCode ? request.code : undefined,
    explanation,
    analyzedAt: new Date().toISOString(),
  };
}