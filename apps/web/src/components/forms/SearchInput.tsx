import {
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";

interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size"
  > {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
}

export default function SearchInput({
  value,
  onValueChange,
  onClear,
  shortcut = "⌘ K",
  className = "",
  ...props
}: SearchInputProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const modifier =
        event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (
        event.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handler);

    return () =>
      window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={[
        "group flex h-10 items-center gap-2 rounded-xl",
        "border border-white/10 bg-white/[0.035]",
        "px-3 transition-all",
        "focus-within:border-indigo-500/30",
        "focus-within:bg-white/[0.05]",
        className,
      ].join(" ")}
    >
      <Search className="h-4 w-4 shrink-0 text-slate-500 group-focus-within:text-indigo-400" />

      <input
        ref={inputRef}
        value={value}
        onChange={(event) =>
          onValueChange(event.target.value)
        }
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onClear?.();
            onValueChange("");
            inputRef.current?.focus();
          }}
          className="rounded-md p-1 text-slate-500 hover:bg-white/[0.06] hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd className="hidden rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600 sm:inline-block">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}