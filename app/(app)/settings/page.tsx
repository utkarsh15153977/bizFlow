import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace preferences. Changes are not saved yet."
      />
      <SettingsForm />
    </div>
  );
}
