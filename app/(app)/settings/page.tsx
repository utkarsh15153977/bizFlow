import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserContext } from "@/lib/auth/actions";

export default async function SettingsPage() {
  const userContext = await getCurrentUserContext();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace preferences for your BizFlow account."
      />
      <SettingsForm
        organization={userContext.organization}
        profile={userContext.profile}
      />
    </div>
  );
}
