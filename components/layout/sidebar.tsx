"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, navIcons } from "@/components/icons";
import { isNavActive, navItems } from "@/lib/navigation";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-foreground/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          className="h-full w-full cursor-default"
          onClick={onClose}
          tabIndex={mobileOpen ? 0 : -1}
          aria-label="Close navigation"
        />
      </div>

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 rounded-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
              BF
            </span>
            <span className="text-base font-semibold tracking-tight">BizFlow</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Main">
          {navItems.map((item) => {
            const Icon = navIcons[item.href];
            const active = isNavActive(item.href, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-hover text-white"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs font-medium text-sidebar-muted">Workspace</p>
          <p className="mt-1 text-sm">BizFlow Demo</p>
        </div>
      </aside>
    </>
  );
}
