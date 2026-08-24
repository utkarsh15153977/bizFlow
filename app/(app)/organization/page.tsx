import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { OrganizationForm } from "@/components/organization/organization-form";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getOrganizationMembers } from "@/lib/organization-actions";

export default async function OrganizationPage() {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization) redirect("/login");
  const members = await getOrganizationMembers();
  const owner = members.find((member) => member.role === "owner");
  return <div><PageHeader title="Organization" description="Workspace details and organization settings." /><OrganizationForm organization={context.organization} memberCount={members.length} ownerName={owner?.profile?.full_name || owner?.profile?.email || "Unavailable"} role={context.role || "member"} /></div>;
}
