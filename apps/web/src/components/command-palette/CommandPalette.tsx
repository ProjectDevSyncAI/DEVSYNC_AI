import {
  ArrowRight,
  Command,
  FolderKanban,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  SquareCheckBig,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Search;
  keywords: string[];
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (destination: string) => void;
}

export default function CommandPalette({
  open,
  onClose,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const navigate = (destination: string) => {
    onNavigate?.(destination);
    onClose();
  };

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: "dashboard",
        label: "Open Dashboard",
        description: "View your workspace overview",
        icon: LayoutDashboard,
        keywords: ["home", "overview"],
        action: () => navigate("/dashboard"),
      },
      {
        id: "projects",
        label: "Open Projects",
        description: "Browse and manage projects",
        icon: FolderKanban,
        keywords: ["project", "workspace"],
        action: () => navigate("/projects"),
      },
      {
        id: "tasks",
        label: "Open My Tasks",
        description: "View your assigned work",
        icon: SquareCheckBig,
        keywords: ["tasks", "todo", "work"],
        action: () => navigate("/tasks"),
      },
      {
        id: "ai",
        label: "Ask DevSync AI",
        description: "Open the AI workspace",
        icon: Sparkles,
        keywords: ["assistant", "chat", "copilot"],
        action: () => navigate("/ai"),
      },
      {
        id: "settings",
        label: "Open Settings",
        description: "Manage workspace preferences",
        icon: Settings,
        keywords: ["preferences", "configuration"],
        action: () => navigate("/settings"),
      },
    ],
    [onNavigate],
  );

  const filteredCommands = commands.filter((command) => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return [
      command.label,
      command.description,
      ...command.keywords,
    ]
      .join(" ")
      .toLowerCase()
      .includes(value);
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d1a] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search className="h-5 w-5 shrink-0 text-slate-500" />

          <input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search commands..."
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Command className="h-6 w-6 text-slate-600" />

              <p className="mt-3 text-sm font-medium text-slate-300">
                No commands found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Try a different search term.
              </p>
            </div>
          ) : (
            filteredCommands.map((command) => {
              const Icon = command.icon;

              return (
                <button
                  key={command.id}
                  type="button"
                  onClick={command.action}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-indigo-500/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-300">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">
                      {command.label}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {command.description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="rounded border border-white/10 px-1.5 py-0.5">
              ESC
            </span>
            Close
          </div>

          <span className="text-[10px] text-slate-600">
            DevSync AI Command Center
          </span>
        </div>
      </div>
    </div>
  );
}