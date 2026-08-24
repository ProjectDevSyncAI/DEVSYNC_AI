import type {
  ReleaseNotesRequest,
  ReleaseNotesResult,
  ReleaseNoteCategory,
} from "./types";

const categoryTitles: Record<
  ReleaseNoteCategory,
  string
> = {
  feature: "New Features",
  improvement: "Improvements",
  bugfix: "Bug Fixes",
  security: "Security",
  breaking: "Breaking Changes",
};

export function generateReleaseNotes(
  request: ReleaseNotesRequest,
): ReleaseNotesResult {
  const categories: ReleaseNoteCategory[] = [
    "feature",
    "improvement",
    "bugfix",
    "security",
    "breaking",
  ];

  const sections = categories
    .map((category) => ({
      category,
      title: categoryTitles[category],
      changes: request.changes.filter(
        (change) => change.category === category,
      ),
    }))
    .filter((section) => section.changes.length > 0);

  const projectPrefix = request.projectName
    ? `${request.projectName} `
    : "";

  return {
    version: request.version,
    title: `${projectPrefix}Release ${request.version}`,
    summary: `This release contains ${request.changes.length} documented change(s).`,
    sections,
    generatedAt: new Date().toISOString(),
  };
}

export function releaseNotesToMarkdown(
  result: ReleaseNotesResult,
): string {
  const lines: string[] = [
    `# ${result.title}`,
    "",
    result.summary,
    "",
  ];

  for (const section of result.sections) {
    lines.push(`## ${section.title}`, "");

    for (const change of section.changes) {
      const reference = change.issueKey
        ? ` (${change.issueKey})`
        : "";

      lines.push(
        `- **${change.title}**${reference} — ${change.description}`,
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}