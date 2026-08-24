"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getAnalytics } from "@/lib/analytics-actions";

type Analytics = NonNullable<Awaited<ReturnType<typeof getAnalytics>>>;

function BarList({ title, values }: { title: string; values: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(values));
  return <div><h3 className="text-sm font-semibold text-foreground">{title}</h3><div className="mt-3 space-y-2">{Object.entries(values).length === 0 ? <p className="text-sm text-muted-foreground">No data in this period.</p> : Object.entries(values).map(([label, value]) => <div key={label}><div className="flex justify-between gap-3 text-xs"><span className="capitalize text-muted-foreground">{label.replaceAll("_", " ")}</span><span className="font-medium text-foreground">{value}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-accent" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div></div>;
}

export function AnalyticsPanel({ analytics, from, to }: { analytics: Analytics; from?: string; to?: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState("30");
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  function apply(value: string) {
    const now = new Date();
    let start = "";
    if (value === "7" || value === "30" || value === "90") start = new Date(now.getTime() - Number(value) * 86400000).toISOString().slice(0, 10);
    if (value === "year") start = `${now.getFullYear()}-01-01`;
    if (value === "custom") { start = customFrom; }
    const params = new URLSearchParams();
    if (start) params.set("from", start);
    const end = value === "custom" ? customTo : now.toISOString().slice(0, 10);
    if (end) params.set("to", end);
    router.push(`/?${params.toString()}`);
  }
  return <Card className="mt-6"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Analytics</CardTitle><CardDescription>Real workspace trends for the selected period.</CardDescription></div><div className="flex flex-wrap items-end gap-2"><select value={preset} onChange={(event) => { setPreset(event.target.value); if (event.target.value !== "custom") apply(event.target.value); }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="year">This year</option><option value="custom">Custom</option></select>{preset === "custom" && <><input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => apply("custom")} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">Apply</button></>}</div></div></CardHeader><CardBody><div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs text-muted-foreground">Customers created</p><p className="mt-1 text-2xl font-semibold">{analytics.customerMetrics.created}</p><p className="mt-1 text-xs text-muted-foreground">{analytics.customerMetrics.active} active, {analytics.customerMetrics.inactive} inactive</p></div><div><p className="text-xs text-muted-foreground">Tasks</p><p className="mt-1 text-2xl font-semibold">{analytics.taskMetrics.total}</p><p className="mt-1 text-xs text-muted-foreground">{analytics.taskMetrics.open} open, {analytics.taskMetrics.completed} completed</p></div><div><p className="text-xs text-muted-foreground">Activities created</p><p className="mt-1 text-2xl font-semibold">{analytics.activityMetrics.created}</p><p className="mt-1 text-xs text-muted-foreground">{analytics.performance.completionRate}% task completion rate</p></div><div><p className="text-xs text-muted-foreground">Overdue task rate</p><p className="mt-1 text-2xl font-semibold">{analytics.performance.overdueRate}%</p><p className="mt-1 text-xs text-muted-foreground">{analytics.taskMetrics.overdue} overdue tasks</p></div></div><div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4"><BarList title="Activities by type" values={analytics.activityMetrics.byType} /><BarList title="Task status" values={analytics.series.taskStatuses} /><BarList title="Customer status" values={analytics.series.customerStatuses} /><BarList title="Customers created by day" values={analytics.series.customersCreated} /></div></CardBody></Card>;
}
