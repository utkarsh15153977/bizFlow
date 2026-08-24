import { redirect } from "next/navigation";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteAcceptance } from "@/components/team/invite-acceptance";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getOrganizationInvitationPreview } from "@/lib/organization-actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect(`/login?redirectTo=/invite/${(await params).token}`);
  const { token } = await params;
  const invitation = await getOrganizationInvitationPreview(token);
  return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Join your BizFlow workspace</CardTitle><CardDescription>Review the invitation before joining.</CardDescription></CardHeader><CardBody>{invitation ? <><div className="mb-5 space-y-2 text-sm"><p><span className="text-muted-foreground">Organization:</span> <span className="font-medium">{invitation.organizationName}</span></p><p><span className="text-muted-foreground">Invited email:</span> <span className="font-medium">{invitation.email}</span></p><p><span className="text-muted-foreground">Role:</span> <span className="font-medium capitalize">{invitation.role}</span></p><p><span className="text-muted-foreground">Expires:</span> <span className="font-medium">{new Date(invitation.expiresAt).toLocaleString()}</span></p></div><InviteAcceptance token={token} email={context.user.email} /></> : <p className="text-sm text-danger">This invitation is invalid or no longer active.</p>}</CardBody></Card></div>;
}
