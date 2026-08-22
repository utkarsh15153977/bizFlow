import { CustomersView } from "@/components/customers/customers-view";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { customers } from "@/lib/mock-data";

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts currently in the BizFlow workspace."
        actions={
          <Button disabled aria-disabled="true">
            Add customer
          </Button>
        }
      />
      <CustomersView customers={customers} />
    </div>
  );
}
