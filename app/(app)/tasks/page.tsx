import { TasksView } from "@/components/tasks/tasks-view";
import { PageHeader } from "@/components/ui/page-header";
import { getTasks } from "@/lib/crm-actions";
import { getCustomers } from "@/lib/crm-actions";
import { getTaskAssignees } from "@/lib/crm-actions";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { CsvExportButton } from "@/components/ui/csv-export-button";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const [tasks, customers, assignees] = await Promise.all([
    getTasks(),
    getCustomers(),
    getTaskAssignees(),
  ]);
  const context = await getCurrentUserContext();
  const { customer: initialCustomerId } = await searchParams;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage your tasks and customer follow-ups."
      />
      <div className="space-y-4"><div className="flex justify-end"><CsvExportButton kind="tasks" /></div><TasksView tasks={tasks} customers={customers} assignees={assignees} currentUserId={context.user?.id} initialCustomerId={initialCustomerId} /></div>
    </div>
  );
}
