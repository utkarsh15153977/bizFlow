import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  dashboardStats,
  monthlyRevenue,
  recentActivity,
} from "@/lib/mock-data";

export default function DashboardPage() {
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
        {dashboardStats.map((stat) => (
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
          <RevenueOverview data={monthlyRevenue} />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity items={recentActivity} />
        </div>
      </section>
    </div>
  );
}
