import {
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  icon?: LucideIcon;
}

export default function SelectField({
  label,
  options,
  error,
  icon: Icon,
  id,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        )}

        <select
          id={id}
          className={[
            "h-10 w-full appearance-none rounded-xl",
            "border border-white/10 bg-white/[0.035]",
            "px-3 pr-9 text-sm text-white outline-none",
            "transition-colors",
            "focus:border-indigo-500/40",
            Icon ? "pl-10" : "",
            error ? "border-red-500/40" : "",
            className,
          ].join(" ")}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-[#0b0d1a] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      {error && (
        <p className="text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}