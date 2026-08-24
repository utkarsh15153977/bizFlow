"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";

type UserNavProps = {
  user?: {
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    workspaceName?: string | null;
    role?: string | null;
  } | null;
};

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "BF";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {user?.workspaceName && (
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {user.workspaceName}
                </span>
              )}
              {user?.role && (
                <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-medium capitalize text-accent">
                  {user.role}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              role="menuitem"
            >
              Profile
            </Link>
            <Link
              href="/team"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              role="menuitem"
            >
              Team
            </Link>
            <Link
              href="/organization"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              role="menuitem"
            >
              Organization
            </Link>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              role="menuitem"
            >
              Notifications
            </Link>
          </div>

          <div className="border-t border-border pt-1">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
                role="menuitem"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
