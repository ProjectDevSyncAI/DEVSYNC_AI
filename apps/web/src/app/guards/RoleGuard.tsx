import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

import { useAuthStore } from "../../store/auth.store";

type Role =
  | "admin"
  | "developer"
  | "manager"
  | "member"
  | "user";

interface RoleGuardProps {
  allowedRoles: Role[];
}

export default function RoleGuard({
  allowedRoles,
}: RoleGuardProps) {
  const location = useLocation();
  const auth = useAuthStore();

  const user = auth.user as
    | {
        role?: string;
      }
    | null
    | undefined;

  const role = user?.role?.toLowerCase() as Role | undefined;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
            <LockKeyhole className="h-8 w-8 text-amber-300" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Access restricted
          </p>

          <h1 className="mt-3 text-2xl font-bold text-white">
            You don't have permission
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your current workspace role does not have access
            to this section.
          </p>

          <button
            type="button"
            onClick={() => {
              window.history.back();
            }}
            className="mt-7 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  void location;

  return <Outlet />;
}