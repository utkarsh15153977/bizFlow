-- Extend notifications with related entity context and event-level deduplication.
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS related_entity_type TEXT,
    ADD COLUMN IF NOT EXISTS related_entity_id UUID,
    ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_organization
    ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_key
    ON public.notifications(dedupe_key)
    WHERE dedupe_key IS NOT NULL;

DROP POLICY IF EXISTS "Users and systems can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own workspace notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "Users can update own workspace notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND public.is_org_member(organization_id))
    WITH CHECK (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "Users can delete own workspace notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE OR REPLACE FUNCTION public.create_notification(
    recipient_id UUID,
    notification_organization_id UUID,
    notification_title TEXT,
    notification_message TEXT,
    notification_type TEXT,
    notification_entity_type TEXT DEFAULT NULL,
    notification_entity_id UUID DEFAULT NULL,
    notification_dedupe_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    notification_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = notification_organization_id
          AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Actor is not a workspace member';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = notification_organization_id
          AND user_id = recipient_id
    ) THEN
        RAISE EXCEPTION 'Recipient is not a workspace member';
    END IF;

    IF notification_type NOT IN (
        'TASK_ASSIGNED', 'TASK_DUE_TODAY', 'TASK_OVERDUE',
        'TASK_COMPLETED', 'CUSTOMER_UPDATED', 'CUSTOMER_ACTIVITY', 'SYSTEM'
    ) THEN
        RAISE EXCEPTION 'Invalid notification type';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = recipient_id
          AND in_app_notifications_enabled = TRUE
    ) THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.notifications (
        organization_id, user_id, title, message, type, link,
        related_entity_type, related_entity_id, dedupe_key
    )
    VALUES (
        notification_organization_id,
        recipient_id,
        notification_title,
        notification_message,
        notification_type,
        CASE
            WHEN notification_entity_type = 'task' AND notification_entity_id IS NOT NULL
                THEN '/tasks/' || notification_entity_id::TEXT
            WHEN notification_entity_type = 'customer' AND notification_entity_id IS NOT NULL
                THEN '/customers/' || notification_entity_id::TEXT
            ELSE NULL
        END,
        notification_entity_type,
        notification_entity_id,
        notification_dedupe_key
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
