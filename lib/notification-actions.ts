"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/actions";
import type { Tables } from "@/types/database.types";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE_TODAY"
  | "TASK_OVERDUE"
  | "TASK_COMPLETED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_ACTIVITY"
  | "SYSTEM";

export type Notification = Tables<"notifications">;
type Task = Tables<"tasks">;

type NotificationResult = { error?: string; success?: boolean };

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "TASK_ASSIGNED",
  "TASK_DUE_TODAY",
  "TASK_OVERDUE",
  "TASK_COMPLETED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_ACTIVITY",
  "SYSTEM",
];

function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_TYPES.includes(value as NotificationType);
}

export async function createNotification(input: {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: "task" | "customer";
  entityId?: string;
  dedupeKey?: string;
}): Promise<string | null> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization) return null;
  if (!input.recipientId || !input.title || !input.message || !isNotificationType(input.type)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_notification", {
    recipient_id: input.recipientId,
    notification_organization_id: context.organization.id,
    notification_title: input.title,
    notification_message: input.message,
    notification_type: input.type,
    notification_entity_type: input.entityType ?? null,
    notification_entity_id: input.entityId ?? null,
    notification_dedupe_key: input.dedupeKey ?? null,
  });

  if (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
  return data;
}

export async function createTaskDueNotification(
  task: Pick<Task, "id" | "title" | "due_date" | "assigned_to">,
  type: "TASK_DUE_TODAY" | "TASK_OVERDUE",
): Promise<string | null> {
  if (!task.assigned_to || !task.due_date) return null;
  const day = task.due_date.slice(0, 10);
  const overdue = type === "TASK_OVERDUE";
  return createNotification({
    recipientId: task.assigned_to,
    title: overdue ? "Task is overdue" : "Task due today",
    message: task.title,
    type,
    entityType: "task",
    entityId: task.id,
    dedupeKey: `task-${overdue ? "overdue" : "due"}-${task.id}-${day}`,
  });
}

export async function getNotifications(options?: {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
}): Promise<Notification[]> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization) return [];
  if (context.profile && !context.profile.in_app_notifications_enabled) return [];

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);
  if (options?.unreadOnly) query = query.eq("is_read", false);
  if (options?.type) query = query.eq("type", options.type);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization || context.profile && !context.profile.in_app_notifications_enabled) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .eq("is_read", false);
  return error ? 0 : count ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<NotificationResult> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization || !id) return { error: "Notification not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id);
  if (error) return { error: "Unable to update notification." };

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead(): Promise<NotificationResult> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", context.organization.id)
    .eq("user_id", context.user.id)
    .eq("is_read", false);
  if (error) return { error: "Unable to update notifications." };

  revalidatePath("/notifications");
  return { success: true };
}
