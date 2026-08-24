import { UserRound } from "lucide-react";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
}

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-lg",
};

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Avatar({
  name = "User",
  src,
  size = "md",
  status,
}: AvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={[
          "overflow-hidden rounded-full border border-white/10",
          "bg-gradient-to-br from-indigo-500/30 to-violet-500/20",
          "flex items-center justify-center font-semibold text-indigo-200",
          sizes[size],
        ].join(" ")}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : name ? (
          getInitials(name)
        ) : (
          <UserRound className="h-1/2 w-1/2" />
        )}
      </div>

      {status && (
        <span
          className={[
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full",
            "border-2 border-[#070816]",
            status === "online"
              ? "bg-emerald-400"
              : status === "busy"
                ? "bg-amber-400"
                : "bg-slate-500",
          ].join(" ")}
        />
      )}
    </div>
  );
}