import { TasksView } from "@/components/tasks/tasks-view";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { tasks } from "@/lib/mock-data";

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Follow-ups and internal work for the demo workspace."
        actions={
          <Button disabled aria-disabled="true">
            Add task
          </Button>
        }
      />
      <TasksView tasks={tasks} />
    </div>
  );
}
