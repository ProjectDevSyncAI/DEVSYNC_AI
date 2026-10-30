
import { FormEvent, useState } from "react";
import { authApi, setAccessToken } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login({
  email: email.trim(),
  password,
});

// Backend may return { data: { accessToken, user } }
const auth = (response as any).data ?? response;

if (!auth?.accessToken) {
  console.error("Unexpected login response:", response);
  throw new Error("Login response did not contain an access token.");
}

setAccessToken(auth.accessToken);

if (auth.user) {
  localStorage.setItem("devsync_user", JSON.stringify(auth.user));
}

window.dispatchEvent(new CustomEvent("devsync:login"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo and heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold shadow-lg shadow-indigo-500/20">
            D
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to DevSync AI
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-white/10 bg-[#101522] p-6 shadow-2xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#0b0f1a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f1a] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 accent-indigo-500"
                />
                Remember my email
              </label>

              <button
                type="button"
                onClick={() =>
                  setError("Please contact your administrator to reset your password.")
                }
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">
              SECURE ACCESS
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-slate-400">
            New to DevSync AI?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/register";
              }}
              className="font-semibold text-indigo-300 hover:text-indigo-200"
            >
              Create an account
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          DevSync AI · Engineering intelligence platform
        </p>
      </div>
    </div>
  );
}
