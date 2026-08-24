import { Outlet } from "react-router-dom";
import {
  Activity,
  Bell,
  Command,
  Search,
} from "lucide-react";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#070816] text-white">
      {/* Top application bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070816]/85 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
              <Activity className="h-5 w-5 text-indigo-300" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">
                DevSync AI
              </p>
              <p className="text-[11px] text-slate-500">
                Engineering Workspace
              </p>
            </div>
          </div>

          <div className="hidden w-full max-w-md md:block">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-sm text-slate-500 transition hover:bg-white/[0.06]"
            >
              <Search className="h-4 w-4" />

              <span className="flex-1">
                Search anything...
              </span>

              <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px]">
                ⌘ K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Command palette"
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Command className="h-5 w-5" />
            </button>

            <button
              type="button"
              title="Notifications"
              className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Bell className="h-5 w-5" />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </div>
    </div>
  );
}