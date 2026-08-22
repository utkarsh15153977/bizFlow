"use client";

import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/icons";
import { getPageMeta } from "@/lib/navigation";

type HeaderProps = {
  mobileNavOpen: boolean;
  onOpenMobileNav: () => void;
};

export function Header({ mobileNavOpen, onOpenMobileNav }: HeaderProps) {
  const pathname = usePathname();
  const { title, description } = getPageMeta(pathname);

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
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
            Demo data
          </span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            aria-hidden="true"
          >
            JD
          </div>
          <span className="sr-only">Signed in as Jane Doe (placeholder)</span>
        </div>
      </div>
    </header>
  );
}
