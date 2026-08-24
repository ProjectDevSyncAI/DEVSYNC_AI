import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Bug,
  ChevronDown,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import MyTasks from "./pages/MyTasks";
import SprintPlanner from "./pages/SprintPlanner";
import Standup from "./pages/Standup";
import Risks from "./pages/Risks";
import ProjectDetail from "./pages/ProjectDetail";





type Page =
  | "dashboard"
  | "projects"
  | "tasks"
  | "insights"
  | "risks"
  | "sprint"
  | "standup"
  | "bugs"
  | "release"
  | "knowledge"
  | "team"
  | "settings";

const navigation = [
  {
    label: "Workspace",
    items: [
      {
        id: "dashboard" as Page,
        label: "Overview",
        icon: LayoutDashboard,
      },
      {
        id: "projects" as Page,
        label: "Projects",
        icon: FolderKanban,
      },
      {
        id: "tasks" as Page,
        label: "My Tasks",
        icon: Target,
      },
      {
        id: "team" as Page,
        label: "Team",
        icon: Users,
      },
    ],
  },
  {
    label: "AI Command Center",
    items: [
      {
        id: "insights" as Page,
        label: "AI Insights",
        icon: Sparkles,
      },
      {
        id: "risks" as Page,
        label: "Risk Engine",
        icon: ShieldAlert,
      },
      {
        id: "sprint" as Page,
        label: "Sprint Planner",
        icon: Rocket,
      },
      {
        id: "standup" as Page,
        label: "AI Standup",
        icon: MessageSquare,
      },
      {
        id: "bugs" as Page,
        label: "Bug Analyzer",
        icon: Bug,
      },
      {
        id: "release" as Page,
        label: "Release Notes",
        icon: FileText,
      },
      {
        id: "knowledge" as Page,
        label: "Knowledge Base",
        icon: Brain,
      },
    ],
  },
];

