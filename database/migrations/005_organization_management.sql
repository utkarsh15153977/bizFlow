-- Organization management: secure, one-time invitations.
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invitations_pending_email
    ON public.organization_invitations(organization_id, lower(email))
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_org_invitations_organization
    ON public.organization_invitations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token
    ON public.organization_invitations(token_hash);

CREATE OR REPLACE TRIGGER trg_org_invitations_updated_at
    BEFORE UPDATE ON public.organization_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view organization invitations"
    ON public.organization_invitations FOR SELECT
    TO authenticated
    USING (public.is_org_admin(organization_id));
CREATE POLICY "Admins can create organization invitations"
    ON public.organization_invitations FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id) AND invited_by = auth.uid());
CREATE POLICY "Admins can update organization invitations"
    ON public.organization_invitations FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION public.accept_organization_invitation(invitation_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    invitation public.organization_invitations;
    current_email TEXT;
BEGIN
    current_email := lower((SELECT email FROM auth.users WHERE id = auth.uid()));
    SELECT * INTO invitation
    FROM public.organization_invitations
    WHERE token_hash = invitation_token_hash
    FOR UPDATE;

    IF invitation.id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
    IF invitation.status <> 'pending' THEN RAISE EXCEPTION 'Invitation is no longer active'; END IF;
    IF invitation.expires_at <= NOW() THEN
        UPDATE public.organization_invitations SET status = 'expired' WHERE id = invitation.id;
        RAISE EXCEPTION 'Invitation has expired';
    END IF;
    IF current_email IS NULL OR lower(invitation.email) <> current_email THEN
        RAISE EXCEPTION 'Invitation email does not match authenticated user';
    END IF;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (invitation.organization_id, auth.uid(), invitation.role)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.organization_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation.id;
    RETURN invitation.organization_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(TEXT) TO authenticated;
