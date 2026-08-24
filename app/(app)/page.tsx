import { RecentActivity } from "@/components/dashboard/recent-activity";
import Link from "next/link";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { getAnalytics } from "@/lib/analytics-actions";
import {
  getDashboardStats,
  getLeadPipeline,
  getRecentCustomers,
  getRecentActivities,
  getTaskDashboardMetrics,
  getUpcomingTasks,
  getOverdueTasks,
} from "@/lib/crm-actions";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const [stats, pipeline, activities, recentCustomers, taskMetrics, upcomingTasks, overdueTasks, analytics] = await Promise.all([
    getDashboardStats(),
    getLeadPipeline(),
    getRecentActivities(),
    getRecentCustomers(),
    getTaskDashboardMetrics(),
    getUpcomingTasks(),
    getOverdueTasks(),
    getAnalytics({ from: params.from, to: params.to }),
  ]);

  const statCards = [
    { id: "customers", label: "Total Customers", value: stats.totalCustomers.toString(), change: "Across workspace" },
    { id: "active-customers", label: "Active Customers", value: stats.activeCustomers.toString(), change: "Current accounts" },
    { id: "new-customers", label: "New Customers", value: stats.newCustomers.toString(), change: "Last 30 days" },
    { id: "leads", label: "Active Leads", value: stats.activeLeads.toString(), change: "In pipeline" },
    { id: "tasks", label: "Pending Tasks", value: stats.pendingTasks.toString(), change: "Awaiting action" },
    { id: "total-tasks", label: "Total Tasks", value: taskMetrics.total.toString(), change: "Across workspace" },
    {
      id: "revenue",
      label: "Pipeline Value",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(stats.pipelineValue),
      change: "Active opportunities",
    },
    { id: "open-tasks", label: "My Open Tasks", value: taskMetrics.myOpen.toString(), change: "Assigned to you" },
    { id: "due-today", label: "Due Today", value: taskMetrics.dueToday.toString(), change: "Open tasks" },
    { id: "overdue", label: "Overdue", value: taskMetrics.overdue.toString(), change: "Needs attention" },
    { id: "completed-week", label: "Completed This Week", value: taskMetrics.completedThisWeek.toString(), change: "Task progress" },
  ];

  const mappedActivities = activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    detail: activity.detail ?? "",
    time: timeAgo(activity.created_at),
  }));

  const mappedPipeline = pipeline.map((item) => ({
    label: item.stage.replace("_", " "),
    value: item.count,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of customers, pipeline, tasks, and revenue."
      />

      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RevenueOverview data={mappedPipeline} />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity items={mappedActivities} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent customers</h2>
            <p className="mt-1 text-sm text-muted-foreground">The latest accounts added to your workspace.</p>
          </div>
          <Link href="/customers" className="text-sm font-medium text-accent hover:underline">View all</Link>
        </div>
        {recentCustomers.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">No customers have been added yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {recentCustomers.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{customer.company || customer.email || "No company details"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Upcoming tasks</h2>
          {upcomingTasks.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No upcoming tasks.</p> : <div className="mt-4 divide-y divide-border">{upcomingTasks.slice(0, 5).map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="truncate text-sm font-medium">{task.title}</span><span className="shrink-0 text-xs text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleString() : "No due date"}</span></Link>)}</div>}
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-danger">Overdue tasks</h2>
          {overdueTasks.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No overdue tasks.</p> : <div className="mt-4 divide-y divide-danger/10">{overdueTasks.slice(0, 5).map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="truncate text-sm font-medium text-foreground">{task.title}</span><span className="shrink-0 text-xs text-danger">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Overdue"}</span></Link>)}</div>}
        </div>
      </section>
      {analytics && <AnalyticsPanel analytics={analytics} from={params.from} to={params.to} />}
    </div>
  );
}
