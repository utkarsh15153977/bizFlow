import { LeadsView } from "@/components/leads/leads-view";
import { PageHeader } from "@/components/ui/page-header";
import { getLeads, type LeadFilters } from "@/lib/crm-actions";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<LeadFilters> }) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");

  const params = await searchParams;
  const filters: LeadFilters = {
    page: params.page ? Number(params.page) : 1,
    pageSize: params.pageSize ? Number(params.pageSize) : 10,
    search: params.search,
    stage: params.stage as "all" | "new" | "contacted" | "qualified" | "proposal" | "won" | "lost" | undefined,
    sortBy: params.sortBy as "recent" | "name" | "stage" | undefined,
  };
  const result = await getLeads(filters);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track inbound interest and sales opportunities."
      />
      <LeadsView leads={result.data} filters={filters} total={result.total} page={result.page} pageSize={result.pageSize} totalPages={result.totalPages} />
    </div>
  );
}
