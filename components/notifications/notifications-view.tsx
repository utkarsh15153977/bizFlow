"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markAllNotificationsAsRead, markNotificationAsRead, type Notification, type NotificationType } from "@/lib/notification-actions";
import type { NotificationFilters } from "@/lib/notification-actions";

const notificationTypes: NotificationType[] = ["TASK_ASSIGNED", "TASK_DUE_TODAY", "TASK_OVERDUE", "TASK_COMPLETED", "CUSTOMER_UPDATED", "CUSTOMER_ACTIVITY", "SYSTEM"];

export function NotificationsView({ notifications, filters, total, page, pageSize, totalPages }: { notifications: Notification[]; filters: NotificationFilters; total: number; page: number; pageSize: number; totalPages: number }) {
  const [readFilter, setReadFilter] = useState(filters.unreadOnly ? "unread" : "all");
  const [typeFilter, setTypeFilter] = useState(filters.type ?? "all");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function updateFilters(values: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...values, page: String(values.page ?? filters.page ?? 1) };
    Object.entries(merged).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
    startTransition(() => router.push(`/notifications?${params.toString()}`));
  }

  function markRead(id: string) {
    startTransition(async () => { await markNotificationAsRead(id); router.refresh(); });
  }

  function markAllRead() {
    startTransition(async () => { await markAllNotificationsAsRead(); router.refresh(); });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1.5 text-sm font-medium">State<select value={readFilter} onChange={(event) => { setReadFilter(event.target.value); updateFilters({ unreadOnly: event.target.value === "unread" ? "true" : "false" }); }} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select></label>
          <label className="space-y-1.5 text-sm font-medium">Type<select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); updateFilters({ type: event.target.value }); }} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"><option value="all">All types</option>{notificationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>
        <Button variant="secondary" disabled={pending || !notifications.some((notification) => !notification.is_read)} onClick={markAllRead}>Mark all as read</Button>
      </div>

      {notifications.length === 0 ? <EmptyState title="No notifications" description="You are all caught up." /> : <div className="space-y-3">{notifications.map((notification) => {
        const content = <div className={`rounded-xl border border-border bg-card p-4 shadow-sm ${notification.is_read ? "" : "border-l-4 border-l-accent"}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold text-foreground">{notification.title}</p><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p></div><Badge tone={notification.is_read ? "neutral" : "accent"}>{notification.is_read ? "Read" : "Unread"}</Badge></div><div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{new Date(notification.created_at).toLocaleString()}</span>{!notification.is_read && <button type="button" onClick={(event) => { event.preventDefault(); markRead(notification.id); }} className="font-medium text-accent hover:underline">Mark as read</button>}</div></div>;
        return notification.link ? <Link key={notification.id} href={notification.link} onClick={() => { if (!notification.is_read) markRead(notification.id); }}>{content}</Link> : <div key={notification.id}>{content}</div>;
      })}</div>}

      {total > pageSize && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Page {page} of {totalPages} ({total} total)</span><div className="flex gap-2"><Button variant="secondary" disabled={page === 1} onClick={() => updateFilters({ page: String(page - 1) })}>Previous</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => updateFilters({ page: String(page + 1) })}>Next</Button></div></div>}
    </div>
  );
}