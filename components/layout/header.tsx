"use client";

import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/icons";
import { getPageMeta } from "@/lib/navigation";
import { UserNav } from "@/components/layout/user-nav";
import type { CurrentUserContext } from "@/lib/auth/actions";
import type { Notification } from "@/lib/notification-actions";
import { NotificationCenter } from "@/components/notifications/notification-center";

type HeaderProps = {
  mobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  userContext?: CurrentUserContext;
  notifications?: Notification[];
  unreadCount?: number;
};

export function Header({
  mobileNavOpen,
  onOpenMobileNav,
  userContext,
  notifications,
  unreadCount,
}: HeaderProps) {
  const pathname = usePathname();
  const { title, description } = getPageMeta(pathname);

  const userPayload = userContext?.user
    ? {
        email: userContext.user.email,
        fullName: userContext.profile?.full_name,
        avatarUrl: userContext.profile?.avatar_url,
        workspaceName: userContext.organization?.name,
        role: userContext.role,
      }
    : null;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={mobileNavOpen}
        >
          <MenuIcon />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!userContext?.user && (
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
              Demo mode
            </span>
          )}
          {userContext?.user && (
            <NotificationCenter
              notifications={notifications ?? []}
              unreadCount={unreadCount ?? 0}
            />
          )}
          <UserNav user={userPayload} />
        </div>
      </div>
    </header>
  );
}
