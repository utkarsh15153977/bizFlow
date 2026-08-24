"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationSettings, updateProfile } from "@/lib/crm-actions";
import { changePassword, signOut } from "@/lib/auth/actions";
import type { Tables } from "@/types/database.types";

type ActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

type SettingsFormProps = {
  user?: { email: string } | null;
  role?: string | null;
  organization?: Tables<"organizations"> | null;
  profile?: Tables<"profiles"> | null;
};

export function SettingsForm({ user, role, organization, profile }: SettingsFormProps) {
  const [orgPending, startOrgTransition] = useTransition();
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [orgMessage, setOrgMessage] = useState<ActionResult | null>(null);
  const [profileMessage, setProfileMessage] = useState<ActionResult | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<ActionResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handlePasswordSubmit = (formData: FormData) => {
    setPasswordMessage(null);
    startPasswordTransition(async () => {
      const result = await changePassword(null, formData);
      setPasswordMessage(result);
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account and workspace membership details.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="mt-1 font-medium text-foreground">{user?.email || "Unavailable"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Full name</p>
            <p className="mt-1 font-medium text-foreground">{profile?.full_name || "Not set"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Organization</p>
            <p className="mt-1 font-medium text-foreground">{organization?.name || "Not assigned"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="mt-1 font-medium capitalize text-foreground">{role || "Not assigned"}</p>
          </div>
        </CardBody>
      </Card>

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
          <CardTitle>Security</CardTitle>
          <CardDescription>Keep your account credentials up to date.</CardDescription>
        </CardHeader>
        <CardBody>
          <form action={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="settingsPassword" className="block text-sm font-medium">New password</label>
              <div className="relative">
                <input id="settingsPassword" name="password" type={showPassword ? "text" : "password"} minLength={8} required className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-16 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="settingsConfirmPassword" className="block text-sm font-medium">Confirm new password</label>
              <div className="relative">
                <input id="settingsConfirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} minLength={8} required className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-16 text-sm" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {passwordMessage?.error && <div role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{passwordMessage.error}</div>}
            {passwordMessage?.success && <div role="status" className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{passwordMessage.message}</div>}
            <Button type="submit" isLoading={passwordPending} loadingText="Updating...">Change password</Button>
          </form>
          <form action={signOut} className="mt-5 border-t border-border pt-5">
            <Button type="submit" variant="secondary">Log out</Button>
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

            <div className="space-y-3 border-t border-border pt-5">
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="emailNotificationsEnabled"
                  defaultChecked={profile?.email_notifications_enabled ?? true}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                Email notifications
              </label>
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="inAppNotificationsEnabled"
                  defaultChecked={profile?.in_app_notifications_enabled ?? true}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                In-app notifications
              </label>
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