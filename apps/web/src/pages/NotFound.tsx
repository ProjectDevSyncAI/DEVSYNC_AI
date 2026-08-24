import {
  ArrowLeft,
  Compass,
  Home,
  Search,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-5">
      <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />

      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

      <motion.main
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative w-full max-w-xl text-center"
      >
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-2xl">
          <Compass size={35} />
        </div>

        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-violet-600">
          <Sparkles size={15} />
          DEVSync AI
        </div>

        <h1 className="text-7xl font-black tracking-tight text-slate-950">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold">
          This page wandered off.
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          The page you're looking for doesn't exist, has been moved,
          or may not be available in this workspace.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <button
            onClick={() =>
              navigate("/")
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800"
          >
            <Home size={16} />
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate("/projects")
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-violet-700"
          >
            <Search size={16} />
            Projects
          </button>
        </div>
      </motion.main>
    </div>
  );
}