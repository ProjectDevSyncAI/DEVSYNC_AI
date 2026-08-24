interface ProgressPoint {
  label: string;
  value: number;
}

interface ProgressChartProps {
  data: ProgressPoint[];
  height?: number;
  max?: number;
}

export default function ProgressChart({
  data,
  height = 180,
  max = 100,
}: ProgressChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-slate-500">
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-3"
        style={{ height }}
      >
        {data.map((item) => {
          const percentage = Math.min(
            100,
            Math.max(0, (item.value / max) * 100),
          );

          return (
            <div
              key={item.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-[10px] font-medium text-slate-500">
                {item.value}
              </span>

              <div className="relative flex h-full w-full max-w-10 items-end overflow-hidden rounded-t-lg bg-white/[0.04]">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600/80 to-violet-400 transition-all duration-500"
                  style={{
                    height: `${percentage}%`,
                  }}
                />
              </div>

              <span className="max-w-full truncate text-[10px] text-slate-600">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}