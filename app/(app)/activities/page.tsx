import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ActivitiesView } from "@/components/activities/activities-view";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getActivities, getActivityOptions } from "@/lib/analytics-actions";

type ActivitiesPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");
  const params = await searchParams;
  const filters = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""]));
  const [result, options] = await Promise.all([
    getActivities({ page: Number(filters.page || "1"), pageSize: 20, search: filters.search, type: filters.type, customerId: filters.customerId, userId: filters.userId, from: filters.from, to: filters.to }),
    getActivityOptions(),
  ]);
  return <div><PageHeader title="Activities" description="Review customer and workspace activity." /><ActivitiesView rows={result.rows} total={result.total} customers={options.customers} users={options.users} filters={filters} /></div>;
}