function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm text-violet-400">
          <Sparkles size={15} />
          AI Workspace
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-slate-400">
          {description}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          "AI-powered analysis",
          "Real-time project intelligence",
          "Smart recommendations",
        ].map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Icon size={21} />
            </div>

            <h3 className="font-semibold text-white">{item}</h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Intelligent workspace functionality will appear here.
            </p>

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${45 + index * 18}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const currentItem = navigation
    .flatMap((section) => section.items)
    .find((item) => item.id === activePage);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;

      case "projects":
        return <Projects />;

      case "tasks":
        return <MyTasks />;

      case "insights":
        return (
          <PlaceholderPage
            title="AI Insights"
            description="Turn project activity into clear, actionable intelligence."
            icon={Sparkles}
          />
        );

      case "risks":
        return (
          <PlaceholderPage
            title="Risk Engine"
            description="Detect project risks before they become blockers."
            icon={ShieldAlert}
          />
        );

      case "sprint":
        return (
          <PlaceholderPage
            title="Sprint Planner"
            description="Let AI analyse workload, priorities and capacity to build better sprints."
            icon={Rocket}
          />
        );

      case "standup":
        return (
          <PlaceholderPage
            title="AI Standup"
            description="Generate intelligent daily standups from project activity, commits and tasks."
            icon={MessageSquare}
          />
        );

      case "bugs":
        return (
          <PlaceholderPage
            title="Bug Analyzer"
            description="Understand bugs faster with AI-powered analysis and contextual recommendations."
            icon={Bug}
          />
        );

      case "release":
        return (
          <PlaceholderPage
            title="Release Notes"
            description="Automatically transform engineering activity into professional release notes."
            icon={FileText}
          />
        );

      case "knowledge":
        return (
          <PlaceholderPage
            title="Knowledge Base"
            description="Search your project's documentation and knowledge using AI-powered retrieval."
            icon={Brain}
          />
        );

      case "team":
        return (
          <PlaceholderPage
            title="Team Intelligence"
            description="Understand collaboration, workload and productivity across your team."
            icon={Users}
          />
        );

      case "settings":
        return (
          <PlaceholderPage
            title="Workspace Settings"
            description="Configure your DevSync AI workspace."
            icon={Settings}
          />
        );

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-slate-100">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {mobileOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#0a0a0f]/95 backdrop-blur-xl transition-all duration-300 lg:relative lg:z-auto",
            collapsed ? "w-[82px]" : "w-[270px]",
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          {/* Logo */}
          <div
            className={[
              "flex h-[76px] items-center border-b border-white/[0.07] px-5",
              collapsed ? "justify-center" : "justify-between",
            ].join(" ")}
          >
            <button
              onClick={() => setActivePage("dashboard")}
              className="flex items-center gap-3"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                <Zap size={20} fill="currentColor" />
              </div>

              {!collapsed && (
                <div className="text-left">
                  <div className="text-[16px] font-bold tracking-tight text-white">
                    DevSync
                    <span className="text-violet-400"> AI</span>
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Engineering Intelligence
                  </div>
                </div>
              )}
            </button>

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white lg:block"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="mx-auto mt-4 rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}

          {/* Workspace */}
          <div className="px-4 pt-5">
            {!collapsed && (
              <button className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left hover:bg-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
                    D
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-white">
                      DevSync Workspace
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Engineering Team
                    </div>
                  </div>
                </div>

                <ChevronDown size={14} className="text-slate-500" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-6">
            {navigation.map((section) => (
              <div key={section.label} className="mb-7">
                {!collapsed && (
                  <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {section.label}
                  </div>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = activePage === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActivePage(item.id);
                          setMobileOpen(false);
                        }}
                        title={collapsed ? item.label : undefined}
                        className={[
                          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                          collapsed ? "justify-center" : "",
                          active
                            ? "bg-violet-500/10 text-white shadow-[inset_2px_0_0_#8b5cf6]"
                            : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                        ].join(" ")}
                      >
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-violet-400"
                              : "text-slate-600 group-hover:text-slate-300"
                          }
                        />

                        {!collapsed && <span>{item.label}</span>}

                        {!collapsed && item.id === "risks" && (
                          <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400">
                            3
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div className="border-t border-white/[0.07] p-3">
            <button
              onClick={() => setActivePage("settings")}
              title={collapsed ? "Settings" : undefined}
              className={[
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-white/[0.04] hover:text-white",
                collapsed ? "justify-center" : "",
              ].join(" ")}
            >
              <Settings size={18} />
              {!collapsed && "Settings"}
            </button>

            <div
              className={[
                "mt-3 flex items-center rounded-xl border border-white/[0.07] bg-white/[0.025] p-2",
                collapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-xs font-bold">
                D
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">
                    Developer
                  </div>
                  <div className="truncate text-[10px] text-slate-600">
                    Admin
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#07070b]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-white/[0.08] p-2 text-slate-400 hover:text-white lg:hidden"
              >
                <Menu size={19} />
              </button>

              <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-slate-300">
                  {currentItem?.label ?? "Overview"}
                </span>
              </div>

              <div className="sm:hidden">
                <div className="text-sm font-semibold text-white">
                  {currentItem?.label ?? "Overview"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-slate-500 hover:text-white md:flex"
              >
                <Search size={15} />
                Search
                <kbd className="ml-4 rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px]">
                  ⌘ K
                </kbd>
              </button>

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-xl border border-white/[0.07] p-2.5 text-slate-500 hover:text-white md:hidden"
              >
                <Search size={17} />
              </button>

              <button className="relative rounded-xl border border-white/[0.07] p-2.5 text-slate-500 hover:text-white">
                <Activity size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>

              <button className="rounded-xl border border-white/[0.07] p-2.5 text-slate-500 hover:text-white">
                <Bot size={17} />
              </button>
            </div>
          </header>

          {/* Search */}
          {searchOpen && (
            <div className="fixed inset-x-0 top-[76px] z-40 mx-auto max-w-2xl px-4">
              <div className="mt-3 rounded-2xl border border-white/[0.09] bg-[#111118] p-3 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-3 px-3">
                  <Search size={18} className="text-slate-500" />

                  <input
                    autoFocus
                    placeholder="Search projects, tasks, insights..."
                    className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />

                  <button onClick={() => setSearchOpen(false)}>
                    <X size={17} className="text-slate-600 hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-9">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;