import { LeadsView } from "@/components/leads/leads-view";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { leads } from "@/lib/mock-data";

export default function LeadsPage() {
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Pipeline placeholders until live CRM data is connected."
        actions={
          <Button disabled aria-disabled="true">
            Add lead
          </Button>
        }
      />
      <LeadsView leads={leads} />
    </div>
  );
}
