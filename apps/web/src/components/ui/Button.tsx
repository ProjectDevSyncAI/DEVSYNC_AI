import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "outline";

type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "icon";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20",
  secondary:
    "bg-white/[0.08] text-white hover:bg-white/[0.13] border border-white/10",
  ghost:
    "bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20",
  success:
    "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20",
  outline:
    "bg-transparent text-slate-200 border border-white/10 hover:bg-white/[0.06]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-sm rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2",
        "font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = "Button";

export default Button;