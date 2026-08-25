-- RLS Performance Optimization: Inlineable Helper Functions
--
-- Problem: The current PL/pgSQL helper functions (is_org_member, is_org_admin,
-- is_org_owner) cannot be inlined by PostgreSQL's query planner because they are
-- written in PL/pgSQL. Additionally, auth.uid() is evaluated per-row during RLS
-- evaluation rather than once per statement.
--
-- Solution: Convert to LANGUAGE sql (which supports inlining) and wrap auth.uid()
-- in a subquery (SELECT auth.uid()) so PostgreSQL evaluates it once per statement
-- as an initplan, then reuses the result for all rows.
--
-- Security semantics are preserved exactly - same checks, same tables, same results.
-- This is purely a query-plan optimization.

-- 1. is_org_member: Checks if current user is a member of the given organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = (SELECT auth.uid())
    );
$$;

-- 2. is_org_admin: Checks if current user has owner or admin role in the given organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    );
$$;

-- 3. is_org_owner: Checks if current user is the owner of the given organization
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    );
$$;

-- Note: The existing GRANT/REVOKE permissions are unchanged.
-- These functions are already granted to PUBLIC (inherited from original migration).
-- No additional GRANT/REVOKE needed as we're using CREATE OR REPLACE FUNCTION.