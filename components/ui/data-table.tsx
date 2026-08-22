import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
};

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 font-medium text-muted-foreground ${
                    column.hideOnMobile ? "hidden md:table-cell" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-t border-border hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`whitespace-nowrap px-4 py-3 ${
                      column.hideOnMobile ? "hidden md:table-cell" : ""
                    }`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
