import { useState } from "react";
import {
  Rocket,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  Calendar,
  Tag,
  Copy,
  Download,
  Plus,
} from "lucide-react";

interface ReleaseItem {
  version: string;
  title: string;
  date: string;
  status: "LATEST" | "PREVIOUS";
  highlights: string[];
  pullRequestsCount: number;
}

const mockReleases: ReleaseItem[] = [
  {
    version: "v1.2.0",
    title: "AI Project Intelligence & Real-time Collaboration",
    date: "October 31, 2026",
    status: "LATEST",
    highlights: [
      "Integrated RAG pipeline with 1536-dimensional pgvector semantic retrieval.",
      "Added Slack-style real-time WebSocket chat channels with `@devsync` assistant prompts.",
      "Fixed JWT authentication expiry handshake in WebSocket gateway.",
      "Connected Jira-style Kanban board tasks with optimistic UI updates.",
    ],
    pullRequestsCount: 8,
  },
  {
    version: "v1.1.0",
    title: "Multi-tenant Organizations & Sprint Engine",
    date: "October 18, 2026",
    status: "PREVIOUS",
    highlights: [
      "Added Organization multi-tenancy and team member role permissions.",
      "Introduced Sprint Planner with velocity tracking and risk scoring.",
      "Added support for GitHub webhook events ingestion.",
    ],
    pullRequestsCount: 12,
  },
];

export default function ReleaseManagement() {
  const [releases, setReleases] = useState<ReleaseItem[]>(mockReleases);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  function handleCopyNotes(index: number, release: ReleaseItem) {
    const text = `## DevSync AI ${release.version} - ${release.title}\nReleased: ${release.date}\n\n### Highlights:\n${release.highlights.map((h) => `- ${h}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  }

  function handleGenerateNewRelease() {
    setIsGenerating(true);
    setTimeout(() => {
      const newRelease: ReleaseItem = {
        version: "v1.3.0",
        title: draftTitle || "Upcoming Sprint Features & Bug Fixes",
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        status: "LATEST",
        highlights: [
          "Summarized 6 closed tickets and 4 merged pull requests.",
          "Resolved critical token refresh race condition on connection drop.",
          "Optimized pgvector cosine search index with IVFFlat ordering.",
        ],
        pullRequestsCount: 4,
      };

      setReleases((prev) => [
        newRelease,
        ...prev.map((r) => ({ ...r, status: "PREVIOUS" as const })),
      ]);
      setIsGenerating(false);
      setShowGenerateModal(false);
      setDraftTitle("");
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Rocket size={15} />
            <span>Deployment & Delivery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Release Notes & Changelog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AI-generated changelogs synthesized from merged PRs, resolved tickets, and git commits.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Sparkles size={16} />
          <span>Generate Release Notes</span>
        </button>
      </div>

      {/* Releases Feed */}
      <div className="space-y-6">
        {releases.map((release, idx) => (
          <div
            key={release.version}
            className="rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-xl">
                  <Tag size={13} />
                  {release.version}
                </span>
                <h2 className="text-base font-bold text-white">{release.title}</h2>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {release.date}
                </span>

                <button
                  onClick={() => handleCopyNotes(idx, release)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
                  title="Copy Markdown"
                >
                  <Copy size={14} />
                  <span className="text-[11px]">{copiedIndex === idx ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Improvements & Fixes
              </h3>
              <ul className="space-y-1.5">
                {release.highlights.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <GitPullRequest size={13} className="text-indigo-400" />
              <span>Synthesized from {release.pullRequestsCount} pull requests</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white shadow-2xl">
            <h3 className="font-bold text-base mb-2">Synthesize Release Notes</h3>
            <p className="text-xs text-slate-400 mb-4">
              DevSync AI will scan the repository for recent commits, merged PRs, and resolved bugs to draft release notes.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Release Title / Milestone
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g. Sprint 2 Feature Pack"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateNewRelease}
                disabled={isGenerating}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>{isGenerating ? "Analyzing Repository..." : "Generate Notes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
