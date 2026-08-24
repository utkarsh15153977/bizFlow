import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getCustomers, getTask, getTaskAssignees } from "@/lib/crm-actions";
import { TaskDetailView } from "@/components/tasks/task-detail-view";

type TaskDetailPageProps = { params: Promise<{ id: string }> };

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");

  const { id } = await params;
  const [task, customers, assignees] = await Promise.all([
    getTask(id),
    getCustomers(),
    getTaskAssignees(),
  ]);
  if (!task) notFound();

  const customer = customers.find((item) => item.id === task.customer_id);
  const assignee = assignees.find((item) => item.id === task.assigned_to);
  const creator = assignees.find((item) => item.id === task.created_by);

  return (
    <div>
      <PageHeader title={task.title} description="Task details and status." />
      <TaskDetailView
        task={task}
        customerName={customer?.name}
        assigneeName={assignee?.name}
        creatorName={creator?.name}
        customers={customers}
        assignees={assignees}
      />
    </div>
  );
}
