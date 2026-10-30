
import { useState, type ReactNode } from "react";

type AppShellProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
};

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      { label: "Dashboard", icon: "▦" },
      { label: "Projects", icon: "▤" },
      { label: "My Tasks", icon: "✓" },
      { label: "Team", icon: "♙" },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      { label: "AI Assistant", icon: "✳" },
      { label: "Risk Analysis", icon: "◇" },
      { label: "Analytics", icon: "▥" },
    ],
  },
  {
    section: "DEVELOPMENT",
    items: [
      { label: "Sprints", icon: "↗" },
      { label: "Standups", icon: "☷" },
      { label: "Bug Tracker", icon: "⚙" },
      { label: "Releases", icon: "⇧" },
      { label: "Knowledge Base", icon: "▧" },
    ],
  },
];

export default function AppShell({
  activePage,
  onNavigate,
  children,
  userName = "Workspace User",
  userEmail = "",
  onLogout,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  function navigate(page: string) {
    onNavigate(page);
    setMobileOpen(false);
  }

  function renderNavigation() {
    return (
      <>
        {navigation.map((group) => (
          <div key={group.section} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">
                {group.section}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const selected =
                  activePage.toLowerCase() === item.label.toLowerCase();

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.label)}
                    title={collapsed ? item.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selected
                        ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-950/20"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg">
                      {item.icon}
                    </span>

                    {!collapsed && <span>{item.label}</span>}

                    {selected && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-auto border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => navigate("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              activePage === "Settings"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center text-lg">
              ⚙
            </span>
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 px-3 py-5 transition-all duration-200 ${
          collapsed ? "w-[84px]" : "w-[264px]"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-950/40">
            D
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-lg font-bold tracking-tight text-white">
                DevSync <span className="text-blue-400">AI</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Project workspace
              </p>
            </div>
          )}

          <button
            type="button"
            aria-label="Close mobile navigation"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            ×
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {renderNavigation()}
        </nav>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          {!collapsed ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Workspace active
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Your development workspace at a glance.
              </p>
            </>
          ) : (
            <div className="mx-auto h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="mt-3 hidden rounded-xl px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
        >
          {collapsed ? "→ Expand sidebar" : "← Collapse sidebar"}
        </button>
      </aside>

      {/* Main content */}
      <div
        className={`min-h-screen transition-all duration-200 ${
          collapsed ? "lg:ml-[84px]" : "lg:ml-[264px]"
        }`}
      >
        {/* Top navigation */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-lg text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                ☰
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {activePage}
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Manage your work and stay in sync.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <span className="text-slate-400">⌕</span>
                <input
                  aria-label="Search shortcut placeholder"
                  readOnly
                  value="Search workspace..."
                  onClick={() => navigate("Projects")}
                  className="w-32 cursor-pointer bg-transparent text-xs text-slate-500 outline-none lg:w-40"
                />
                <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                  /
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("Notifications")}
                aria-label="Notifications"
                title="Notifications"
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
              >
                ♧
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                    {initials || "U"}
                  </span>

                  <span className="hidden max-w-36 text-left sm:block">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {userName}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500">
                      {userEmail || "Workspace account"}
                    </span>
                  </span>

                  <span className="hidden text-xs text-slate-400 sm:block">
                    ▾
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("Settings");
                        setProfileOpen(false);
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Profile and settings
                    </button>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-400">
          DevSync AI · Project management workspace
        </footer>
      </div>
    </div>
  );
}
