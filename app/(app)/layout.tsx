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
    ? await Promise.all([getNotifications({ limit: 5 }), getUnreadNotificationCount()])
    : [[], 0];

  return (
    <DashboardShell userContext={userContext} notifications={notifications} unreadCount={unreadCount}>
      {children}
    </DashboardShell>
  );
}
