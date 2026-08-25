import { TasksView } from "@/components/tasks/tasks-view";
import { PageHeader } from "@/components/ui/page-header";
import { getTasks, getCustomers, getTaskAssignees, type TaskFilters } from "@/lib/crm-actions";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { CsvExportButton } from "@/components/ui/csv-export-button";

export default async function TasksPage({ searchParams }: { searchParams: Promise<TaskFilters> }) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");

  const params = await searchParams;
  const filters: TaskFilters = {
    page: params.page ? Number(params.page) : 1,
    pageSize: params.pageSize ? Number(params.pageSize) : 10,
    search: params.search,
    status: params.status as "all" | "pending" | "in_progress" | "completed" | "cancelled" | undefined,
    priority: params.priority as "all" | "low" | "medium" | "high" | "urgent" | undefined,
    type: params.type as "all" | "TODO" | "CALL" | "EMAIL" | "MEETING" | "FOLLOW_UP" | undefined,
    assignment: params.assignment as "all" | "mine" | "others" | "today" | "overdue" | "upcoming" | undefined,
    customerId: params.customerId as "all" | string | undefined,
    assigneeId: params.assigneeId as "all" | string | undefined,
  };
  const [result, customersResult, assignees] = await Promise.all([
    getTasks(filters),
    getCustomers({ pageSize: 100 }),
    getTaskAssignees(),
  ]);
  const customers = customersResult.data;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage your tasks and customer follow-ups."
      />
      <div className="space-y-4"><div className="flex justify-end"><CsvExportButton kind="tasks" /></div><TasksView tasks={result.data} customers={customers} assignees={assignees} filters={filters} total={result.total} page={result.page} pageSize={result.pageSize} totalPages={result.totalPages} /></div>
    </div>
  );
}
