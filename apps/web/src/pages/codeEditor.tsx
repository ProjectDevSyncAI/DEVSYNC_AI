
import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Play, Save, Plus, Folder, FileCode, Terminal,
  Bug, Sparkles, X, RefreshCw, ChevronDown,
  Code2, Maximize2, PanelLeftClose
} from "lucide-react";
import { bugAnalyzerApi } from "../lib/api";


type WorkspaceFile = {
  id: string;
  name: string;
  language: string;
  content: string;
};

const initialFiles: WorkspaceFile[] = [
  {
    id: "main",
    name: "main.js",
    language: "javascript",
    content: `// Welcome to DevSync AI IDE

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("DevSync AI Code Workspace");
console.log("Fibonacci:", fibonacci(8));
`
  },
  {
    id: "python",
    name: "main.py",
    language: "python",
    content: `def greet(name):
    return f"Hello, {name}!"

print(greet("DevSync AI"))
`
  }
];

const languages = [
  { label: "JavaScript", value: "javascript", extension: "js" },
  { label: "TypeScript", value: "typescript", extension: "ts" },
  { label: "Python", value: "python", extension: "py" },
  { label: "Java", value: "java", extension: "java" },
  { label: "C++", value: "cpp", extension: "cpp" },
  { label: "C", value: "c", extension: "c" },
  { label: "C#", value: "csharp", extension: "cs" },
  { label: "Go", value: "go", extension: "go" }
];

