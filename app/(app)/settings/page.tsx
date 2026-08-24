import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const userContext = await getCurrentUserContext();

  if (!userContext.user) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace preferences for your BizFlow account."
      />
      <SettingsForm
        user={userContext.user}
        role={userContext.role}
        organization={userContext.organization}
        profile={userContext.profile}
      />
    </div>
  );
}
