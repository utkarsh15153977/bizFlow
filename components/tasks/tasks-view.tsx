"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import type { Tables } from "@/types/database.types";
import { completeTask, createTask, updateTask, deleteTask } from "@/lib/crm-actions";
import type { TaskFilters } from "@/lib/crm-actions";

type Task = Tables<"tasks">;
type Customer = Tables<"customers">;
type Assignee = { id: string; name: string };

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

type TaskFormProps = {
  task?: Task | null;
  customers: Customer[];
  assignees: Assignee[];
  initialCustomerId?: string;
  onClose: () => void;
};

function TaskForm({ task, customers, assignees, initialCustomerId, onClose }: TaskFormProps) {
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
          <label htmlFor="taskType" className="block text-sm font-medium">Type</label>
          <select id="taskType" name="taskType" defaultValue={task?.task_type ?? "TODO"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="FOLLOW_UP">Follow-up</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="priority" className="block text-sm font-medium">Priority</label>
          <select id="priority" name="priority" defaultValue={task?.priority ?? "medium"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={task?.status ?? "pending"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="block text-sm font-medium">Customer</label>
          <select id="customerId" name="customerId" defaultValue={task?.customer_id ?? initialCustomerId ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="">No customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="assignedTo" className="block text-sm font-medium">Assignee</label>
          <select id="assignedTo" name="assignedTo" defaultValue={task?.assigned_to ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="">Unassigned</option>
            {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="dueAt" className="block text-sm font-medium">Due date and time</label>
        <input id="dueAt" name="dueAt" type="datetime-local" defaultValue={task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
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

export function TasksView({ tasks, customers, assignees, initialCustomerId, filters, total, page, pageSize, totalPages }: { tasks: Task[]; customers: Customer[]; assignees: Assignee[]; initialCustomerId?: string; filters: TaskFilters; total: number; page: number; pageSize: number; totalPages: number }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.search ?? "");
  const [statusFilter] = useState(filters.status ?? "all");
  const [priorityFilter] = useState(filters.priority ?? "all");
  const [typeFilter] = useState(filters.type ?? "all");
  const [assignmentFilter] = useState(filters.assignment ?? "all");
  const [customerFilter] = useState(filters.customerId ?? "all");
  const [assigneeFilter] = useState(filters.assigneeId ?? "all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskState, setDeleteTaskState] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const completeHandlerRef = useRef<(taskId: string) => void>(() => {});
  const customerNames = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.name])), [customers]);

  const columns = useMemo<Column<Task>[]>(() => [
    {
      id: "title",
      header: "Task",
      cell: (row) => (
        <div>
          <Link href={`/tasks/${row.id}`} className="font-medium text-foreground hover:text-accent hover:underline">{row.title}</Link>
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
      id: "type",
      header: "Type",
      hideOnMobile: true,
      cell: (row) => row.task_type.replace("_", " "),
    },
    {
      id: "customer",
      header: "Customer",
      hideOnMobile: true,
      cell: (row) => row.customer_id ? customerNames.get(row.customer_id) ?? "Linked customer" : "—",
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
          {row.status !== "completed" && (
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs text-success"
              disabled={completingTaskId !== null}
              isLoading={completingTaskId === row.id}
              loadingText="Completing..."
              onClick={() => window.dispatchEvent(new CustomEvent("complete-task", { detail: row.id }))}
            >
              Complete
            </Button>
          )}
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
  ], [completingTaskId, customerNames]);

  async function runComplete(taskId: string) {
    if (completingTaskId) return;
    setStatusError(null);
    setCompletingTaskId(taskId);
    try {
      const result = await completeTask(taskId);
      if (result.success) {
        router.refresh();
      } else {
        setStatusError("Unable to complete this task. Please try again.");
      }
    } catch {
      setStatusError("Unable to complete this task. Please try again.");
    } finally {
      setCompletingTaskId(null);
    }
  }

  useEffect(() => {
    completeHandlerRef.current = runComplete;
  });

  useEffect(() => {
    // Page is managed server-side, no need to reset local state
  }, [assigneeFilter, assignmentFilter, customerFilter, priorityFilter, query, statusFilter, typeFilter]);

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

    function handleComplete(event: Event) {
      completeHandlerRef.current((event as CustomEvent<string>).detail);
    }

    window.addEventListener("edit-task", handleEdit);
    window.addEventListener("delete-task", handleDelete);
    window.addEventListener("complete-task", handleComplete);

    return () => {
      window.removeEventListener("edit-task", handleEdit);
      window.removeEventListener("delete-task", handleDelete);
      window.removeEventListener("complete-task", handleComplete);
    };
  }, []);

  function updateFilters(values: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...values, page: String(values.page ?? filters.page ?? 1) };
    Object.entries(merged).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5 text-sm font-medium">Search<input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") updateFilters({ search: (event.target as HTMLInputElement).value }); }} placeholder="Search tasks" className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" /></label>
          <label className="space-y-1.5 text-sm font-medium">Status<select value={statusFilter} onChange={(event) => updateFilters({ status: event.target.value })} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All</option><option value="pending">Todo</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
          <label className="space-y-1.5 text-sm font-medium">Priority<select value={priorityFilter} onChange={(event) => updateFilters({ priority: event.target.value })} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All</option><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
          <label className="space-y-1.5 text-sm font-medium">Type<select value={typeFilter} onChange={(event) => updateFilters({ type: event.target.value })} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All</option><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="FOLLOW_UP">Follow-up</option></select></label>
          <label className="space-y-1.5 text-sm font-medium">View<select value={assignmentFilter} onChange={(event) => updateFilters({ assignment: event.target.value })} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All tasks</option><option value="mine">My tasks</option><option value="others">Assigned to others</option><option value="today">Due today</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option></select></label>
          <label className="space-y-1.5 text-sm font-medium">Customer<select value={customerFilter} onChange={(event) => updateFilters({ customerId: event.target.value })} className="block max-w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label className="space-y-1.5 text-sm font-medium">Assignee<select value={assigneeFilter} onChange={(event) => updateFilters({ assigneeId: event.target.value })} className="block max-w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All assignees</option>{assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}</select></label>
        </div>
        <Button disabled={completingTaskId !== null} onClick={() => { setEditTask(null); setCreateOpen(true); }}>Add task</Button>
      </div>
      {statusError && (
        <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {statusError}
        </div>
      )}
      <div className="hidden md:block">
        <DataTable
          caption="Tasks"
          columns={columns}
          rows={tasks}
          getRowId={(row) => row.id}
          emptyIcon={<InboxIcon />}
          emptyTitle={total === 0 ? "No tasks yet" : "No matching tasks"}
          emptyDescription="Follow-ups and team work will appear in this list."
          emptyAction={<Button onClick={() => { setEditTask(null); setCreateOpen(true); }}>Add task</Button>}
        />
      </div>
      {total > pageSize && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Page {page} of {totalPages} ({total} total)</span><div className="flex gap-2"><Button variant="secondary" disabled={page === 1} onClick={() => updateFilters({ page: String(page - 1) })}>Previous</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => updateFilters({ page: String(page + 1) })}>Next</Button></div></div>}
      <div className="space-y-3 md:hidden">
        {total === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No tasks yet. Create a task to track customer follow-ups.</div>
        ) : tasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><p className="font-medium text-foreground">{task.title}</p><Badge tone={statusTone[task.status] ?? "neutral"}>{task.status.replace("_", " ")}</Badge></div>
            <p className="mt-2 text-xs text-muted-foreground">{customerNames.get(task.customer_id ?? "") || "No customer"} · {task.task_type.replace("_", " ")}</p>
            <div className="mt-3 flex items-center justify-between text-xs"><Badge tone={priorityTone[task.priority] ?? "neutral"}>{task.priority}</Badge><span className="text-muted-foreground">{task.due_date ? formatDueDate(task.due_date, true) : "No due date"}</span></div>
          </Link>
        ))}
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add task" description="Create a new task.">
        <TaskForm customers={customers} assignees={assignees} initialCustomerId={initialCustomerId} onClose={() => setCreateOpen(false)} />
      </Dialog>

      <Dialog open={!!editTask} onClose={() => setEditTask(null)} title="Edit task" description="Update task details.">
        {editTask && <TaskForm task={editTask} customers={customers} assignees={assignees} onClose={() => setEditTask(null)} />}
      </Dialog>

      <Dialog open={!!deleteTaskState} onClose={() => setDeleteTaskState(null)} title="Delete task" description="This action cannot be undone.">
        {deleteTaskState && <DeleteConfirm task={deleteTaskState} onClose={() => setDeleteTaskState(null)} />}
      </Dialog>
    </div>
  );
}