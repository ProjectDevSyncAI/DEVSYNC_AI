import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  LockKeyhole,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT — BRAND EXPERIENCE */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.16),transparent_30%)]" />

          <div className="absolute left-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full border border-white/5" />
          <div className="absolute bottom-[-180px] right-[-100px] h-[500px] w-[500px] rounded-full border border-white/5" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                <Sparkles size={21} />
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight">
                  DevSync
                  <span className="text-indigo-400"> AI</span>
                </div>

                <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  Intelligent Dev Workspace
                </div>
              </div>
            </div>

            {/* Hero */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-medium text-indigo-300">
                <Zap size={14} />
                AI-powered development intelligence
              </div>

              <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] xl:text-6xl">
                Build smarter.
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Ship faster.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/50">
                DevSync AI brings your projects, tasks, code intelligence,
                risks and developer workflows together in one intelligent
                workspace.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid max-w-xl grid-cols-2 gap-3">
                <FeatureCard
                  icon="✦"
                  title="AI Insights"
                  description="Understand project health instantly."
                />

                <FeatureCard
                  icon="⌁"
                  title="Risk Detection"
                  description="Spot problems before they grow."
                />

                <FeatureCard
                  icon="◈"
                  title="Smart Planning"
                  description="Turn work into actionable sprints."
                />

                <FeatureCard
                  icon="↗"
                  title="Team Intelligence"
                  description="Keep everyone aligned."
                />
              </div>
            </div>

            <div className="text-xs text-white/30">
              © 2026 DevSync AI · Intelligent software development
            </div>
          </div>
        </section>

        {/* RIGHT — LOGIN */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-white/5 bg-[#0a0c11] px-6 py-10 lg:border-l">
          <div className="absolute right-[-160px] top-[-160px] h-[380px] w-[380px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-120px] h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <Sparkles size={21} />
              </div>

              <div className="text-xl font-bold">
                DevSync<span className="text-indigo-400"> AI</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Sign in to continue to your intelligent development workspace.
              </p>
            </div>

            {/* Social login */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] text-sm font-medium transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <Github size={18} />
              Continue with GitHub
            </button>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/75"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-white/75"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white/70"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
                />

                <span className="text-xs text-white/45">
                  Keep me signed in
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <p className="mt-8 text-center text-sm text-white/35">
              Don't have an account?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Create account
              </button>
            </p>

            {/* Security */}
            <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-white/25">
              <LockKeyhole size={13} />
              Your workspace is protected with secure authentication
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 backdrop-blur-sm transition hover:border-white/12 hover:bg-white/[0.045]">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-sm text-indigo-300">
        {icon}
      </div>

      <div className="text-sm font-medium text-white/85">
        {title}
      </div>

      <div className="mt-1 text-xs leading-5 text-white/35">
        {description}
      </div>
    </div>
  );
}