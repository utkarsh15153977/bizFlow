"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsForm() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          These fields are placeholders. Saving will be available in a later phase.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-2">
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace name
            </label>
            <input
              id="workspace-name"
              name="workspaceName"
              defaultValue="BizFlow Demo"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="workspace-email" className="text-sm font-medium">
              Contact email
            </label>
            <input
              id="workspace-email"
              name="contactEmail"
              type="email"
              defaultValue="hello@bizflow.example"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="workspace-timezone" className="text-sm font-medium">
              Timezone
            </label>
            <select
              id="workspace-timezone"
              name="timezone"
              defaultValue="America/New_York"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <Button type="submit" disabled>
            Save changes
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
