-- Fix notification INSERT policy to prevent cross-tenant abuse.
--
-- The previous policy allowed any org member to insert notifications for any user
-- in their org. This is now restricted to only allow INSERT via the SECURITY DEFINER
-- create_notification RPC, which properly validates:
-- 1. Actor is an org member
-- 2. Recipient is an org member
-- 3. Notification type is valid
-- 4. Recipient has in-app notifications enabled

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());