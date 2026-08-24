import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Github,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!agree) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  const passwordChecks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT — REGISTER FORM */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-white/5 bg-[#0a0c11] px-6 py-10 lg:border-r">
          <div className="absolute left-[-160px] top-[-160px] h-[380px] w-[380px] rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="absolute bottom-[-180px] right-[-120px] h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-9 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <Sparkles size={21} />
              </div>

              <div className="text-xl font-bold">
                DevSync
                <span className="text-indigo-400"> AI</span>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300">
                <Sparkles size={13} />
                Start building smarter
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                Create your workspace
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Set up your DevSync AI account and bring your development
                workflow into one intelligent workspace.
              </p>
            </div>

            {/* GitHub */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] text-sm font-medium transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <Github size={18} />
              Sign up with GitHub
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/8" />

              <span className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                or use email
              </span>

              <div className="h-px flex-1 bg-white/8" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-white/75"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/75"
                >
                  Work email
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
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-white/75"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
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

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <PasswordRequirement
                      valid={passwordChecks.length}
                      label="8+ characters"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.number}
                      label="Number"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.uppercase}
                      label="Uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-white/75"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-indigo-400/60 focus:bg-white/[0.055] focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white/70"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(event) =>
                    setAgree(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
                />

                <span className="text-xs leading-5 text-white/40">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!agree || loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Login */}
            <p className="mt-7 text-center text-sm text-white/35">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Sign in
              </button>
            </p>

            {/* Security */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/25">
              <LockKeyhole size={13} />
              Secure account creation
            </div>
          </div>
        </section>

        {/* RIGHT — PRODUCT EXPERIENCE */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.16),transparent_30%)]" />

          <div className="absolute right-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full border border-white/5" />

          <div className="absolute bottom-[-180px] left-[-100px] h-[500px] w-[500px] rounded-full border border-white/5" />

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
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  <Zap size={18} />
                </div>

                <div>
                  <div className="text-sm font-medium text-white/80">
                    One workspace.
                  </div>

                  <div className="text-xs text-white/35">
                    Your entire development intelligence layer.
                  </div>
                </div>
              </div>

              <h2 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] xl:text-6xl">
                Everything your
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  team needs to ship.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/50">
                Connect your projects, tasks, issues and developer activity.
                Let AI turn your engineering data into useful decisions.
              </p>

              {/* Product preview */}
              <div className="mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      Engineering Intelligence
                    </div>

                    <div className="mt-1 text-xs text-white/30">
                      Project Phoenix
                    </div>
                  </div>

                  <div className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-[10px] font-medium text-emerald-300">
                    Healthy
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Metric
                    value="86%"
                    label="Health"
                  />

                  <Metric
                    value="24"
                    label="Tasks"
                  />

                  <Metric
                    value="3"
                    label="Risks"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/7 bg-black/10 p-4">
                  <div className="flex items-center gap-2 text-xs text-indigo-300">
                    <Sparkles size={13} />
                    AI Recommendation
                  </div>

                  <p className="mt-2 text-xs leading-5 text-white/40">
                    Sprint velocity is trending upward. Consider moving the
                    documentation task into the current sprint.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-white/30">
              <span className="flex items-center gap-2">
                <Users size={14} />
                Built for modern teams
              </span>

              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                AI-native workflow
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordRequirement({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] ${
        valid
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-white/7 bg-white/[0.02] text-white/25"
      }`}
    >
      <Check size={11} />
      {label}
    </div>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4">
      <div className="text-xl font-semibold tracking-tight">
        {value}
      </div>

      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/25">
        {label}
      </div>
    </div>
  );
}