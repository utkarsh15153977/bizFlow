"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationSettings, updateProfile } from "@/lib/crm-actions";
import type { Tables } from "@/types/database.types";

type ActionResult = {
  error?: string;
  success?: boolean;
};

type SettingsFormProps = {
  organization?: Tables<"organizations"> | null;
  profile?: Tables<"profiles"> | null;
};

export function SettingsForm({ organization, profile }: SettingsFormProps) {
  const [orgPending, startOrgTransition] = useTransition();
  const [profilePending, startProfileTransition] = useTransition();
  const [orgMessage, setOrgMessage] = useState<ActionResult | null>(null);
  const [profileMessage, setProfileMessage] = useState<ActionResult | null>(null);

  const handleOrgSubmit = (formData: FormData) => {
    setOrgMessage(null);
    startOrgTransition(async () => {
      const result = await updateOrganizationSettings(formData);
      setOrgMessage(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  const handleProfileSubmit = (formData: FormData) => {
    setProfileMessage(null);
    startProfileTransition(async () => {
      const result = await updateProfile(formData);
      setProfileMessage(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Update your workspace name and preferences.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={handleOrgSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium">
                Workspace name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={organization?.name ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="block text-sm font-medium">
                Contact email
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={organization?.contact_email ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="timezone" className="block text-sm font-medium">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={organization?.timezone ?? "America/New_York"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            {orgMessage?.error && (
              <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {orgMessage.error}
              </div>
            )}

            {orgMessage?.success && (
              <div role="status" className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                Workspace updated.
              </div>
            )}

            <Button type="submit" isLoading={orgPending} loadingText="Saving...">
              Save changes
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal profile information.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={handleProfileSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                defaultValue={profile?.full_name ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={profile?.phone ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="jobTitle" className="block text-sm font-medium">
                Job title
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                defaultValue={profile?.job_title ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {profileMessage?.error && (
              <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {profileMessage.error}
              </div>
            )}

            {profileMessage?.success && (
              <div role="status" className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                Profile updated.
              </div>
            )}

            <Button type="submit" isLoading={profilePending} loadingText="Saving...">
              Save profile
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}