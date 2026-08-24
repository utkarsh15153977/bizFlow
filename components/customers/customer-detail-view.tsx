"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";
import {
  createCustomerActivity,
  deleteCustomer,
  updateCustomer,
} from "@/lib/crm-actions";

type Customer = Tables<"customers">;
type Activity = Tables<"activities">;
type Task = Tables<"tasks">;

const statusTone: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  lead: "warning",
};

export function CustomerDetailView({
  customer,
  activities,
  tasks,
}: {
  customer: Customer;
  activities: Activity[];
  tasks: Task[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateCustomer, null);
  const [activityState, activityAction, activityPending] = useActionState(createCustomerActivity, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCustomer, null);

  useEffect(() => {
    if (updateState?.success || activityState?.success) router.refresh();
  }, [activityState?.success, router, updateState?.success]);

  useEffect(() => {
    if (deleteState?.success) router.push("/customers");
  }, [deleteState?.success, router]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/customers" className="text-sm font-medium text-accent hover:underline">
          Back to customers
        </Link>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel edit" : "Edit customer"}
        </Button>
        <form action={deleteAction} onSubmit={(event) => {
          if (!window.confirm(`Delete ${customer.name}? This action cannot be undone.`)) event.preventDefault();
        }}>
          <input type="hidden" name="id" value={customer.id} />
          <Button type="submit" variant="danger" isLoading={deletePending} loadingText="Deleting...">Delete</Button>
        </form>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit customer</CardTitle>
            <CardDescription>Update the fields stored on this customer account.</CardDescription>
          </CardHeader>
          <CardBody>
            <form action={updateAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={customer.id} />
              <label className="space-y-1.5 text-sm font-medium">Name<input name="name" required defaultValue={customer.name} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Company<input name="company" defaultValue={customer.company ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Email<input name="email" type="email" defaultValue={customer.email ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Phone<input name="phone" defaultValue={customer.phone ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Website<input name="website" type="url" defaultValue={customer.website ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Address<input name="address" defaultValue={customer.address ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
              <label className="space-y-1.5 text-sm font-medium">Status<select name="status" defaultValue={customer.status} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option value="active">Active</option><option value="inactive">Inactive</option><option value="lead">Lead</option></select></label>
              {updateState?.error && <div role="alert" className="sm:col-span-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{updateState.error}</div>}
              <div className="sm:col-span-2"><Button type="submit" isLoading={updatePending} loadingText="Saving...">Save customer</Button></div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div><CardTitle>Customer information</CardTitle><CardDescription>Contact and account information.</CardDescription></div>
              <Badge tone={statusTone[customer.status] ?? "neutral"}>{customer.status}</Badge>
            </div>
          </CardHeader>
          <CardBody className="grid gap-5 text-sm sm:grid-cols-2">
            <div><p className="text-muted-foreground">Company</p><p className="mt-1 font-medium">{customer.company || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Email</p><p className="mt-1 font-medium">{customer.email || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p className="mt-1 font-medium">{customer.phone || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Website</p><p className="mt-1 font-medium">{customer.website || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Address</p><p className="mt-1 font-medium">{customer.address || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Created</p><p className="mt-1 font-medium">{new Date(customer.created_at).toLocaleDateString()}</p></div>
            <div><p className="text-muted-foreground">Updated</p><p className="mt-1 font-medium">{new Date(customer.updated_at).toLocaleDateString()}</p></div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Activity</CardTitle><CardDescription>Calls, emails, meetings, notes, and follow-ups for this customer.</CardDescription></CardHeader>
        <CardBody>
          <form action={activityAction} className="grid gap-3 border-b border-border pb-5 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <input type="hidden" name="customerId" value={customer.id} />
            <label className="space-y-1.5 text-sm font-medium">Type<select name="title" defaultValue="Note" className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"><option>Call</option><option>Email</option><option>Meeting</option><option>Note</option><option>Follow-up</option></select></label>
            <label className="space-y-1.5 text-sm font-medium">Details<input name="detail" placeholder="Add a note about this activity" className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" /></label>
            <Button type="submit" isLoading={activityPending} loadingText="Adding...">Add activity</Button>
          </form>
          {activityState?.error && <div role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{activityState.error}</div>}
          {activities.length === 0 ? <p className="pt-5 text-sm text-muted-foreground">No activity recorded yet.</p> : <div className="divide-y divide-border">{activities.map((activity) => <div key={activity.id} className="py-4 first:pt-5"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{activity.title}</p><time className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</time></div>{activity.detail && <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>}</div>)}</div>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle>Tasks</CardTitle><CardDescription>Follow-ups and work associated with this customer.</CardDescription></div><Link href={`/tasks?customer=${customer.id}`} className="text-sm font-medium text-accent hover:underline">Add task</Link></div></CardHeader>
        <CardBody>
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks for this customer yet.</p> : <div className="divide-y divide-border">{tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleString() : "No due date"}</p></div><Badge tone={task.status === "completed" ? "success" : task.due_date && new Date(task.due_date) < new Date() ? "danger" : "warning"}>{task.status.replace("_", " ")}</Badge></Link>)}</div>}
        </CardBody>
      </Card>
      {deleteState?.error && <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{deleteState.error}</div>}
    </div>
  );
}
