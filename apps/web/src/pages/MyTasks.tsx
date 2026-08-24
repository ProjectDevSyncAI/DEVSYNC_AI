import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Flag,
  GripVertical,
  ListTodo,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  project: string;
  assignee: string;
  due: string;
  labels: string[];
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Implement JWT authentication",
    description: "Complete secure login and token refresh flow.",
    status: "In Progress",
    priority: "High",
    project: "DevSync AI",
    assignee: "DB",
    due: "Today",
    labels: ["Backend", "Security"],
  },
  {
    id: 2,
    title: "Design sprint planner",
    description: "Create AI sprint planning interface.",
    status: "Review",
    priority: "High",
    project: "DevSync AI",
    assignee: "AS",
    due: "Today",
    labels: ["Frontend", "AI"],
  },
  {
    id: 3,
    title: "Optimize database queries",
    description: "Reduce dashboard query latency.",
    status: "Todo",
    priority: "Medium",
    project: "Analytics Platform",
    assignee: "RK",
    due: "Tomorrow",
    labels: ["Database"],
  },
  {
    id: 4,
    title: "Prepare standup summary",
    description: "Generate daily engineering standup.",
    status: "Done",
    priority: "Low",
    project: "DevSync AI",
    assignee: "DB",
    due: "Completed",
    labels: ["AI"],
  },
  {
    id: 5,
    title: "Fix mobile navigation",
    description: "Resolve responsive navigation issues.",
    status: "In Progress",
    priority: "Critical",
    project: "Mobile App",
    assignee: "NK",
    due: "Today",
    labels: ["Mobile", "Bug"],
  },
  {
    id: 6,
    title: "API documentation",
    description: "Document all public API endpoints.",
    status: "Todo",
    priority: "Low",
    project: "DevSync AI",
    assignee: "AS",
    due: "Friday",
    labels: ["Documentation"],
  },
];

const columns: TaskStatus[] = [
  "Todo",
  "In Progress",
  "Review",
  "Done",
];

const priorityStyle = {
  Low: "text-slate-400",
  Medium: "text-blue-500",
  High: "text-orange-500",
  Critical: "text-rose-500",
};

export default function MyTasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.project.toLowerCase().includes(search.toLowerCase());

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  const moveTask = (id: number, status: TaskStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  };

  const createTask = () => {
    setTasks((current) => [
      {
        id: Date.now(),
        title: "New workspace task",
        description: "Task created from My Tasks.",
        status: "Todo",
        priority: "Medium",
        project: "DevSync AI",
        assignee: "DB",
        due: "Today",
        labels: ["New"],
      },
      ...current,
    ]);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ListTodo className="h-4 w-4" />
              Workspace / My Tasks
            </div>

            <h1 className="mt-2 text-3xl font-bold">My Tasks</h1>

            <p className="mt-2 text-sm text-slate-500">
              Focus on what needs to be done next.
            </p>
          </div>

          <button
            onClick={createTask}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total", tasks.length],
            ["In Progress", tasks.filter((x) => x.status === "In Progress").length],
            ["Review", tasks.filter((x) => x.status === "Review").length],
            ["Completed", tasks.filter((x) => x.status === "Done").length],
          ].map(([name, value]) => (
            <div
              key={String(name)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm text-slate-500">{name}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="h-11 w-full rounded-xl bg-slate-50 pl-10 pr-4 text-sm outline-none dark:bg-slate-950"
            />
          </div>

          <div className="flex gap-2">
            <Filter className="my-auto h-4 w-4 text-slate-400" />

            {["All", "Low", "Medium", "High", "Critical"].map((item) => (
              <button
                key={item}
                onClick={() => setPriorityFilter(item)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  priorityFilter === item
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column
            );

            return (
              <div
                key={column}
                className="min-h-[520px] rounded-2xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    {column === "Done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400" />
                    )}

                    <h2 className="text-sm font-bold">{column}</h2>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={createTask}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-5">
                              {task.title}
                            </h3>

                            <button>
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </button>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {task.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {task.labels.map((label) => (
                              <span
                                key={label}
                                className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800"
                              >
                                {label}
                              </span>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex items-center gap-1 text-[10px] font-bold ${priorityStyle[task.priority]}`}
                              >
                                <Flag className="h-3 w-3" />
                                {task.priority}
                              </span>
                            </div>

                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                              {task.assignee}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {task.due}
                            </span>

                            <span>{task.project}</span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 opacity-0 transition group-hover:opacity-100">
                            {columns
                              .filter((x) => x !== task.status)
                              .slice(0, 2)
                              .map((status) => (
                                <button
                                  key={status}
                                  onClick={() => moveTask(task.id, status)}
                                  className="rounded-lg bg-slate-100 py-1.5 text-[10px] font-semibold dark:bg-slate-800"
                                >
                                  → {status}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                      <Circle className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-xs text-slate-400">
                        No tasks
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold">AI Task Assistant</h3>
            <p className="mt-1 text-xs text-slate-500">
              DevSync AI can prioritize tasks based on deadlines, dependencies,
              team capacity and project risk.
            </p>
          </div>

          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
            Optimize Tasks
          </button>
        </div>
      </div>
    </main>
  );
}