import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  getDashboardStats,
  getLeadPipeline,
  getRecentActivities,
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

export default async function DashboardPage() {
  const [stats, pipeline, activities] = await Promise.all([
    getDashboardStats(),
    getLeadPipeline(),
    getRecentActivities(),
  ]);

  const statCards = [
    { id: "customers", label: "Total Customers", value: stats.totalCustomers.toString(), change: "Across workspace" },
    { id: "leads", label: "Active Leads", value: stats.activeLeads.toString(), change: "In pipeline" },
    { id: "tasks", label: "Pending Tasks", value: stats.pendingTasks.toString(), change: "Awaiting action" },
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
    </div>
  );
}
