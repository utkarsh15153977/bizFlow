-- ============================================================
-- Migration 009: Analytics Performance Optimization
-- ============================================================
--
-- Goals:
--   1. Move analytics aggregation from JavaScript to PostgreSQL.
--   2. Eliminate full-table data transfer for dashboard analytics.
--   3. Replace JS lead-pipeline grouping with SQL GROUP BY.
--   4. Preserve organization/tenant isolation.
--   5. Keep RPCs safe when used with SECURITY DEFINER.
--
-- IMPORTANT:
-- The BizFlow task model expects tasks.completed_at.
-- Some environments may not have this column yet.
-- Add it idempotently so this migration can be deployed safely.
-- ============================================================


-- ============================================================
-- 0. Ensure task completion timestamp exists
-- ============================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;


-- ============================================================
-- 1. Dashboard Statistics
-- ============================================================
--
-- Replaces dashboard-side aggregation for:
--   - total customers
--   - active customers
--   - new customers in last 30 days
--   - active leads
--   - pending tasks
--   - pipeline value
--
-- SECURITY DEFINER is used because the function performs
-- database-side aggregation.
--
-- The organization membership check is mandatory because
-- SECURITY DEFINER bypasses normal RLS evaluation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_org_id UUID
)
RETURNS TABLE (
    total_customers BIGINT,
    active_customers BIGINT,
    new_customers_30d BIGINT,
    active_leads BIGINT,
    pending_tasks BIGINT,
    pipeline_value NUMERIC(12, 2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT
        (
            SELECT count(*)
            FROM public.customers
            WHERE organization_id = $1
              AND public.is_org_member($1)
        ) AS total_customers,

        (
            SELECT count(*)
            FROM public.customers
            WHERE organization_id = $1
              AND status = 'active'
              AND public.is_org_member($1)
        ) AS active_customers,

        (
            SELECT count(*)
            FROM public.customers
            WHERE organization_id = $1
              AND created_at >= (now() - interval '30 days')
              AND public.is_org_member($1)
        ) AS new_customers_30d,

        (
            SELECT count(*)
            FROM public.leads
            WHERE organization_id = $1
              AND stage NOT IN ('won', 'lost')
              AND public.is_org_member($1)
        ) AS active_leads,

        (
            SELECT count(*)
            FROM public.tasks
            WHERE organization_id = $1
              AND status = 'pending'
              AND public.is_org_member($1)
        ) AS pending_tasks,

        (
            SELECT COALESCE(sum(estimated_value), 0)
            FROM public.leads
            WHERE organization_id = $1
              AND stage NOT IN ('won', 'lost')
              AND public.is_org_member($1)
        ) AS pipeline_value;
$$;


-- ============================================================
-- 2. Lead Pipeline
-- ============================================================
--
-- Replaces JavaScript grouping/reduction of all leads.
--
-- Returns:
--   stage
--   count
--
-- Ordered according to BizFlow lead lifecycle.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_lead_pipeline(
    p_org_id UUID
)
RETURNS TABLE (
    stage TEXT,
    count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT
        stage,
        count(*) AS count
    FROM public.leads
    WHERE organization_id = $1
      AND public.is_org_member($1)
    GROUP BY stage
    ORDER BY
        CASE stage
            WHEN 'new' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'qualified' THEN 3
            WHEN 'proposal' THEN 4
            WHEN 'won' THEN 5
            WHEN 'lost' THEN 6
            ELSE 7
        END;
$$;


-- ============================================================
-- 3. Analytics Aggregation
-- ============================================================
--
-- Replaces:
--   - fetching entire customers table
--   - fetching entire tasks table
--   - fetching entire activities table
--   - performing aggregation in JavaScript
--
-- All aggregation is performed inside PostgreSQL.
--
-- Parameters:
--   p_org_id : organization UUID
--   p_from   : optional lower date boundary
--   p_to     : optional upper date boundary
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_analytics(
    p_org_id UUID,
    p_from TIMESTAMPTZ DEFAULT NULL,
    p_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    -- Customer metrics
    total_customers BIGINT,
    active_customers BIGINT,
    inactive_customers BIGINT,
    lead_customers BIGINT,
    customers_created BIGINT,

    -- Task metrics
    total_tasks BIGINT,
    open_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    completed_in_range BIGINT,

    -- Activity metrics
    total_activities BIGINT,
    activities_created BIGINT,

    -- Performance
    completion_rate INTEGER,
    overdue_rate INTEGER,

    -- Series data
    customers_created_series JSONB,
    tasks_created_series JSONB,
    activities_created_series JSONB,
    task_statuses JSONB,
    customer_statuses JSONB,
    activity_types JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    WITH

    -- ========================================================
    -- Filtered Customers
    -- ========================================================

    filtered_customers AS (
        SELECT
            id,
            status,
            created_at
        FROM public.customers
        WHERE organization_id = $1
          AND public.is_org_member($1)
          AND ($2 IS NULL OR created_at >= $2)
          AND ($3 IS NULL OR created_at <= $3)
    ),

    -- ========================================================
    -- Filtered Tasks
    -- ========================================================

    filtered_tasks AS (
        SELECT
            id,
            status,
            created_at,
            completed_at,
            due_date
        FROM public.tasks
        WHERE organization_id = $1
          AND public.is_org_member($1)
          AND ($2 IS NULL OR created_at >= $2)
          AND ($3 IS NULL OR created_at <= $3)
    ),

    -- ========================================================
    -- Filtered Activities
    -- ========================================================

    filtered_activities AS (
        SELECT
            id,
            entity_type,
            created_at
        FROM public.activities
        WHERE organization_id = $1
          AND public.is_org_member($1)
          AND ($2 IS NULL OR created_at >= $2)
          AND ($3 IS NULL OR created_at <= $3)
    ),

    -- ========================================================
    -- Customer Metrics
    -- ========================================================

    cust_metrics AS (
        SELECT
            count(*) AS total,

            count(*) FILTER (
                WHERE status = 'active'
            ) AS active,

            count(*) FILTER (
                WHERE status = 'inactive'
            ) AS inactive,

            count(*) FILTER (
                WHERE status = 'lead'
            ) AS leads,

            count(*) AS created

        FROM filtered_customers
    ),

    -- ========================================================
    -- Task Metrics
    -- ========================================================

    task_metrics AS (
        SELECT
            count(*) AS total,

            count(*) FILTER (
                WHERE status IN ('pending', 'in_progress')
            ) AS open,

            count(*) FILTER (
                WHERE status = 'completed'
            ) AS completed,

            count(*) FILTER (
                WHERE due_date < now()
                  AND status IN ('pending', 'in_progress')
            ) AS overdue,

            count(*) FILTER (
                WHERE status = 'completed'
                  AND completed_at IS NOT NULL
                  AND ($2 IS NULL OR completed_at >= $2)
                  AND ($3 IS NULL OR completed_at <= $3)
            ) AS completed_in_range

        FROM filtered_tasks
    ),

    -- ========================================================
    -- Activity Metrics
    -- ========================================================

    act_metrics AS (
        SELECT
            count(*) AS total,
            count(*) AS created
        FROM filtered_activities
    ),

    -- ========================================================
    -- Customers Created By Day
    -- ========================================================

    cust_series AS (
        SELECT
            jsonb_object_agg(
                to_char(created_at, 'YYYY-MM-DD'),
                day_count
            ) AS series
        FROM (
            SELECT
                created_at::DATE,
                count(*) AS day_count
            FROM filtered_customers
            GROUP BY created_at::DATE
        ) s
    ),

    -- ========================================================
    -- Tasks Created By Day
    -- ========================================================

    task_series AS (
        SELECT
            jsonb_object_agg(
                to_char(created_at, 'YYYY-MM-DD'),
                day_count
            ) AS series
        FROM (
            SELECT
                created_at::DATE,
                count(*) AS day_count
            FROM filtered_tasks
            GROUP BY created_at::DATE
        ) s
    ),

    -- ========================================================
    -- Activities Created By Day
    -- ========================================================

    act_series AS (
        SELECT
            jsonb_object_agg(
                to_char(created_at, 'YYYY-MM-DD'),
                day_count
            ) AS series
        FROM (
            SELECT
                created_at::DATE,
                count(*) AS day_count
            FROM filtered_activities
            GROUP BY created_at::DATE
        ) s
    ),

    -- ========================================================
    -- Task Status Distribution
    -- ========================================================

    task_statuses AS (
        SELECT
            jsonb_object_agg(status, cnt) AS series
        FROM (
            SELECT
                status,
                count(*) AS cnt
            FROM filtered_tasks
            GROUP BY status
        ) s
    ),

    -- ========================================================
    -- Customer Status Distribution
    -- ========================================================

    cust_statuses AS (
        SELECT
            jsonb_object_agg(status, cnt) AS series
        FROM (
            SELECT
                status,
                count(*) AS cnt
            FROM filtered_customers
            GROUP BY status
        ) s
    ),

    -- ========================================================
    -- Activity Type Distribution
    -- ========================================================

    act_types AS (
        SELECT
            jsonb_object_agg(entity_type, cnt) AS series
        FROM (
            SELECT
                entity_type,
                count(*) AS cnt
            FROM filtered_activities
            GROUP BY entity_type
        ) s
    ),

    -- ========================================================
    -- Completion Rate
    -- ========================================================

    completion_rate_calc AS (
        SELECT
            CASE
                WHEN total > 0
                THEN round(
                    (completed_in_range::numeric / total) * 100
                )::INTEGER
                ELSE 0
            END AS rate
        FROM task_metrics
    ),

    -- ========================================================
    -- Overdue Rate
    -- ========================================================

    overdue_rate_calc AS (
        SELECT
            CASE
                WHEN total > 0
                THEN round(
                    (overdue::numeric / total) * 100
                )::INTEGER
                ELSE 0
            END AS rate
        FROM task_metrics
    )

    -- ========================================================
    -- Final Result
    -- ========================================================

    SELECT
        cm.total AS total_customers,
        cm.active AS active_customers,
        cm.inactive AS inactive_customers,
        cm.leads AS lead_customers,
        cm.created AS customers_created,

        tm.total AS total_tasks,
        tm.open AS open_tasks,
        tm.completed AS completed_tasks,
        tm.overdue AS overdue_tasks,
        tm.completed_in_range AS completed_in_range,

        am.total AS total_activities,
        am.created AS activities_created,

        cr.rate AS completion_rate,
        orr.rate AS overdue_rate,

        COALESCE(
            cs.series,
            '{}'::jsonb
        ) AS customers_created_series,

        COALESCE(
            ts.series,
            '{}'::jsonb
        ) AS tasks_created_series,

        COALESCE(
            asr.series,
            '{}'::jsonb
        ) AS activities_created_series,

        COALESCE(
            tss.series,
            '{}'::jsonb
        ) AS task_statuses,

        COALESCE(
            css.series,
            '{}'::jsonb
        ) AS customer_statuses,

        COALESCE(
            ats.series,
            '{}'::jsonb
        ) AS activity_types

    FROM
        cust_metrics cm,
        task_metrics tm,
        act_metrics am,
        completion_rate_calc cr,
        overdue_rate_calc orr,
        cust_series cs,
        task_series ts,
        act_series asr,
        task_statuses tss,
        cust_statuses css,
        act_types ats;
$$;


-- ============================================================
-- 4. Function Permissions
-- ============================================================

REVOKE ALL
ON FUNCTION public.get_dashboard_stats(UUID)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_dashboard_stats(UUID)
TO authenticated;


REVOKE ALL
ON FUNCTION public.get_lead_pipeline(UUID)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_lead_pipeline(UUID)
TO authenticated;


REVOKE ALL
ON FUNCTION public.get_analytics(
    UUID,
    TIMESTAMPTZ,
    TIMESTAMPTZ
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_analytics(
    UUID,
    TIMESTAMPTZ,
    TIMESTAMPTZ
)
TO authenticated;


-- ============================================================
-- Migration 009 complete
-- ============================================================