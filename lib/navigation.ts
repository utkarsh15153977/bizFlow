export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/leads", label: "Leads" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
  { href: "/notifications", label: "Notifications" },
  { href: "/team", label: "Team" },
  { href: "/organization", label: "Organization" },
] as const;

export const pageTitles: Record<string, { title: string; description: string }> =
  {
    "/": {
      title: "Dashboard",
      description: "Overview of your operations at a glance.",
    },
    "/customers": {
      title: "Customers",
      description: "Manage customer accounts and relationships.",
    },
    "/leads": {
      title: "Leads",
      description: "Track inbound interest and sales opportunities.",
    },
    "/tasks": {
      title: "Tasks",
      description: "Stay on top of follow-ups and team work.",
    },
    "/settings": {
      title: "Settings",
      description: "Workspace preferences for your BizFlow account.",
    },
    "/profile": {
      title: "Profile",
      description: "Your personal account and workspace membership.",
    },
    "/notifications": {
      title: "Notifications",
      description: "Stay up to date with workspace activity.",
    },
    "/team": { title: "Team", description: "Manage your workspace members." },
    "/organization": { title: "Organization", description: "Workspace details and membership." },
  };

export function isNavActive(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageMeta(pathname: string) {
  return (
    pageTitles[pathname] ?? {
      title: "BizFlow",
      description: "Operations platform",
    }
  );
}
