import { validatePassword } from "../schemas/auth.schema";

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({
  password,
}: PasswordStrengthProps) {
  if (!password) {
    return null;
  }

  const result = validatePassword(password);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              key={index}
              className={[
                "h-1.5 flex-1 rounded-full transition-all",
                index < result.score
                  ? "bg-indigo-500"
                  : "bg-slate-200",
              ].join(" ")}
            />
          ),
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Password strength
        </span>

        <span className="text-xs font-semibold text-indigo-600">
          {result.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Requirement
          active={result.length}
          text="8+ characters"
        />

        <Requirement
          active={result.lowercase}
          text="Lowercase"
        />

        <Requirement
          active={result.uppercase}
          text="Uppercase"
        />

        <Requirement
          active={result.number}
          text="Number"
        />

        <Requirement
          active={result.special}
          text="Special character"
        />
      </div>
    </div>
  );
}

function Requirement({
  active,
  text,
}: {
  active: boolean;
  text: string;
}) {
  return (
    <span
      className={
        active
          ? "text-emerald-600"
          : "text-slate-400"
      }
    >
      {active ? "✓" : "○"} {text}
    </span>
  );
}