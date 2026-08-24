import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import TablePagination from "./TablePagination";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  render?: (
    row: T,
    index: number,
  ) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
}

type SortState = {
  key: string;
  direction: "asc" | "desc";
} | null;

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = "No data available.",
  pageSize = 10,
  pagination = true,
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] =
    useState<SortState>(null);

  const [page, setPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sort) {
      return data;
    }

    const column = columns.find(
      (item) => item.key === sort.key,
    );

    if (!column?.accessor) {
      return data;
    }

    const accessor = column.accessor;

    return [...data].sort((a, b) => {
      const first = String(
        a[accessor] ?? "",
      ).toLowerCase();

      const second = String(
        b[accessor] ?? "",
      ).toLowerCase();

      const comparison = first.localeCompare(second, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sort.direction === "asc"
        ? comparison
        : -comparison;
    });
  }, [data, columns, sort]);

  const totalPages = pagination
    ? Math.ceil(sortedData.length / pageSize)
    : 1;

  const visibleData = pagination
    ? sortedData.slice(
        (page - 1) * pageSize,
        page * pageSize,
      )
    : sortedData;

  const getRowKey = (row: T) => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }

    return String(row[rowKey]);
  };

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    setPage(1);

    setSort((current) => {
      if (!current || current.key !== column.key) {
        return {
          key: column.key,
          direction: "asc",
        };
      }

      if (current.direction === "asc") {
        return {
          key: column.key,
          direction: "desc",
        };
      }

      return null;
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {columns.map((column) => {
                const active =
                  sort?.key === column.key;

                return (
                  <th
                    key={column.key}
                    className={[
                      "px-4 py-3 text-left text-[10px]",
                      "font-semibold uppercase tracking-wider",
                      "text-slate-600",
                      column.className ?? "",
                    ].join(" ")}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          toggleSort(column)
                        }
                        className="inline-flex items-center gap-1.5 hover:text-slate-300"
                      >
                        {column.header}

                        {active ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map(
                (_, index) => (
                  <tr
                    key={`loading-${index}`}
                    className="border-b border-white/[0.05]"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-4"
                      >
                        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : visibleData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-xs text-slate-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleData.map((row, index) => (
                <tr
                  key={getRowKey(row)}
                  onClick={() =>
                    onRowClick?.(row)
                  }
                  className={[
                    "border-b border-white/[0.05]",
                    "transition-colors",
                    onRowClick
                      ? "cursor-pointer hover:bg-white/[0.035]"
                      : "",
                  ].join(" ")}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "px-4 py-4 text-sm text-slate-300",
                        column.className ?? "",
                      ].join(" ")}
                    >
                      {column.render
                        ? column.render(
                            row,
                            index,
                          )
                        : column.accessor
                          ? String(
                              row[
                                column.accessor
                              ] ?? "—",
                            )
                          : "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}