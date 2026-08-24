import { LeadsView } from "@/components/leads/leads-view";
import { PageHeader } from "@/components/ui/page-header";
import { getLeads } from "@/lib/crm-actions";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track inbound interest and sales opportunities."
      />
      <LeadsView leads={leads} />
    </div>
  );
}
