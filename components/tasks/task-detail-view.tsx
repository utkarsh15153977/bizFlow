"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";
import { completeTask, deleteTask, reopenTask, updateTask } from "@/lib/crm-actions";

type Task = Tables<"tasks">;
type Customer = Tables<"customers">;
type Assignee = { id: string; name: string };

type Result = { error?: string; success?: boolean };

const priorityTone: Record<string, "danger" | "warning" | "neutral" | "accent"> = { urgent: "danger", high: "warning", medium: "accent", low: "neutral" };
const statusTone: Record<string, "warning" | "accent" | "success" | "neutral"> = { pending: "warning", in_progress: "accent", completed: "success", cancelled: "neutral" };

export function TaskDetailView({ task, customerName, assigneeName, creatorName, customers, assignees }: { task: Task; customerName?: string; assigneeName?: string; creatorName?: string; customers: Customer[]; assignees: Assignee[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [actionState, setActionState] = useState<Result | null>(null);
  const [updateState, updateAction, updatePending] = useActionState(updateTask, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTask, null);
  const [statusPending, setStatusPending] = useState(false);

  useEffect(() => {
    if (updateState?.success) { setEditing(false); router.refresh(); }
  }, [router, updateState?.success]);
  useEffect(() => {
    if (deleteState?.success) router.push("/tasks");
  }, [deleteState?.success, router]);

  async function changeStatus(action: (id: string) => Promise<Result>) {
    setActionState(null);
    setStatusPending(true);
    const result = await action(task.id);
    setStatusPending(false);
    setActionState(result);
    if (result.success) router.refresh();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/tasks" className="text-sm font-medium text-accent hover:underline">Back to tasks</Link>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? "Cancel edit" : "Edit task"}</Button>
        {task.status === "completed" ? <Button variant="secondary" disabled={statusPending} onClick={() => changeStatus(reopenTask)}>Reopen</Button> : <Button disabled={statusPending} onClick={() => changeStatus(completeTask)}>Complete</Button>}
        <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("Are you sure you want to delete this task?")) event.preventDefault(); }}><input type="hidden" name="id" value={task.id} /><Button type="submit" variant="danger" isLoading={deletePending} loadingText="Deleting...">Delete</Button></form>
      </div>
      {(actionState?.error || deleteState?.error) && <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{actionState?.error || deleteState?.error}</div>}
      {editing ? <Card><CardHeader><CardTitle>Edit task</CardTitle><CardDescription>Update task details.</CardDescription></CardHeader><CardBody><form action={updateAction} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={task.id} /><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Title<input name="title" required defaultValue={task.title} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Description<textarea name="description" rows={3} defaultValue={task.description ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label><label className="space-y-1.5 text-sm font-medium">Type<select name="taskType" defaultValue={task.task_type} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option value="TODO">To-do</option><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="FOLLOW_UP">Follow-up</option></select></label><label className="space-y-1.5 text-sm font-medium">Status<select name="status" defaultValue={task.status} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option value="pending">Todo</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label className="space-y-1.5 text-sm font-medium">Priority<select name="priority" defaultValue={task.priority} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label><label className="space-y-1.5 text-sm font-medium">Due date and time<input name="dueAt" type="datetime-local" defaultValue={task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label><label className="space-y-1.5 text-sm font-medium">Customer<select name="customerId" defaultValue={task.customer_id ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option value="">No customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label className="space-y-1.5 text-sm font-medium">Assignee<select name="assignedTo" defaultValue={task.assigned_to ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option value="">Unassigned</option>{assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}</select></label>{updateState?.error && <div role="alert" className="sm:col-span-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{updateState.error}</div>}<div className="sm:col-span-2"><Button type="submit" isLoading={updatePending} loadingText="Saving...">Save task</Button></div></form></CardBody></Card> : <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{task.title}</CardTitle><CardDescription>{task.description || "No description"}</CardDescription></div><div className="flex gap-2"><Badge tone={priorityTone[task.priority]}>{task.priority}</Badge><Badge tone={statusTone[task.status]}>{task.status.replace("_", " ")}</Badge></div></div></CardHeader><CardBody className="grid gap-5 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">Type</p><p className="mt-1 font-medium">{task.task_type.replace("_", " ")}</p></div><div><p className="text-muted-foreground">Customer</p><p className="mt-1 font-medium">{customerName || "No customer"}</p></div><div><p className="text-muted-foreground">Assignee</p><p className="mt-1 font-medium">{assigneeName || "Unassigned"}</p></div><div><p className="text-muted-foreground">Created by</p><p className="mt-1 font-medium">{creatorName || "Unavailable"}</p></div><div><p className="text-muted-foreground">Due</p><p className="mt-1 font-medium">{task.due_date ? new Date(task.due_date).toLocaleString() : "No due date"}</p></div><div><p className="text-muted-foreground">Completed</p><p className="mt-1 font-medium">{task.completed_at ? new Date(task.completed_at).toLocaleString() : "Not completed"}</p></div><div><p className="text-muted-foreground">Created</p><p className="mt-1 font-medium">{new Date(task.created_at).toLocaleString()}</p></div><div><p className="text-muted-foreground">Updated</p><p className="mt-1 font-medium">{new Date(task.updated_at).toLocaleString()}</p></div></CardBody></Card>}
    </div>
  );
}
