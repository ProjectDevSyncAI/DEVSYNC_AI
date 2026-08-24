import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { useAuthStore } from "../../store/auth.store";

export default function AuthGuard() {
  const location = useLocation();
  const auth = useAuthStore();

  const isAuthenticated =
    typeof auth.isAuthenticated === "boolean"
      ? auth.isAuthenticated
      : Boolean(auth.user);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-5 top-5 z-50">
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300 backdrop-blur-xl">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protected workspace
        </div>
      </div>

      <Outlet />
    </div>
  );
}