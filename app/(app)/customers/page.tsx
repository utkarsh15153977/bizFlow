import { CustomersView } from "@/components/customers/customers-view";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomers } from "@/lib/crm-actions";
import { CsvExportButton } from "@/components/ui/csv-export-button";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts currently in the BizFlow workspace."
      />
      <div className="space-y-4"><div className="flex justify-end"><CsvExportButton kind="customers" /></div><CustomersView customers={customers} /></div>
    </div>
  );
}
