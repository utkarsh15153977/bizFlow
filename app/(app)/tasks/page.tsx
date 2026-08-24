import { TasksView } from "@/components/tasks/tasks-view";
import { PageHeader } from "@/components/ui/page-header";
import { getTasks } from "@/lib/crm-actions";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Stay on top of follow-ups and team work."
      />
      <TasksView tasks={tasks} />
    </div>
  );
}
