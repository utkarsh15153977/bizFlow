import { CustomersView } from "@/components/customers/customers-view";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomers, type CustomerFilters } from "@/lib/crm-actions";
import { CsvExportButton } from "@/components/ui/csv-export-button";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<CustomerFilters> }) {
  const params = await searchParams;
  const filters: CustomerFilters = {
    page: params.page ? Number(params.page) : 1,
    pageSize: params.pageSize ? Number(params.pageSize) : 10,
    search: params.search,
    status: params.status as "all" | "active" | "inactive" | "lead" | undefined,
    sortBy: params.sortBy as "recent" | "name" | "status" | undefined,
  };
  const result = await getCustomers(filters);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts currently in the BizFlow workspace."
      />
      <div className="space-y-4"><div className="flex justify-end"><CsvExportButton kind="customers" /></div><CustomersView customers={result.data} filters={filters} total={result.total} page={result.page} pageSize={result.pageSize} totalPages={result.totalPages} /></div>
    </div>
  );
}
