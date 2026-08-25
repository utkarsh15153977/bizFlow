import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notification-actions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const userContext = await getCurrentUserContext();
  const [notifications, unreadCount] = userContext.user
    ? await Promise.all([getNotifications({ page: 1, pageSize: 5 }), getUnreadNotificationCount()])
    : [[], 0];

  // Extract data from paginated result
  const notificationData = Array.isArray(notifications) ? notifications : notifications.data;

  return (
    <DashboardShell userContext={userContext} notifications={notificationData} unreadCount={unreadCount}>
      {children}
    </DashboardShell>
  );
}
