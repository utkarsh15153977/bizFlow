import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUserContext } from "@/lib/auth/actions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const userContext = await getCurrentUserContext();

  return (
    <DashboardShell userContext={userContext}>
      {children}
    </DashboardShell>
  );
}
