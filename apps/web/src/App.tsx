
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  Bug,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Command,
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  LogOut,
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
import Team from "./pages/Team";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AIInsights from "./pages/AIInsights";
import RiskEngine from "./pages/Risks";
import SprintPlanner from "./pages/SprintPlanner";
import { clearAccessToken, getAccessToken } from "./lib/api";
import BugTracking from "./pages/BugTracking";

type PageId =
  | "dashboard"
  | "projects"
  | "tasks"
  | "team"
  | "insights"
  | "risks"
  | "sprint"
  | "standup"
  | "bugs"
  | "release"
  | "knowledge"
  | "settings";

type AuthPage = "login" | "register";

type CurrentUser = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
};

type NavItem = {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
  status?: "soon";
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    title: "WORKSPACE",
    items: [
      {
        id: "dashboard",
        label: "Overview",
        description: "Your workspace at a glance",
        icon: LayoutDashboard,
      },
      {
        id: "projects",
        label: "Projects",
        description: "Manage your projects",
        icon: FolderKanban,
      },
      {
        id: "tasks",
        label: "My Tasks",
        description: "Track your assignments",
        icon: CheckSquare,
      },
      {
        id: "team",
        label: "Team",
        description: "People and collaboration",
        icon: Users,
      },
    ],
  },
  {
    title: "AI COMMAND CENTER",
    items: [
      {
        id: "insights",
        label: "AI Insights",
        description: "Project intelligence",
        icon: BrainCircuit,
      },
      {
        id: "risks",
        label: "Risk Engine",
        description: "Identify project risks",
        icon: ShieldAlert,
        
      },
      {
        id: "sprint",
        label: "Sprint Planner",
        description: "Plan upcoming sprints",
        icon: Target,
       
      },
      {
        id: "standup",
        label: "AI Standup",
        description: "Team progress summaries",
        icon: MessageSquare,
      },
      {
        id: "bugs",
        label: "Bug Analyzer",
        description: "Investigate issues",
        icon: Bug,

      },
      {
        id: "release",
        label: "Release Notes",
        description: "Prepare release summaries",
        icon: Rocket,
      },
      {
        id: "knowledge",
        label: "Knowledge Base",
        description: "Developer documentation",
        icon: BookOpen,
  
      },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      {
        id: "settings",
        label: "Settings",
        description: "Workspace preferences",
        icon: Settings,
      
      },
    ],
  },
];

const pageInfo: Record<
  PageId,
  { title: string; subtitle: string; icon: LucideIcon }
> = {
  dashboard: {
    title: "Overview",
    subtitle: "Your workspace at a glance",
    icon: Gauge,
  },
  projects: {
    title: "Projects",
    subtitle: "Organize projects and track progress",
    icon: FolderKanban,
  },
  tasks: {
    title: "My Tasks",
    subtitle: "Stay focused on your work",
    icon: CheckSquare,
  },
  team: {
    title: "Team",
    subtitle: "Collaborate with your team",
    icon: Users,
  },
  insights: {
    title: "AI Insights",
    subtitle: "Turn project data into actionable insights",
    icon: BrainCircuit,
  },
  risks: {
    title: "Risk Engine",
    subtitle: "Monitor project risks and blockers",
    icon: ShieldAlert,
  },
  sprint: {
    title: "Sprint Planner",
    subtitle: "Plan and organize development sprints",
    icon: Target,
  },
  standup: {
    title: "AI Standup",
    subtitle: "Summarize team progress",
    icon: MessageSquare,
  },
  bugs: {
    title: "Bug Analyzer",
    subtitle: "Investigate and organize software issues",
    icon: Bug,
  },
  release: {
    title: "Release Notes",
    subtitle: "Prepare release summaries",
    icon: FileText,
  },
  knowledge: {
    title: "Knowledge Base",
    subtitle: "Keep technical knowledge organized",
    icon: BookOpen,
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your workspace preferences",
    icon: Settings,
  },
};

function readCurrentUser(): CurrentUser | null {
  try {
    const saved = localStorage.getItem("devsync_user");
    return saved ? (JSON.parse(saved) as CurrentUser) : null;
  } catch {
    return null;
  }
}

