import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import type { Task } from "@/lib/mock-data";

const priorityTone = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
} as const;

const statusTone = {
  Pending: "warning",
  "In progress": "accent",
  Done: "success",
} as const;

const columns: Column<Task>[] = [
  {
    id: "title",
    header: "Task",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-muted-foreground md:hidden">
          {row.due} · {row.priority}
        </p>
      </div>
    ),
  },
  {
    id: "owner",
    header: "Owner",
    hideOnMobile: true,
    cell: (row) => row.owner,
  },
  {
    id: "due",
    header: "Due",
    hideOnMobile: true,
    cell: (row) => row.due,
  },
  {
    id: "priority",
    header: "Priority",
    hideOnMobile: true,
    cell: (row) => <Badge tone={priorityTone[row.priority]}>{row.priority}</Badge>,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
  },
];

export function TasksView({ tasks }: { tasks: Task[] }) {
  return (
    <DataTable
      caption="Tasks"
      columns={columns}
      rows={tasks}
      getRowId={(row) => row.id}
      emptyIcon={<InboxIcon />}
      emptyTitle="No tasks yet"
      emptyDescription="Follow-ups and team work will appear in this list."
    />
  );
}
