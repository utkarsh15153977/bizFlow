-- Secure invitation preview for invitees who are not yet workspace members.
--
-- Root cause fixed: the only SELECT policy on organization_invitations
-- ("Members can view organization invitations") requires organization-admin
-- membership, so a legitimate invitee could never read the invitation they
-- were sent and /invite/[token] always rendered "invalid invitation".
--
-- This SECURITY DEFINER function exposes ONLY the minimum fields required by
-- the invite page, keyed by the SHA-256 token hash. The raw token is never
-- stored or returned, and enumeration is infeasible: callers must present the
-- preimage of a 256-bit random token AND be authenticated. Acceptance remains
-- protected by accept_organization_invitation (email match + row lock).

CREATE OR REPLACE FUNCTION public.preview_organization_invitation(invitation_token_hash TEXT)
RETURNS TABLE (
    email TEXT,
    role user_role,
    status TEXT,
    expires_at TIMESTAMPTZ,
    organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT
        i.email,
        i.role,
        i.status,
        i.expires_at,
        o.name AS organization_name
    FROM public.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token_hash = invitation_token_hash
      AND i.status = 'pending'
      AND i.expires_at > NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.preview_organization_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_organization_invitation(TEXT) TO authenticated;
