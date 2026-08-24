import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getCustomerActivities, getCustomerById, getTasksByCustomer } from "@/lib/crm-actions";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const userContext = await getCurrentUserContext();
  if (!userContext.user) redirect("/login");

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const [activities, tasks] = await Promise.all([
    getCustomerActivities(id),
    getTasksByCustomer(id),
  ]);

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.company || "Customer account details"}
      />
      <CustomerDetailView customer={customer} activities={activities} tasks={tasks} />
    </div>
  );
}
