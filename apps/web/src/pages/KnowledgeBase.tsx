import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Upload,
  Trash2,
  File,
  Loader2,
} from "lucide-react";
import { documentsApi, type DocumentItem as ApiDocumentItem } from "../lib/api";
import { useProjectStore } from "../store/project.store";

interface DocumentViewItem {
  id: string;
  title: string;
  sourceType: string;
  content: string;
  tokenCount: number;
  chunksCount: number;
  indexingStatus: 'INDEXED' | 'PROCESSING' | 'FAILED' | 'PENDING' | 'ENQUEUE_FAILED';
  indexedAt: string;
  originalFilename?: string;
  fileSize?: number;
}

export default function KnowledgeBase() {
  const { activeProject, projects } = useProjectStore();
  const [documents, setDocuments] = useState<DocumentViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"upload" | "text">("upload");

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState("DOCUMENTATION");

  // Status & Error State
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default project on mount or when activeProject changes
  useEffect(() => {
    if (activeProject?.id) {
      setSelectedProjectId(activeProject.id);
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeProject, projects]);

  // Load documents from API when activeProject changes
  useEffect(() => {
    let isMounted = true;
    if (activeProject?.id) {
      setIsLoading(true);
      setErrorMsg("");
      setDocuments([]); // Immediately clear previous project's documents

      documentsApi
        .findAll(activeProject.id)
        .then((items) => {
          if (!isMounted) return;
          setIsLoading(false);
          if (!Array.isArray(items) || items.length === 0) {
            setDocuments([]);
            return;
          }
          const mapped: DocumentViewItem[] = items.map((d: ApiDocumentItem) => ({
            id: d.id,
            title: d.title,
            sourceType: d.sourceType || "DOCUMENTATION",
            content: d.content || d.metadata?.originalFilename || "No preview available",
            tokenCount: (d.metadata?.tokenCount as number | undefined) ?? Math.ceil((d.content?.length || 100) / 4),
            chunksCount: (d.metadata?.chunkCount as number | undefined) ?? (d.indexedAt ? 1 : 0),
            indexingStatus: ((d.metadata?.status as DocumentViewItem["indexingStatus"]) ?? (d.indexedAt ? "INDEXED" : "PENDING")),
            indexedAt: d.indexedAt
              ? new Date(d.indexedAt).toLocaleDateString()
              : "Pending Indexing",
            originalFilename: d.metadata?.originalFilename,
            fileSize: d.metadata?.fileSize,
          }));
          setDocuments(mapped);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          setIsLoading(false);
          setDocuments([]);
          setErrorMsg(err?.message || "Failed to load project documents.");
        });
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [activeProject?.id]);

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      (d.originalFilename && d.originalFilename.toLowerCase().includes(search.toLowerCase())),
  );

  function resetForm() {
    setSelectedFile(null);
    setTitle("");
    setContent("");
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const targetProject = selectedProjectId || activeProject?.id;
    if (!targetProject) {
      setErrorMsg("Please select a project before uploading.");
      return;
    }

    if (!selectedFile) {
      setErrorMsg("Please choose a file to upload (.pdf, .docx, .txt, .md).");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedDoc = await documentsApi.upload(
        targetProject,
        selectedFile,
        title.trim() || undefined,
      );

      const newItem: DocumentViewItem = {
        id: uploadedDoc.id,
        title: uploadedDoc.title,
        sourceType: uploadedDoc.sourceType || "DOCUMENTATION",
        content: `File: ${uploadedDoc.metadata?.originalFilename || selectedFile.name}`,
        tokenCount: Math.ceil(selectedFile.size / 4),
        chunksCount: 0,
        indexingStatus: "PENDING",
        indexedAt: "Uploaded (Pending Indexing)",
        originalFilename: uploadedDoc.metadata?.originalFilename || selectedFile.name,
        fileSize: uploadedDoc.metadata?.fileSize || selectedFile.size,
      };

      setDocuments((prev) => [newItem, ...prev]);
      setShowAddModal(false);
      resetForm();
      setSuccessMsg(`File "${selectedFile.name}" successfully uploaded and saved to storage.`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDoc(id: string) {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentsApi.delete(id);
    } catch {
      // Local removal regardless if using mock or real
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSuccessMsg("Document deleted.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen size={15} />
            <span>Project Knowledge Base & Storage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Technical Documentation & Files
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload PDF, DOCX, TXT, or Markdown documents with mandatory project isolation.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title, file name, or content..."
            className="w-full rounded-xl border border-slate-800 bg-[#0b0f19] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400">
          <Layers size={16} className="text-indigo-400" />
          <span>
            <strong className="text-white">{documents.length}</strong> Documents in Project
          </span>
        </div>
      </div>

      {/* Documents Grid / Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-14 rounded-2xl border border-slate-800 bg-[#0d121f]">
          <Loader2 size={24} className="animate-spin text-indigo-400 mb-2" />
          <span className="text-xs text-slate-400">Loading project documents...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0d121f]/50">
          <BookOpen size={36} className="text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No documents found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {search
              ? "No documents match your search criteria. Try a different query."
              : activeProject
              ? `No technical documentation has been uploaded to ${activeProject.name} yet.`
              : "Select an active project to view and upload documentation."}
          </p>
          {activeProject && !search && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition"
            >
              <Upload size={14} />
              <span>Upload First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d121f] p-5 hover:border-slate-700 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase">
                    {doc.sourceType}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar size={11} />
                      {doc.indexedAt}
                    </span>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      title="Delete document"
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-white group-hover:text-indigo-300 transition line-clamp-1">
                  {doc.title}
                </h3>

                {doc.originalFilename && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-400/80">
                    <File size={12} />
                    <span className="truncate">{doc.originalFilename}</span>
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {doc.content}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles size={12} className="text-indigo-400" />
                  {doc.chunksCount > 0 ? `${doc.chunksCount} chunks` : "Pending Indexing"}
                </span>
                <span className="flex items-center gap-1.5">
                  {doc.indexingStatus === "INDEXED" && (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold">
                      Indexed
                    </span>
                  )}
                  {doc.indexingStatus === "PROCESSING" && (
                    <span className="rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 text-[10px] font-semibold animate-pulse">
                      Processing…
                    </span>
                  )}
                  {doc.indexingStatus === "FAILED" && (
                    <span className="rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 text-[10px] font-semibold">
                      Failed
                    </span>
                  )}
                  {doc.indexingStatus === "ENQUEUE_FAILED" && (
                    <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold">
                      Queue Error
                    </span>
                  )}
                  {(!doc.indexingStatus || doc.indexingStatus === "PENDING") && doc.chunksCount === 0 && (
                    <span className="rounded-full bg-slate-700/50 text-slate-400 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold">
                      Queued
                    </span>
                  )}
                  <span className="text-slate-400 font-mono">
                    {doc.fileSize
                      ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                      : `~${doc.tokenCount} tokens`}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d121f] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-indigo-400" />
                <h3 className="font-bold text-base">Upload Document File</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isUploading}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Project <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={isUploading}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                  {/* Fallback if activeProject is set but not in projects list */}
                  {activeProject && !projects.some((p) => p.id === activeProject.id) && (
                    <option value={activeProject.id}>
                      {activeProject.name} ({activeProject.key})
                    </option>
                  )}
                </select>
              </div>

              {/* File Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document File <span className="text-rose-400">*</span> (.pdf, .docx, .txt, .md, max 10MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.docx,.txt,.md"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f && !title) {
                      setTitle(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  disabled={isUploading}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Architecture Security Specification"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
