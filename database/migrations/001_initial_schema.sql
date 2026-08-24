-- BizFlow SaaS CRM — Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Complete multi-tenant schema with tables, triggers, indexes, and comprehensive RLS policies.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enum Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility Function: Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Organizations / Workspaces Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    contact_email TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Organization Members (Junction between Users and Organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    status customer_status NOT NULL DEFAULT 'active',
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_order_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    source TEXT NOT NULL DEFAULT 'Inbound',
    stage lead_stage NOT NULL DEFAULT 'new',
    estimated_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Activities Table (Audit trail / Timeline)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL, -- 'customer', 'lead', 'task', 'organization', 'subscription'
    entity_id UUID,
    title TEXT NOT NULL,
    detail TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL, -- 'customer', 'lead', 'task'
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Integration Configs Table
CREATE TABLE IF NOT EXISTS public.integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'whatsapp', 'google', 'stripe', 'gemini', 'openai'
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider)
);

-- 15. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(organization_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(organization_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(organization_id, due_date);

CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notes_entity ON public.notes(organization_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- 16. Attach Automatic updated_at Triggers
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_integration_configs_updated_at
    BEFORE UPDATE ON public.integration_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Automatic User Signup Trigger (Idempotent)
-- Whenever an auth.user is created:
-- 1. Create a public profile if not present
-- 2. If user already has an organization membership, skip duplicate workspace creation
-- 3. Otherwise create default workspace, assign user as 'owner', and create initial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    user_name TEXT;
    org_name TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    org_name := COALESCE(
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_user_meta_data->>'company_name',
        user_name || '''s Workspace'
    );

    -- Insert or update profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

    -- Check if user is already an organization member (e.g. invited before signup)
    IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Insert default organization
    INSERT INTO public.organizations (name, contact_email)
    VALUES (org_name, NEW.email)
    RETURNING id INTO org_id;

    -- Assign user as organization owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, NEW.id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Create initial free subscription record
    INSERT INTO public.subscriptions (organization_id, plan, status)
    VALUES (org_id, 'free', 'active')
    ON CONFLICT (organization_id) DO NOTHING;

    -- Log initial activity
    INSERT INTO public.activities (organization_id, user_id, entity_type, entity_id, title, detail)
    VALUES (
        org_id,
        NEW.id,
        'organization',
        org_id,
        'Workspace created',
        'Initial workspace setup on registration.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. Helper Functions for RLS
-- Checks if current user is a member of given organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Checks if current user has owner or admin role in given organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Checks if current user is the owner of given organization
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 19. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- 20. RLS Policies

-- PROFILES:
CREATE POLICY "Users can view relevant profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om1
            JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid() AND om2.user_id = public.profiles.id
        )
    );

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ORGANIZATIONS:
CREATE POLICY "Members can view their organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (public.is_org_member(id));

CREATE POLICY "Admins can update their organization"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(id))
    WITH CHECK (public.is_org_admin(id));

CREATE POLICY "Owners can delete their organization"
    ON public.organizations FOR DELETE
    TO authenticated
    USING (public.is_org_owner(id));

-- ORGANIZATION MEMBERS:
CREATE POLICY "Members can view organization team"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can add organization members"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update member roles"
    ON public.organization_members FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins or user can remove membership"
    ON public.organization_members FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- CUSTOMERS:
CREATE POLICY "Members can view customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Members can insert customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Admins can delete customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

-- LEADS:
CREATE POLICY "Members can view leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Members can insert leads"
    ON public.leads FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

-- TASKS:
CREATE POLICY "Members can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Members can insert tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (public.is_org_member(organization_id));

-- ACTIVITIES:
CREATE POLICY "Members can view activities"
    ON public.activities FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Members can insert activities"
    ON public.activities FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- NOTES:
CREATE POLICY "Members can view notes"
    ON public.notes FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Members can insert notes"
    ON public.notes FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update own notes"
    ON public.notes FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

CREATE POLICY "Members can delete own notes or admin"
    ON public.notes FOR DELETE
    TO authenticated
    USING (public.is_org_member(organization_id) AND (user_id = auth.uid() OR public.is_org_admin(organization_id)));

-- NOTIFICATIONS:
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users and systems can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_org_member(organization_id));

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- SUBSCRIPTIONS:
CREATE POLICY "Members can view subscriptions"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can update subscriptions"
    ON public.subscriptions FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- INTEGRATION CONFIGS:
CREATE POLICY "Members can view integration status"
    ON public.integration_configs FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can insert integration configs"
    ON public.integration_configs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update integration configs"
    ON public.integration_configs FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete integration configs"
    ON public.integration_configs FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));