function getUserName(user: CurrentUser | null): string {
  if (!user) return "Developer";

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.name || user.username || "Developer";
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function PlaceholderPage({
  item,
  onBack,
}: {
  item: NavItem;
  onBack: () => void;
}) {
  const Icon = item.icon;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-7 py-10 text-white sm:px-10 sm:py-14">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
              <Sparkles size={14} />
              DEVSYNC AI WORKSPACE
            </div>

            <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <Icon size={30} />
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-tight">
              {item.label}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {item.description}. This section is part of the DevSync AI
              workspace and is ready for its feature implementation.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <Activity size={14} />
              Coming soon
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            What comes next?
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            The navigation is connected, but this feature does not yet have
            its complete page or backend workflow. It will become functional
            when its components and required API endpoints are implemented.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <LayoutDashboard size={16} />
            Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => Boolean(getAccessToken())
  );

  const [authPage, setAuthPage] = useState<AuthPage>(() =>
    window.location.pathname.toLowerCase().includes("register")
      ? "register"
      : "login"
  );

  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(readCurrentUser);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAccessToken();
      setAuthenticated(false);
      setCurrentUser(null);
      setAuthPage("login");
      window.history.replaceState({}, "", "/login");
    };

    const handleLogin = () => {
      setAuthenticated(Boolean(getAccessToken()));
      setCurrentUser(readCurrentUser());
      setAuthPage("login");
      setActivePage("dashboard");
      window.history.replaceState({}, "", "/");
    };

    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();

      if (path.includes("register")) {
        setAuthPage("register");
      } else if (path.includes("login")) {
        setAuthPage("login");
      } else if (getAccessToken()) {
        setAuthenticated(true);
      } else {
        setAuthPage("login");
      }
    };

    window.addEventListener("devsync:unauthorized", handleUnauthorized);
    window.addEventListener("devsync:login", handleLogin);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("devsync:unauthorized", handleUnauthorized);
      window.removeEventListener("devsync:login", handleLogin);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const allItems = useMemo(
    () => navigation.flatMap((group) => group.items),
    []
  );

  const filteredNavigation = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return navigation;

    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [searchTerm]);

  const activeItem =
    allItems.find((item) => item.id === activePage) ?? allItems[0];

  const userName = getUserName(currentUser);
  const ActiveIcon = pageInfo[activePage].icon;

  function navigateTo(page: PageId) {
    setActivePage(page);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchTerm("");
    setProfileOpen(false);
    setNotificationsOpen(false);
  }

  function navigateAuth(page: AuthPage) {
    setAuthPage(page);
    window.history.pushState(
      {},
      "",
      page === "register" ? "/register" : "/login"
    );
  }

  function handleLogout() {
    clearAccessToken();
    localStorage.removeItem("devsync_user");

    setAuthenticated(false);
    setCurrentUser(null);
    setActivePage("dashboard");
    setAuthPage("login");
    setProfileOpen(false);
    setMobileOpen(false);

    window.history.replaceState({}, "", "/login");
  }

  if (!authenticated || !getAccessToken()) {
    return authPage === "register" ? (
      <Register />
    ) : (
      <Login />
    );
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;

      case "projects":
        return <Projects />;

      case "tasks":
        return <MyTasks />;

      case "team":
        return <Team />;

      case "insights":
        return <AIInsights />;
      case "risks":
        return <RiskEngine />;

      case "sprint":
        return <SprintPlanner />;

      default:
        return activeItem ? (
          <PlaceholderPage
            item={activeItem}
            onBack={() => navigateTo("dashboard")}
          />
        ) : null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#070b14] dark:text-white">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-950 text-slate-300 transition-all duration-300",
          collapsed ? "w-[82px]" : "w-[270px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
            title="DevSync AI home"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/40">
              <Zap size={22} fill="currentColor" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-base font-bold tracking-tight text-white">
                  DevSync <span className="text-indigo-400">AI</span>
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Developer workspace
                </div>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setCollapsed((value) => !value);
            }}
            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
              title="Current workspace"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Command size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  DevSync Workspace
                </div>
                <div className="mt-1 truncate text-[10px] text-slate-500">
                  Project workspace
                </div>
              </div>

              <ChevronDown size={15} className="shrink-0 text-slate-500" />
            </button>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center px-3 pt-4">
            <button
              type="button"
              title="DevSync Workspace"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-indigo-300"
            >
              <Command size={18} />
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="px-3 pt-4">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search navigation..."
                aria-label="Search navigation"
                className="w-full rounded-lg border border-white/[0.07] bg-white/[0.04] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.07]"
              />

              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/[0.08] px-1 text-[9px] text-slate-600">
                /
              </div>
            </div>
          </div>
        )}

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {filteredNavigation.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-600">
                  {group.title}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      title={collapsed ? item.label : item.description}
                      className={[
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition duration-150",
                        collapsed ? "justify-center" : "",
                        active
                          ? "bg-indigo-500/15 text-white"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
                      ].join(" ")}
                    >
                      {active && (
                        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-indigo-400" />
                      )}

                      <Icon
                        size={18}
                        className={[
                          "shrink-0 transition",
                          active
                            ? "text-indigo-300"
                            : "text-slate-500 group-hover:text-slate-200",
                        ].join(" ")}
                      />

                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                            {item.label}
                          </span>

                          {item.status === "soon" && (
                            <span className="rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
                              Soon
                            </span>
                          )}

                          {active && (
                            <ChevronRight
                              size={14}
                              className="shrink-0 text-indigo-300"
                            />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredNavigation.length === 0 && (
            <div className="px-3 py-6 text-center text-xs leading-5 text-slate-500">
              No navigation items match "{searchTerm}".
            </div>
          )}

          {!collapsed && (
            <div className="rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-300">
                <Sparkles size={18} />
              </div>

              <p className="mt-3 text-xs font-semibold text-white">
                Build smarter with AI
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Your development workflow, organized in one place.
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Workspace active
              </div>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-white/[0.08] p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Your account
              </span>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className={[
                "flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 transition hover:bg-white/[0.07]",
                collapsed ? "justify-center" : "",
              ].join(" ")}
              title={userName}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-xs font-bold text-white">
                {getInitials(userName)}
              </div>

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-semibold text-white">
                      {userName}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-slate-500">
                      {currentUser?.email || "Signed-in account"}
                    </div>
                  </div>

                  <ChevronDown size={15} className="text-slate-500" />
                </>
              )}
            </button>

            {profileOpen && (
              <div
                className={[
                  "absolute bottom-full z-50 mb-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl",
                  collapsed ? "left-full ml-2" : "left-0",
                ].join(" ")}
              >
                <div className="border-b border-white/[0.08] px-3 py-3">
                  <p className="truncate text-xs font-semibold text-white">
                    {userName}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-slate-500">
                    {currentUser?.email || ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("settings")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.07] hover:text-white"
                >
                  <Settings size={15} />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-red-300 hover:bg-red-500/10"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="mt-2 flex w-full justify-center rounded-xl p-2.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>

      <div
        className={[
          "min-h-screen transition-[padding] duration-300",
          collapsed ? "lg:pl-[82px]" : "lg:pl-[270px]",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 sm:flex">
                <ActiveIcon size={18} />
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                  {pageInfo[activePage].title}
                </div>
                <div className="hidden truncate text-[11px] text-slate-400 sm:block">
                  {pageInfo[activePage].subtitle}
                </div>
              </div>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
            {searchOpen && (
              <div className="relative hidden md:block">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchOpen(false);
                      setSearchTerm("");
                    }

                    if (event.key === "Enter") {
                      const firstItem = filteredNavigation[0]?.items[0];
                      if (firstItem) navigateTo(firstItem.id);
                    }
                  }}
                  placeholder="Find a page..."
                  aria-label="Find a page"
                  className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-300 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchOpen((value) => !value);
                setSearchTerm("");
              }}
              aria-label="Toggle search"
              title="Search navigation"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Search size={17} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                title="Notifications"
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Bell size={17} />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Bell size={16} className="text-indigo-600" />
                    Notifications
                  </div>

                  <p className="mt-3 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    No notification feed is connected yet. Updates will appear
                    here when notification support is implemented.
                  </p>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-[10px] font-bold text-white">
                {getInitials(userName)}
              </div>

              <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-700 dark:text-slate-200 xl:block">
                {userName}
              </span>

              <ChevronDown
                size={14}
                className="hidden text-slate-400 sm:block"
              />
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-76px)]">
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {renderPage()}
          </div>
        </main>

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 bg-white px-6 py-4 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center lg:px-8">
          <span>
            © 2026 DevSync AI. Built for better development workflows.
          </span>

          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Workspace
            <span className="text-slate-300">/</span>
            {pageInfo[activePage].title}
          </span>
        </footer>
      </div>

      {(profileOpen || notificationsOpen) && (
        <button
          type="button"
          aria-label="Close open menus"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => {
            setProfileOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
}
