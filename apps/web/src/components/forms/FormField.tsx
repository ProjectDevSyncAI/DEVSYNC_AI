import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

interface FormFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: ReactNode;
}

export default function FormField({
  label,
  error,
  hint,
  required,
  icon,
  id,
  className = "",
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-300"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </label>

      <div
        className={[
          "flex min-h-10 items-center gap-2 rounded-xl",
          "border bg-white/[0.035] px-3",
          "transition-all",
          error
            ? "border-red-500/40 focus-within:border-red-400"
            : "border-white/10 focus-within:border-indigo-500/40",
        ].join(" ")}
      >
        {icon && (
          <span className="shrink-0 text-slate-500">
            {icon}
          </span>
        )}

        <input
          id={id}
          className={[
            "w-full bg-transparent py-2 text-sm text-white",
            "outline-none placeholder:text-slate-600",
            className,
          ].join(" ")}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}