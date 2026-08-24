-- Extend the existing tasks table for typed task management and completion tracking.
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'TODO',
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_task_type_check
    CHECK (task_type IN ('CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'TODO'));

CREATE INDEX IF NOT EXISTS idx_tasks_organization_status
    ON public.tasks(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_due_date
    ON public.tasks(organization_id, due_date);
