"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BellIcon } from "@/components/icons";
import { markAllNotificationsAsRead, markNotificationAsRead, type Notification } from "@/lib/notification-actions";

export function NotificationCenter({ notifications, unreadCount }: { notifications: Notification[]; unreadCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationAsRead(id);
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} disabled={pending} className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications" aria-expanded={open}>
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-2 py-2"><p className="text-sm font-semibold text-foreground">Notifications</p><button type="button" onClick={markAllRead} disabled={pending || unreadCount === 0} className="text-xs font-medium text-accent disabled:opacity-50">Mark all read</button></div>
        {notifications.length === 0 ? <p className="px-2 py-5 text-sm text-muted-foreground">No notifications yet.</p> : <div className="max-h-80 overflow-y-auto">{notifications.map((notification) => <div key={notification.id} className={`rounded-lg px-2 py-3 ${notification.is_read ? "" : "bg-accent/5"}`}><Link href={notification.link || "/notifications"} onClick={() => { if (!notification.is_read) markRead(notification.id); setOpen(false); }} className="block"><p className="text-sm font-medium text-foreground">{notification.title}</p><p className="mt-1 text-xs text-muted-foreground">{notification.message}</p><time className="mt-1 block text-[11px] text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</time></Link>{!notification.is_read && <button type="button" onClick={() => markRead(notification.id)} className="mt-1 text-xs font-medium text-accent">Mark as read</button>}</div>)}</div>}
        <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-2 pt-2 text-center text-xs font-medium text-accent hover:underline">View all notifications</Link>
      </div>}
    </div>
  );
}