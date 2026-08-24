import { CustomersView } from "@/components/customers/customers-view";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomers } from "@/lib/crm-actions";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts currently in the BizFlow workspace."
      />
      <CustomersView customers={customers} />
    </div>
  );
}
