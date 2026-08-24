import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getNotifications } from "@/lib/notification-actions";

export default async function NotificationsPage() {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");

  const notifications = await getNotifications();
  return (
    <div>
      <PageHeader title="Notifications" description="Stay up to date with activity in your BizFlow workspace." />
      <NotificationsView notifications={notifications} />
    </div>
  );
}
