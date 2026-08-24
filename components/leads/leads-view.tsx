"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { SearchField } from "@/components/ui/search-field";
import { Dialog } from "@/components/ui/dialog";
import type { Tables } from "@/types/database.types";
import { createLead, updateLead, deleteLead } from "@/lib/crm-actions";

type Lead = Tables<"leads">;

const stageTone: Record<string, "accent" | "success" | "warning" | "neutral"> = {
  new: "accent",
  contacted: "warning",
  qualified: "success",
  proposal: "warning",
  won: "success",
  lost: "neutral",
};

const columns: Column<Lead>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-muted-foreground md:hidden">{row.source}</p>
      </div>
    ),
  },
  {
    id: "company",
    header: "Company",
    hideOnMobile: true,
    cell: (row) => row.company ?? "",
  },
  {
    id: "source",
    header: "Source",
    hideOnMobile: true,
    cell: (row) => row.source,
  },
  {
    id: "email",
    header: "Email",
    hideOnMobile: true,
    cell: (row) => row.email ?? "",
  },
  {
    id: "stage",
    header: "Stage",
    cell: (row) => <Badge tone={stageTone[row.stage] ?? "neutral"}>{row.stage.replace("_", " ")}</Badge>,
  },
  {
    id: "estimatedValue",
    header: "Est. value",
    hideOnMobile: true,
    cell: (row) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.estimated_value || 0),
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
          onClick={() => window.dispatchEvent(new CustomEvent("edit-lead", { detail: row }))}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="h-8 px-2 text-xs text-danger hover:text-danger"
          onClick={() => window.dispatchEvent(new CustomEvent("delete-lead", { detail: row }))}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

type LeadFormProps = {
  lead?: Lead | null;
  onClose: () => void;
};

function LeadForm({ lead, onClose }: LeadFormProps) {
  const isEdit = !!lead?.id;
  const action = isEdit ? updateLead : createLead;
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
        <p className="text-sm font-medium">Lead saved successfully.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={lead?.id ?? ""} />}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" name="name" required defaultValue={lead?.name ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="company" className="block text-sm font-medium">Company</label>
        <input id="company" name="company" defaultValue={lead?.company ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
        <input id="phone" name="phone" defaultValue={lead?.phone ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="source" className="block text-sm font-medium">Source</label>
          <select id="source" name="source" defaultValue={lead?.source ?? "Inbound"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="stage" className="block text-sm font-medium">Stage</label>
          <select id="stage" name="stage" defaultValue={lead?.stage ?? "new"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="estimatedValue" className="block text-sm font-medium">Estimated value ($)</label>
        <input id="estimatedValue" name="estimatedValue" type="number" min="0" step="0.01" defaultValue={lead?.estimated_value?.toString() ?? "0"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      {state?.error && (
        <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={isPending} loadingText="Saving...">Save lead</Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteLead, null);
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
        <p className="text-sm font-medium">Lead deleted.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={lead.id} />
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{lead.name}</span>? This action cannot be undone.
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

export function LeadsView({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLeadState, setDeleteLeadState] = useState<Lead | null>(null);

  useEffect(() => {
    function handleEdit(event: Event) {
      setCreateOpen(false);
      setDeleteLeadState(null);
      setEditLead((event as CustomEvent<Lead>).detail);
    }

    function handleDelete(event: Event) {
      setCreateOpen(false);
      setEditLead(null);
      setDeleteLeadState((event as CustomEvent<Lead>).detail);
    }

    window.addEventListener("edit-lead", handleEdit);
    window.addEventListener("delete-lead", handleDelete);

    return () => {
      window.removeEventListener("edit-lead", handleEdit);
      window.removeEventListener("delete-lead", handleDelete);
    };
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return leads;
    return leads.filter((lead) =>
      [lead.name, lead.company ?? "", lead.source, lead.email ?? "", lead.stage]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [leads, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {leads.length > 0 && (
          <SearchField
            id="lead-search"
            label="Search leads"
            value={query}
            onChange={setQuery}
            placeholder="Search by name, source, or email"
          />
        )}
        <Button onClick={() => { setEditLead(null); setCreateOpen(true); }}>Add lead</Button>
      </div>
      <DataTable
        caption="Leads"
        columns={columns}
        rows={filtered}
        getRowId={(row) => row.id}
        emptyIcon={<InboxIcon />}
        emptyTitle={leads.length === 0 ? "No leads yet" : "No matching leads"}
        emptyDescription={
          leads.length === 0
            ? "New opportunities will show up here as a clean pipeline table."
            : "Try a different search term to find a lead."
        }
        emptyAction={
          leads.length === 0 ? (
            <Button onClick={() => { setEditLead(null); setCreateOpen(true); }}>Add lead</Button>
          ) : undefined
        }
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add lead" description="Create a new sales lead.">
        <LeadForm onClose={() => setCreateOpen(false)} />
      </Dialog>

      <Dialog open={!!editLead} onClose={() => setEditLead(null)} title="Edit lead" description="Update lead details.">
        {editLead && <LeadForm lead={editLead} onClose={() => setEditLead(null)} />}
      </Dialog>

      <Dialog open={!!deleteLeadState} onClose={() => setDeleteLeadState(null)} title="Delete lead" description="This action cannot be undone.">
        {deleteLeadState && <DeleteConfirm lead={deleteLeadState} onClose={() => setDeleteLeadState(null)} />}
      </Dialog>
    </div>
  );
}
