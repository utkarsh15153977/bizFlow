"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import type { Tables } from "@/types/database.types";
import { createTask, updateTask, deleteTask } from "@/lib/crm-actions";

type Task = Tables<"tasks">;

const priorityTone: Record<string, "danger" | "warning" | "neutral" | "accent"> = {
  urgent: "danger",
  high: "warning",
  medium: "accent",
  low: "neutral",
};

const statusTone: Record<string, "warning" | "accent" | "success" | "neutral"> = {
  pending: "warning",
  in_progress: "accent",
  completed: "success",
  cancelled: "neutral",
};

function formatDueDate(dateString: string, includeYear = false): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: includeYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

const columns: Column<Task>[] = [
  {
    id: "title",
    header: "Task",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-muted-foreground md:hidden">
          {row.due_date
            ? formatDueDate(row.due_date)
            : "No due date"}
          {" · "}
          {row.priority}
        </p>
      </div>
    ),
  },
  {
    id: "owner",
    header: "Owner",
    hideOnMobile: true,
    cell: (row) => (row.assigned_to ? "Assigned" : "Unassigned"),
  },
  {
    id: "due",
    header: "Due",
    hideOnMobile: true,
    cell: (row) =>
      row.due_date
        ? formatDueDate(row.due_date, true)
        : "—",
  },
  {
    id: "priority",
    header: "Priority",
    hideOnMobile: true,
    cell: (row) => <Badge tone={priorityTone[row.priority] ?? "neutral"}>{row.priority}</Badge>,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={statusTone[row.status] ?? "neutral"}>{row.status.replace("_", " ")}</Badge>,
  },
  {
    id: "actions",
    header: "",
    hideOnMobile: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => window.dispatchEvent(new CustomEvent("edit-task", { detail: row }))}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="h-8 px-2 text-xs text-danger hover:text-danger"
          onClick={() => window.dispatchEvent(new CustomEvent("delete-task", { detail: row }))}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

type TaskFormProps = {
  task?: Task | null;
  onClose: () => void;
};

function TaskForm({ task, onClose }: TaskFormProps) {
  const isEdit = !!task?.id;
  const action = isEdit ? updateTask : createTask;
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [router, state?.success]);

  if (state?.success) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium">Task saved successfully.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={task?.id ?? ""} />}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium">Title</label>
        <input id="title" name="title" required defaultValue={task?.title ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={task?.description ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="priority" className="block text-sm font-medium">Priority</label>
          <select id="priority" name="priority" defaultValue={task?.priority ?? "medium"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={task?.status ?? "pending"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="dueDate" className="block text-sm font-medium">Due date</label>
        <input id="dueDate" name="dueDate" type="date" defaultValue={task?.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      {state?.error && (
        <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={isPending} loadingText="Saving...">Save task</Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ task, onClose }: { task: Task; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteTask, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [router, state?.success]);

  if (state?.success) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium">Task deleted.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={task.id} />
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{task.title}</span>? This action cannot be undone.
      </p>
      {state?.error && (
        <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="danger" isLoading={isPending} loadingText="Deleting...">Delete</Button>
      </div>
    </form>
  );
}

export function TasksView({ tasks }: { tasks: Task[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null);

  useEffect(() => {
    function handleEdit(event: Event) {
      setCreateOpen(false);
      setDeleteTaskState(null);
      setEditTask((event as CustomEvent<Task>).detail);
    }

    function handleDelete(event: Event) {
      setCreateOpen(false);
      setEditTask(null);
      setDeleteTaskState((event as CustomEvent<Task>).detail);
    }

    window.addEventListener("edit-task", handleEdit);
    window.addEventListener("delete-task", handleDelete);

    return () => {
      window.removeEventListener("edit-task", handleEdit);
      window.removeEventListener("delete-task", handleDelete);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => { setEditTask(null); setCreateOpen(true); }}>Add task</Button>
      </div>
      <DataTable
        caption="Tasks"
        columns={columns}
        rows={tasks}
        getRowId={(row) => row.id}
        emptyIcon={<InboxIcon />}
        emptyTitle="No tasks yet"
        emptyDescription="Follow-ups and team work will appear in this list."
        emptyAction={
          <Button onClick={() => { setEditTask(null); setCreateOpen(true); }}>Add task</Button>
        }
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add task" description="Create a new task.">
        <TaskForm onClose={() => setCreateOpen(false)} />
      </Dialog>

      <Dialog open={!!editTask} onClose={() => setEditTask(null)} title="Edit task" description="Update task details.">
        {editTask && <TaskForm task={editTask} onClose={() => setEditTask(null)} />}
      </Dialog>

      <Dialog open={!!deleteTaskState} onClose={() => setDeleteTaskState(null)} title="Delete task" description="This action cannot be undone.">
        {deleteTaskState && <DeleteConfirm task={deleteTaskState} onClose={() => setDeleteTaskState(null)} />}
      </Dialog>
    </div>
  );
}
