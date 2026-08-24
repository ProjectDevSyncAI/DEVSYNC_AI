import { Outlet } from "react-router-dom";
import { BrainCircuit, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060713] text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Brand panel */}
        <section className="hidden w-[44%] flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
                <BrainCircuit className="h-6 w-6 text-indigo-300" />
              </div>

              <div>
                <p className="text-lg font-bold">DevSync AI</p>
                <p className="text-xs text-slate-500">
                  Intelligent engineering workspace
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered development
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
                Build smarter.
                <br />
                Ship faster.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                One intelligent workspace for projects, tasks,
                sprints, risks, standups and engineering insights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Secure workspace environment
          </div>
        </section>

        {/* Form panel */}
        <section className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}