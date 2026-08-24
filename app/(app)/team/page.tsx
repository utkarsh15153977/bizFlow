import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TeamView } from "@/components/team/team-view";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getOrganizationInvitations, getOrganizationMembers } from "@/lib/organization-actions";
import { canManageMembers } from "@/lib/auth/roles";

export default async function TeamPage() {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");
  const [members, invitations] = await Promise.all([getOrganizationMembers(), getOrganizationInvitations()]);
  return <div><PageHeader title="Team" description="Manage members and invitations for your workspace." /><TeamView members={members} invitations={invitations} currentUserId={context.user.id} canManage={canManageMembers(context.role)} /></div>;
}
