"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptOrganizationInvitation } from "@/lib/organization-actions";

export function InviteAcceptance({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span>. Accepting this invitation will add this account to the workspace.</p>{error && <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}<Button className="w-full" isLoading={pending} loadingText="Accepting..." onClick={() => { setError(null); startTransition(async () => { const result = await acceptOrganizationInvitation(token); if (result.error) setError(result.error); else router.push("/"); }); }}>Accept invitation</Button></div>;
}
