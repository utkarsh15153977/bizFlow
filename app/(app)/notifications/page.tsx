import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getNotifications, type NotificationFilters } from "@/lib/notification-actions";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<NotificationFilters> }) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");

  const params = await searchParams;
  const filters: NotificationFilters = {
    page: params.page ? Number(params.page) : 1,
    pageSize: params.pageSize ? Number(params.pageSize) : 10,
    unreadOnly: String(params.unreadOnly) === "true",
    type: params.type as "TASK_ASSIGNED" | "TASK_DUE_TODAY" | "TASK_OVERDUE" | "TASK_COMPLETED" | "CUSTOMER_UPDATED" | "CUSTOMER_ACTIVITY" | "SYSTEM" | undefined,
  };
  const result = await getNotifications(filters);

  return (
    <div>
      <PageHeader title="Notifications" description="Stay up to date with activity in your BizFlow workspace." />
      <NotificationsView notifications={result.data} filters={filters} total={result.total} page={result.page} pageSize={result.pageSize} totalPages={result.totalPages} />
    </div>
  );
}
