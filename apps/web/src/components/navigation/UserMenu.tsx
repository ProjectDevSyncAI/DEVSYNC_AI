import {
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import Avatar from "../ui/Avatar";

interface UserMenuProps {
  name: string;
  email: string;
  avatar?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

export default function UserMenu({
  name,
  email,
  avatar,
  onProfile,
  onSettings,
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition-colors hover:bg-white/[0.05]"
        aria-expanded={open}
      >
        <Avatar
          name={name}
          src={avatar}
          size="sm"
          status="online"
        />

        <div className="hidden max-w-32 text-left md:block">
          <p className="truncate text-xs font-medium text-slate-200">
            {name}
          </p>
          <p className="truncate text-[10px] text-slate-600">
            {email}
          </p>
        </div>

        <ChevronDown
          className={[
            "hidden h-3.5 w-3.5 text-slate-600 transition-transform md:block",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d1a] p-1.5 shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 px-3 py-3">
              <p className="truncate text-xs font-semibold text-white">
                {name}
              </p>
              <p className="mt-1 truncate text-[10px] text-slate-600">
                {email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onProfile?.();
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
            >
              <User className="h-4 w-4" />
              Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSettings?.();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            <div className="my-1 border-t border-white/10" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}