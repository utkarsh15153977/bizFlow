"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityRecord } from "@/lib/analytics-actions";
import { exportBusinessCsv } from "@/lib/analytics-actions";

type Option = { id: string; name: string };

function downloadCsv(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bizflow-activities.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ActivitiesView({ rows, total, customers, users, filters }: { rows: ActivityRecord[]; total: number; customers: Option[]; users: Option[]; filters: Record<string, string> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search ?? "");
  const [exporting, setExporting] = useState(false);
  const page = Number(filters.page ?? "1");
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const updateFilters = (values: Record<string, string>, options?: { keepPage?: boolean }) => {
    const params = new URLSearchParams();
    const merged: Record<string, string> = { ...filters, ...values };
    if (!options?.keepPage) merged.page = "1";
    Object.entries(merged).forEach(([key, value]) => { if (value) params.set(key, value); });
    startTransition(() => router.push(`/activities?${params.toString()}`));
  };
  const columns: Column<ActivityRecord>[] = [
    { id: "type", header: "Type", cell: (row) => <Badge tone="accent">{row.entity_type}</Badge> },
    { id: "title", header: "Activity", cell: (row) => <Link href={`/activities/${row.id}`} className="font-medium text-foreground hover:text-accent hover:underline">{row.title}</Link> },
    { id: "customer", header: "Customer", hideOnMobile: true, cell: (row) => row.customerName ? <Link href={`/customers/${row.entity_id}`} className="text-accent hover:underline">{row.customerName}</Link> : "—" },
    { id: "creator", header: "Created by", hideOnMobile: true, cell: (row) => row.creatorName ?? "System" },
    { id: "created", header: "Created", cell: (row) => new Date(row.created_at).toLocaleString() },
  ];

  async function exportActivities() {
    setExporting(true);
    const csv = await exportBusinessCsv("activities", filters);
    if (csv) downloadCsv(csv);
    setExporting(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 space-y-1.5 text-sm font-medium">Search<input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") updateFilters({ search }); }} placeholder="Search activity, customer, creator" className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" /></label>
        <label className="space-y-1.5 text-sm font-medium">Type<select value={filters.type ?? ""} onChange={(event) => updateFilters({ type: event.target.value })} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="">All types</option><option value="customer">Customer</option><option value="task">Task</option><option value="organization">Organization</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Customer<select value={filters.customerId ?? ""} onChange={(event) => updateFilters({ customerId: event.target.value })} className="block max-w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Creator<select value={filters.userId ?? ""} onChange={(event) => updateFilters({ userId: event.target.value })} className="block max-w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="">All creators</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Date<select value={filters.preset ?? ""} onChange={(event) => { const value = event.target.value; const days = value === "today" ? 0 : value === "7" ? 6 : value === "30" ? 29 : value === "90" ? 89 : null; const from = days === null ? "" : new Date(Date.now() - days * 86400000).toISOString().slice(0, 10); updateFilters({ preset: value, from, to: value ? new Date().toISOString().slice(0, 10) : "" }); }} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="">All time</option><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
        <Button variant="secondary" disabled={pending} onClick={() => { setSearch(""); router.push("/activities"); }}>Clear filters</Button>
        <Button variant="secondary" disabled={exporting} onClick={exportActivities}>{exporting ? "Exporting..." : "Export CSV"}</Button>
      </div>
      {rows.length === 0 ? <EmptyState title="No activities" description="Activity recorded across your workspace will appear here." /> : <><div className="hidden md:block"><DataTable caption="Activities" columns={columns} rows={rows} getRowId={(row) => row.id} emptyTitle="No activities" emptyDescription="No activities match these filters." /></div><div className="space-y-3 md:hidden">{rows.map((row) => <Link key={row.id} href={`/activities/${row.id}`} className="block rounded-xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="font-medium">{row.title}</p><Badge tone="accent">{row.entity_type}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{row.customerName || row.creatorName || "System"}</p><time className="mt-2 block text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</time></Link>)}</div></>}
      {total > pageSize && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Page {page} of {pageCount} ({total} total)</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1 || pending} onClick={() => updateFilters({ page: String(page - 1) }, { keepPage: true })}>Previous</Button><Button variant="secondary" disabled={page >= pageCount || pending} onClick={() => updateFilters({ page: String(page + 1) }, { keepPage: true })}>Next</Button></div></div>}
    </div>
  );
}
