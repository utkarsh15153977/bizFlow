"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { SearchField } from "@/components/ui/search-field";
import { Dialog } from "@/components/ui/dialog";
import type { Tables } from "@/types/database.types";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/crm-actions";

type Customer = Tables<"customers">;

const statusTone: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  lead: "warning",
};

const columns: Column<Customer>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <div>
        <Link href={`/customers/${row.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
          {row.name}
        </Link>
        <p className="text-muted-foreground md:hidden">{row.company ?? ""}</p>
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
    id: "email",
    header: "Email",
    hideOnMobile: true,
    cell: (row) => row.email ?? "",
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge tone={statusTone[row.status] ?? "neutral"}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  {
    id: "lastOrder",
    header: "Last order",
    hideOnMobile: true,
    cell: (row) =>
      row.last_order_at
        ? new Date(row.last_order_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
  },
  {
    id: "actions",
    header: "",
    hideOnMobile: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <Link href={`/customers/${row.id}`} className="text-xs font-medium text-accent hover:underline">
          View
        </Link>
        <Button
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => window.dispatchEvent(new CustomEvent("edit-customer", { detail: row }))}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="h-8 px-2 text-xs text-danger hover:text-danger"
          onClick={() => window.dispatchEvent(new CustomEvent("delete-customer", { detail: row }))}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

type CustomerFormProps = {
  customer?: Customer | null;
  onClose: () => void;
};

function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const isEdit = !!customer?.id;
  const action = isEdit ? updateCustomer : createCustomer;
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
        <p className="text-sm font-medium">Customer saved successfully.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={customer?.id ?? ""} />}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" name="name" required defaultValue={customer?.name ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="company" className="block text-sm font-medium">Company</label>
        <input id="company" name="company" defaultValue={customer?.company ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
        <input id="phone" name="phone" defaultValue={customer?.phone ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="website" className="block text-sm font-medium">Website</label>
        <input id="website" name="website" defaultValue={customer?.website ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <input id="address" name="address" defaultValue={customer?.address ?? ""} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="status" className="block text-sm font-medium">Status</label>
        <select id="status" name="status" defaultValue={customer?.status ?? "active"} className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="lead">Lead</option>
        </select>
      </div>
      {state?.error && (
        <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={isPending} loadingText="Saving...">Save customer</Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteCustomer, null);
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
        <p className="text-sm font-medium">Customer deleted.</p>
        <Button variant="secondary" className="mt-4" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={customer.id} />
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete <span className="font-medium text-foreground">{customer.name}</span>? This action cannot be undone.
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

export function CustomersView({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomerState, setDeleteCustomerState] = useState<Customer | null>(null);

  useEffect(() => {
    function handleEdit(event: Event) {
      setCreateOpen(false);
      setDeleteCustomerState(null);
      setEditCustomer((event as CustomEvent<Customer>).detail);
    }

    function handleDelete(event: Event) {
      setCreateOpen(false);
      setEditCustomer(null);
      setDeleteCustomerState((event as CustomEvent<Customer>).detail);
    }

    window.addEventListener("edit-customer", handleEdit);
    window.addEventListener("delete-customer", handleDelete);

    return () => {
      window.removeEventListener("edit-customer", handleEdit);
      window.removeEventListener("delete-customer", handleDelete);
    };
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    const matching = customers.filter((customer) =>
      (statusFilter === "all" || customer.status === statusFilter) &&
      [customer.name, customer.company ?? "", customer.email ?? "", customer.status]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );

    return [...matching].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [customers, query, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, statusFilter]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <SearchField
            id="customer-search"
            label="Search customers"
            value={query}
            onChange={setQuery}
            placeholder="Search by name, company, or email"
          />
          <label className="space-y-1.5 text-sm font-medium">
            <span className="block">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span className="block">Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal">
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
        <Button onClick={() => { setEditCustomer(null); setCreateOpen(true); }}>Add customer</Button>
      </div>
      <DataTable
        caption="Customers"
        columns={columns}
        rows={visibleCustomers}
        getRowId={(row) => row.id}
        emptyIcon={<InboxIcon />}
        emptyTitle={customers.length === 0 ? "No customers yet" : "No matching customers"}
        emptyDescription={
          customers.length === 0
            ? "When customers are added, they will appear in this table."
            : "Try a different search term to find a customer."
        }
        emptyAction={
          customers.length === 0 ? (
            <Button onClick={() => { setEditCustomer(null); setCreateOpen(true); }}>Add customer</Button>
          ) : undefined
        }
      />

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
            <Button variant="secondary" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add customer" description="Create a new customer account.">
        <CustomerForm onClose={() => setCreateOpen(false)} />
      </Dialog>

      <Dialog open={!!editCustomer} onClose={() => setEditCustomer(null)} title="Edit customer" description="Update customer details.">
        {editCustomer && <CustomerForm customer={editCustomer} onClose={() => setEditCustomer(null)} />}
      </Dialog>

      <Dialog open={!!deleteCustomerState} onClose={() => setDeleteCustomerState(null)} title="Delete customer" description="This action cannot be undone.">
        {deleteCustomerState && <DeleteConfirm customer={deleteCustomerState} onClose={() => setDeleteCustomerState(null)} />}
      </Dialog>
    </div>
  );
}