export default function CodeEditor() {
  const [files, setFiles] = useState(initialFiles);
  const [activeId, setActiveId] = useState("main");
  const [output, setOutput] = useState("Welcome to DevSync AI Terminal.");
  const [isRunning, setIsRunning] = useState(false);
  const [activePanel, setActivePanel] = useState<"terminal" | "problems">("terminal");
  const [showExplorer, setShowExplorer] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeFile = useMemo(
    () => files.find(file => file.id === activeId) ?? files[0],
    [files, activeId]
  );

  const updateContent = (content: string | undefined) => {
    setFiles(current =>
      current.map(file =>
        file.id === activeId ? { ...file, content: content ?? "" } : file
      )
    );
  };

  const changeLanguage = (language: string) => {
    setFiles(current =>
      current.map(file =>
        file.id === activeId ? { ...file, language } : file
      )
    );
  };

  const addFile = () => {
    const name = window.prompt("Enter a file name:", "new-file.js");
    if (!name) return;

    if (files.some(file => file.name.toLowerCase() === name.toLowerCase())) {
      window.alert("A file with this name already exists.");
      return;
    }

    const extension = name.split(".").pop()?.toLowerCase();
    const language =
      languages.find(item => item.extension === extension)?.value ?? "plaintext";

    const newFile = {
      id: crypto.randomUUID(),
      name,
      language,
      content: ""
    };

    setFiles(current => [...current, newFile]);
    setActiveId(newFile.id);
  };

  const saveWorkspace = () => {
    const blob = new Blob(
      [JSON.stringify(files, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "devsync-workspace.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setOutput("Workspace exported successfully.");
  };

  const runCode = async () => {
    if (!activeFile) return;

    setIsRunning(true);
    setActivePanel("terminal");
    setOutput("Preparing code execution...");

    try {
      const pistonLanguage: Record<string, string> = {
        javascript: "javascript",
        typescript: "typescript",
        python: "python",
        java: "java",
        cpp: "c++",
        c: "c",
        csharp: "csharp",
        go: "go"
      };

      const language = pistonLanguage[activeFile.language];

      if (!language) {
        throw new Error("Execution is not configured for this language.");
      }

      const response = await fetch(
        "https://emkc.org/api/v2/piston/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            version: "*",
            files: [{
              name: activeFile.name,
              content: activeFile.content
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Execution service returned HTTP ${response.status}`);
      }

      const result = await response.json();
      const stdout = result.run?.stdout ?? "";
      const stderr = result.run?.stderr ?? "";
      const compileOutput = result.compile?.output ?? "";
      const exitCode = result.run?.code;

      setOutput([
        stdout,
        stderr ? `ERROR:\n${stderr}` : "",
        compileOutput ? `COMPILER:\n${compileOutput}` : "",
        `\nProcess exited with code ${exitCode ?? "unknown"}.`
      ].filter(Boolean).join("\n"));
    } catch (error) {
      setOutput(
        `Execution failed:\n${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nCheck your internet connection and execution service availability.`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const analyzeCode = async () => {
  if (!activeFile) {
    setAiResponse("Please open a file before analysis.");
    return;
  }

  setIsAnalyzing(true);
  setAiResponse("");

  try {
    const description = `
Analyze this source code for bugs, security vulnerabilities,
performance issues, and code quality.

File: ${activeFile.name}
Language: ${activeFile.language}

USER INSTRUCTIONS:
${aiPrompt || "Perform a complete code review."}

SOURCE CODE:
${activeFile.content}

Return:
1. Bug summary
2. Severity (Critical, High, Medium, Low)
3. Root cause
4. Exact line or code section affected
5. Recommended fix
6. Corrected code
7. Security and performance recommendations
`;

    const result = await bugAnalyzerApi.analyze(description);

    setAiResponse(
      result.analysis || "No analysis was returned."
    );
  } catch (error) {
    setAiResponse(
      error instanceof Error
        ? error.message
        : "AI analysis failed."
    );
  } finally {
    setIsAnalyzing(false);
  }
};

  return (
    <div className="flex h-[calc(100vh-90px)] min-h-[650px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0b1020] text-slate-200">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-[#111827] px-4 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="text-blue-400" size={22} />
          <div>
            <h1 className="text-base font-bold">DevSync AI IDE</h1>
            <p className="text-xs text-slate-400">Developer Workspace</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveWorkspace}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"
          >
            <Save size={15} /> Export
          </button>
          <button
            onClick={() => setShowAiPanel(value => !value)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium hover:bg-purple-500"
          >
            <Sparkles size={15} /> AI Assistant
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="animate-spin" size={15} /> : <Play size={15} />}
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1">
        {/* File explorer */}
        {showExplorer && (
          <aside className="hidden w-56 shrink-0 border-r border-slate-700 bg-[#111827] md:block">
            <div className="flex items-center justify-between border-b border-slate-700 px-3 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Explorer
              </span>
              <button onClick={addFile} title="New file">
                <Plus size={17} />
              </button>
            </div>

            <div className="px-3 py-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ChevronDown size={14} />
                <Folder size={15} className="text-blue-400" />
                DEVSYNC-WORKSPACE
              </div>

              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveId(file.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    activeId === file.id
                      ? "bg-blue-500/20 text-blue-300"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <FileCode size={15} />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Editor and output */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-700 bg-[#111827]">
            <div className="flex min-w-0 items-center overflow-x-auto">
              <button
                className="px-3 py-3 text-slate-400 hover:text-white"
                onClick={() => setShowExplorer(value => !value)}
                title="Toggle explorer"
              >
                <PanelLeftClose size={16} />
              </button>
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveId(file.id)}
                  className={`flex shrink-0 items-center gap-2 border-r border-slate-700 px-4 py-3 text-sm ${
                    activeId === file.id
                      ? "border-b-2 border-b-blue-500 bg-[#0b1020] text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <FileCode size={14} />
                  {file.name}
                  {activeId === file.id && (
                    <X size={13} className="ml-1 opacity-40" />
                  )}
                </button>
              ))}
              <button onClick={addFile} className="px-3 text-slate-400 hover:text-white">
                <Plus size={16} />
              </button>
            </div>

            <div className="hidden items-center gap-2 px-3 sm:flex">
              <select
                value={activeFile?.language ?? "javascript"}
                onChange={event => changeLanguage(event.target.value)}
                className="max-w-36 rounded-md border border-slate-600 bg-[#111827] px-2 py-1.5 text-xs text-slate-200"
              >
                {languages.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monaco */}
          <div className="min-h-[300px] flex-1">
            {activeFile && (
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeFile.language}
                value={activeFile.content}
                onChange={updateContent}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  padding: { top: 16 },
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            )}
          </div>

          {/* Terminal */}
          <section className="h-52 shrink-0 border-t border-slate-700 bg-[#080d18]">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActivePanel("terminal")}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    activePanel === "terminal" ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  <Terminal size={15} /> TERMINAL
                </button>
                <button
                  onClick={() => setActivePanel("problems")}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    activePanel === "problems" ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  <Bug size={15} /> PROBLEMS
                </button>
              </div>
              <button
                onClick={() => setOutput("")}
                className="text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            </div>
            <pre className="h-[155px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-6 text-emerald-300">
              {activePanel === "terminal" ? output : "No editor diagnostics are currently available."}
            </pre>
          </section>
        </main>

        {/* AI panel */}
        {showAiPanel && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-700 bg-[#111827] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Sparkles size={17} className="text-purple-400" />
                AI Code Assistant
              </h2>
              <button onClick={() => setShowAiPanel(false)}>
                <X size={17} />
              </button>
            </div>

            <p className="mb-4 text-xs leading-5 text-slate-400">
              Analyze code, identify likely bugs and request improvement suggestions.
            </p>

            <textarea
              value={aiPrompt}
              onChange={event => setAiPrompt(event.target.value)}
              placeholder="What should I analyze? e.g. Find bugs, explain this function, suggest optimizations..."
              className="mb-3 min-h-28 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-3 text-sm outline-none focus:border-purple-500"
            />

            <button
              onClick={analyzeCode}
              disabled={isAnalyzing || !activeFile}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Current File"}
            </button>

            {aiResponse && (
              <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-700 bg-[#0b1020] p-3 text-xs leading-5 text-slate-300">
                {aiResponse}
              </pre>
            )}
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-slate-700 bg-[#111827] px-4 py-2 text-[11px] text-slate-500">
        <span>DevSync AI IDE · Local workspace</span>
        <span>{activeFile?.language ?? "No file"} · {activeFile?.name ?? ""}</span>
      </footer>
    </div>
  );
}
