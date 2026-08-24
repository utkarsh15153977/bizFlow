"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/actions";
import type { Tables } from "@/types/database.types";
import { isOrgAdminOrOwner } from "@/lib/auth/roles";
import { createNotification } from "@/lib/notification-actions";

type ActionResult = {
  error?: string;
  success?: boolean;
};

const CUSTOMER_STATUSES = ["active", "inactive", "lead"] as const;
const LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
const TASK_TYPES = ["CALL", "EMAIL", "MEETING", "FOLLOW_UP", "TODO"] as const;
const CUSTOMER_ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note", "Follow-up"] as const;
const ORGANIZATION_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
] as const;

async function getOrgId(): Promise<string | null> {
  const context = await getCurrentUserContext();
  return context.organization?.id ?? null;
}

async function getAuthorizedOrgContext() {
  const context = await getCurrentUserContext();
  return {
    orgId: context.organization?.id ?? null,
    role: context.role,
    userId: context.user?.id ?? null,
  };
}

function validateRequired(value: unknown, field: string): string | null {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return `${field} is required.`;
  }
  return null;
}

function validateOptionalEmail(value: string | null): string | null {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Please enter a valid email address.";
  }
  return null;
}

function validateOptionalPhone(value: string | null): string | null {
  if (value && !/^[+\d][\d\s().-]{6,}$/.test(value)) {
    return "Please enter a valid phone number.";
  }
  return null;
}

function resolveActionFormData(
  prevStateOrFormData: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): FormData | ActionResult {
  if (formDataOrUndefined instanceof FormData) return formDataOrUndefined;
  if (prevStateOrFormData instanceof FormData) return prevStateOrFormData;
  return { error: "Invalid form submission." };
}

function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  field: string,
): T | ActionResult {
  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  return { error: `${field} is invalid.` };
}

function revalidateCrmPaths(path: "/customers" | "/leads" | "/tasks" | "/settings") {
  revalidatePath(path);
  revalidatePath("/");
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Tables<"customers">[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }

  return data ?? [];
}

export async function getCustomerById(id: string): Promise<Tables<"customers"> | null> {
  const orgId = await getOrgId();
  if (!orgId || !id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error) return null;
  return data;
}

export async function getCustomerActivities(id: string): Promise<Tables<"activities">[]> {
  const orgId = await getOrgId();
  if (!orgId || !id) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("organization_id", orgId)
    .eq("entity_type", "customer")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getTaskAssignees(): Promise<Array<{ id: string; name: string }>> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name, email)")
    .eq("organization_id", orgId);

  if (error || !data) return [];

  return data.map((member) => {
    const profile = member.profiles as unknown as { full_name: string | null; email: string } | null;
    return {
      id: member.user_id,
      name: profile?.full_name || profile?.email || "Workspace member",
    };
  });
}

export async function createCustomerActivity(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;

  const { orgId, userId } = await getAuthorizedOrgContext();
  if (!orgId || !userId) return { error: "You must be signed in to add activity." };

  const customerId = formData.get("customerId")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const detail = formData.get("detail")?.toString().trim() || null;

  if (!customerId) return { error: "Customer ID is required." };
  if (!title) return { error: "Activity type is required." };
  if (!CUSTOMER_ACTIVITY_TYPES.includes(title as (typeof CUSTOMER_ACTIVITY_TYPES)[number])) {
    return { error: "Activity type is invalid." };
  }

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, created_by")
    .eq("id", customerId)
    .eq("organization_id", orgId)
    .single();

  if (!customer) return { error: "Customer not found." };

  const { error } = await supabase.from("activities").insert({
    organization_id: orgId,
    user_id: userId,
    entity_type: "customer",
    entity_id: customerId,
    title,
    detail,
  });

  if (error) return { error: error.message || "Failed to add activity." };

  const context = await getCurrentUserContext();
  if (customer.created_by && context.user && context.user.id !== customer.created_by) {
    await createNotification({
      recipientId: customer.created_by,
      title: "Customer activity added",
      message: `${title} activity was added to ${customer.name}.`,
      type: "CUSTOMER_ACTIVITY",
      entityType: "customer",
      entityId: customerId,
      dedupeKey: `customer-activity-${customerId}-${Date.now()}`,
    });
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  revalidatePath("/");
  return { success: true };
}

export async function createCustomer(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const { orgId, userId } = await getAuthorizedOrgContext();
  if (!orgId || !userId) return { error: "You must be signed in to create a customer." };

  const name = formData.get("name")?.toString().trim();
  const company = formData.get("company")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const website = formData.get("website")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const status = formData.get("status")?.toString().trim() || "active";

  const nameError = validateRequired(name, "Name");
  if (nameError) return { error: nameError };
  const emailError = validateOptionalEmail(email);
  if (emailError) return { error: emailError };
  const phoneError = validateOptionalPhone(phone);
  if (phoneError) return { error: phoneError };
  const validatedStatus = validateEnum(status, CUSTOMER_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    organization_id: orgId,
    name: name!,
    company,
    email,
    phone,
    website,
    address,
    status: validatedStatus,
    created_by: userId,
  });

  if (error) {
    console.error("Failed to create customer:", error);
    return { error: error.message || "Failed to create customer." };
  }

  revalidateCrmPaths("/customers");
  return { success: true };
}

export async function updateCustomer(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const id = formData.get("id")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const website = formData.get("website")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const status = formData.get("status")?.toString().trim();

  if (!id) return { error: "Customer ID is required." };
  const nameError = validateRequired(name, "Name");
  if (nameError) return { error: nameError };
  const emailError = validateOptionalEmail(email || null);
  if (emailError) return { error: emailError };
  const phoneError = validateOptionalPhone(phone || null);
  if (phoneError) return { error: phoneError };
  const validatedStatus = validateEnum(status || "active", CUSTOMER_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: name!,
      company: company || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      status: validatedStatus,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update customer:", error);
    return { error: error.message || "Failed to update customer." };
  }

  const context = await getCurrentUserContext();
  const { data: customer } = await supabase
    .from("customers")
    .select("name, created_by")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  if (customer?.created_by && customer.created_by !== context.user?.id) {
    await createNotification({
      recipientId: customer.created_by,
      title: "Customer updated",
      message: `${customer.name} was updated.`,
      type: "CUSTOMER_UPDATED",
      entityType: "customer",
      entityId: id,
      dedupeKey: `customer-updated-${id}-${Date.now()}`,
    });
  }

  revalidateCrmPaths("/customers");
  return { success: true };
}

export async function deleteCustomer(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const { orgId, role } = await getAuthorizedOrgContext();
  if (!orgId) return { error: "No workspace found." };
  if (!isOrgAdminOrOwner(role)) return { error: "You do not have permission to delete customers." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "Customer ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to delete customer:", error);
    return { error: error.message || "Failed to delete customer." };
  }

  revalidateCrmPaths("/customers");
  return { success: true };
}

// ─── LEADS ───────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Tables<"leads">[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }

  return data ?? [];
}

export async function createLead(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const name = formData.get("name")?.toString().trim();
  const company = formData.get("company")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const source = formData.get("source")?.toString().trim() || "Inbound";
  const stage = formData.get("stage")?.toString().trim() || "new";
  const estimatedValue = formData.get("estimatedValue")?.toString().trim() || "0";

  const nameError = validateRequired(name, "Name");
  if (nameError) return { error: nameError };
  const validatedStage = validateEnum(stage, LEAD_STAGES, "Stage");
  if (typeof validatedStage !== "string") return validatedStage;
  const parsedEstimatedValue = parseFloat(estimatedValue);
  if (!Number.isFinite(parsedEstimatedValue) || parsedEstimatedValue < 0) {
    return { error: "Estimated value must be a valid positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    organization_id: orgId,
    name: name!,
    company,
    email,
    phone,
    source,
    stage: validatedStage,
    estimated_value: parsedEstimatedValue,
  });

  if (error) {
    console.error("Failed to create lead:", error);
    return { error: error.message || "Failed to create lead." };
  }

  revalidateCrmPaths("/leads");
  return { success: true };
}

export async function updateLead(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const id = formData.get("id")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const source = formData.get("source")?.toString().trim();
  const stage = formData.get("stage")?.toString().trim();
  const estimatedValue = formData.get("estimatedValue")?.toString().trim();

  if (!id) return { error: "Lead ID is required." };
  const nameError = validateRequired(name, "Name");
  if (nameError) return { error: nameError };
  const validatedStage = validateEnum(stage || "new", LEAD_STAGES, "Stage");
  if (typeof validatedStage !== "string") return validatedStage;
  const parsedEstimatedValue = parseFloat(estimatedValue || "0");
  if (!Number.isFinite(parsedEstimatedValue) || parsedEstimatedValue < 0) {
    return { error: "Estimated value must be a valid positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      name: name!,
      company: company || null,
      email: email || null,
      phone: phone || null,
      source: source || "Inbound",
      stage: validatedStage,
      estimated_value: parsedEstimatedValue,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update lead:", error);
    return { error: error.message || "Failed to update lead." };
  }

  revalidateCrmPaths("/leads");
  return { success: true };
}

export async function deleteLead(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const { orgId, role } = await getAuthorizedOrgContext();
  if (!orgId) return { error: "No workspace found." };
  if (!isOrgAdminOrOwner(role)) return { error: "You do not have permission to delete leads." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "Lead ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to delete lead:", error);
    return { error: error.message || "Failed to delete lead." };
  }

  revalidateCrmPaths("/leads");
  return { success: true };
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Tables<"tasks">[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", orgId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }

  return data ?? [];
}

export async function getTask(id: string): Promise<Tables<"tasks"> | null> {
  const orgId = await getOrgId();
  if (!orgId || !id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  return error ? null : data;
}

async function validateTaskRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  customerId: string | null,
  assignedTo: string | null,
): Promise<string | null> {
  if (customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("organization_id", orgId)
      .single();
    if (!customer) return "Customer not found in this workspace.";
  }

  if (assignedTo) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("user_id", assignedTo)
      .eq("organization_id", orgId)
      .single();
    if (!member) return "Assignee is not a member of this workspace.";
  }

  return null;
}

function parseTaskDate(value: string | null): string | null | ActionResult {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { error: "Due date is invalid." };
  return parsed.toISOString();
}

export async function createTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const { orgId, userId } = await getAuthorizedOrgContext();
  if (!orgId || !userId) return { error: "You must be signed in to create a task." };

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const taskType = formData.get("taskType")?.toString().trim() || "TODO";
  const priority = formData.get("priority")?.toString().trim() || "medium";
  const status = formData.get("status")?.toString().trim() || "pending";
  const dueDate = formData.get("dueAt")?.toString().trim() || formData.get("dueDate")?.toString().trim() || null;
  const customerId = formData.get("customerId")?.toString().trim() || null;
  const assignedTo = formData.get("assignedTo")?.toString().trim() || null;

  const titleError = validateRequired(title, "Title");
  if (titleError) return { error: titleError };
  if (!title || title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (description && description.length > 2000) return { error: "Description must be 2,000 characters or fewer." };
  const validatedType = validateEnum(taskType, TASK_TYPES, "Task type");
  if (typeof validatedType !== "string") return validatedType;
  const validatedPriority = validateEnum(priority, TASK_PRIORITIES, "Priority");
  if (typeof validatedPriority !== "string") return validatedPriority;
  const validatedStatus = validateEnum(status, TASK_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;
  const normalizedDueDate = parseTaskDate(dueDate);
  if (normalizedDueDate && typeof normalizedDueDate !== "string") return normalizedDueDate;

  const supabase = await createClient();
  const relationError = await validateTaskRelations(supabase, orgId, customerId, assignedTo);
  if (relationError) return { error: relationError };

  const { data: createdTask, error } = await supabase.from("tasks").insert({
    organization_id: orgId,
    title: title!,
    description,
    task_type: validatedType,
    priority: validatedPriority,
    status: validatedStatus,
    due_date: normalizedDueDate,
    customer_id: customerId,
    assigned_to: assignedTo,
    created_by: userId,
    completed_at: validatedStatus === "completed" ? new Date().toISOString() : null,
  }).select("id").single();

  if (error) {
    console.error("Failed to create task:", error);
    return { error: error.message || "Failed to create task." };
  }

  if (customerId) {
    await supabase.from("activities").insert({
      organization_id: orgId,
      user_id: userId,
      entity_type: "customer",
      entity_id: customerId,
      title: "Task created",
      detail: title,
    });
  }

  if (assignedTo && createdTask) {
    await createNotification({
      recipientId: assignedTo,
      title: assignedTo === userId ? "Task assigned to you" : "Task assigned",
      message: title,
      type: "TASK_ASSIGNED",
      entityType: "task",
      entityId: createdTask.id,
      dedupeKey: `task-assigned-${createdTask.id}-${assignedTo}`,
    });
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

export async function updateTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const id = formData.get("id")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const taskType = formData.get("taskType")?.toString().trim();
  const priority = formData.get("priority")?.toString().trim();
  const status = formData.get("status")?.toString().trim();
  const dueDate = formData.get("dueAt")?.toString().trim() || formData.get("dueDate")?.toString().trim();
  const customerId = formData.get("customerId")?.toString().trim() || null;
  const assignedTo = formData.get("assignedTo")?.toString().trim() || null;

  if (!id) return { error: "Task ID is required." };
  const titleError = validateRequired(title, "Title");
  if (titleError) return { error: titleError };
  if (!title || title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (description && description.length > 2000) return { error: "Description must be 2,000 characters or fewer." };
  const validatedType = validateEnum(taskType || "TODO", TASK_TYPES, "Task type");
  if (typeof validatedType !== "string") return validatedType;
  const validatedPriority = validateEnum(priority || "medium", TASK_PRIORITIES, "Priority");
  if (typeof validatedPriority !== "string") return validatedPriority;
  const validatedStatus = validateEnum(status || "pending", TASK_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;
  const normalizedDueDate = parseTaskDate(dueDate || null);
  if (normalizedDueDate && typeof normalizedDueDate !== "string") return normalizedDueDate;

  const supabase = await createClient();
  const { data: previousTask } = await supabase
    .from("tasks")
    .select("assigned_to")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  const relationError = await validateTaskRelations(supabase, orgId, customerId, assignedTo);
  if (relationError) return { error: relationError };

  const { error } = await supabase
    .from("tasks")
    .update({
      title: title!,
      description: description || null,
      task_type: validatedType,
      priority: validatedPriority,
      status: validatedStatus,
      due_date: normalizedDueDate,
      customer_id: customerId,
      assigned_to: assignedTo,
      completed_at: validatedStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update task:", error);
    return { error: error.message || "Failed to update task." };
  }

  if (assignedTo && assignedTo !== previousTask?.assigned_to) {
    const context = await getCurrentUserContext();
    await createNotification({
      recipientId: assignedTo,
      title: assignedTo === context.user?.id ? "Task assigned to you" : "Task assigned",
      message: title!,
      type: "TASK_ASSIGNED",
      entityType: "task",
      entityId: id,
      dedupeKey: `task-assigned-${id}-${assignedTo}`,
    });
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

export async function updateTaskStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };
  if (!id) return { error: "Task ID is required." };
  const validatedStatus = validateEnum(status, TASK_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;

  const supabase = await createClient();
  const { data: previousTask } = await supabase
    .from("tasks")
    .select("title, customer_id, assigned_to, created_by")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: validatedStatus,
      completed_at: validatedStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update task status:", error);
    return { error: error.message || "Failed to update task status." };
  }

  if (validatedStatus === "completed") {
    if (previousTask?.customer_id) {
      const context = await getCurrentUserContext();
      await supabase.from("activities").insert({
        organization_id: orgId,
        user_id: context.user?.id ?? null,
        entity_type: "customer",
        entity_id: previousTask.customer_id,
        title: "Task completed",
        detail: previousTask.title,
      });
    }
    const context = await getCurrentUserContext();
    for (const recipientId of new Set([previousTask?.assigned_to, previousTask?.created_by])) {
      if (recipientId && recipientId !== context.user?.id) {
        await createNotification({
          recipientId,
          title: "Task completed",
          message: previousTask?.title || "A task was completed.",
          type: "TASK_COMPLETED",
          entityType: "task",
          entityId: id,
          dedupeKey: `task-completed-${id}-${previousTask?.assigned_to || "none"}-${previousTask?.created_by || "none"}`,
        });
      }
    }
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

export async function completeTask(id: string): Promise<ActionResult> {
  return updateTaskStatus(id, "completed");
}

export async function reopenTask(id: string): Promise<ActionResult> {
  return updateTaskStatus(id, "pending");
}

export async function getTasksByStatus(status: string): Promise<Tables<"tasks">[]> {
  const tasks = await getTasks();
  return tasks.filter((task) => task.status === status);
}

export async function getTasksByCustomer(customerId: string): Promise<Tables<"tasks">[]> {
  const tasks = await getTasks();
  return tasks.filter((task) => task.customer_id === customerId);
}

export async function getTasksByAssignee(assignedTo: string): Promise<Tables<"tasks">[]> {
  const tasks = await getTasks();
  return tasks.filter((task) => task.assigned_to === assignedTo);
}

export async function getUpcomingTasks(): Promise<Tables<"tasks">[]> {
  const now = Date.now();
  const tasks = await getTasks();
  return tasks.filter((task) => task.due_date && new Date(task.due_date).getTime() >= now && task.status !== "completed" && task.status !== "cancelled");
}

export async function getOverdueTasks(): Promise<Tables<"tasks">[]> {
  const now = Date.now();
  const tasks = await getTasks();
  return tasks.filter((task) => task.due_date && new Date(task.due_date).getTime() < now && task.status !== "completed" && task.status !== "cancelled");
}

export async function getTaskDashboardMetrics() {
  const context = await getAuthorizedOrgContext();
  if (!context.orgId || !context.userId) {
    return { total: 0, myOpen: 0, dueToday: 0, overdue: 0, completedThisWeek: 0 };
  }

  const tasks = await getTasks();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return {
    total: tasks.length,
    myOpen: tasks.filter((task) => task.assigned_to === context.userId && task.status !== "completed" && task.status !== "cancelled").length,
    dueToday: tasks.filter((task) => task.due_date?.slice(0, 10) === today && task.status !== "completed" && task.status !== "cancelled").length,
    overdue: tasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== "completed" && task.status !== "cancelled").length,
    completedThisWeek: tasks.filter((task) => task.completed_at && new Date(task.completed_at) >= weekStart).length,
  };
}

export async function deleteTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = resolveActionFormData(_prevState, formDataOrUndefined);
  if (!(formData instanceof FormData)) return formData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "Task ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to delete task:", error);
    return { error: error.message || "Failed to delete task." };
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const orgId = await getOrgId();
  if (!orgId) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers: 0,
      activeLeads: 0,
      pendingTasks: 0,
      pipelineValue: 0,
    };
  }

  const supabase = await createClient();

  const [customersRes, activeCustomersRes, newCustomersRes, leadsRes, tasksRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("leads")
      .select("estimated_value", { count: "exact" })
      .eq("organization_id", orgId)
      .neq("stage", "won")
      .neq("stage", "lost"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),
  ]);

  const pipelineValue = leadsRes.data?.reduce(
    (sum, lead) => sum + (lead.estimated_value || 0),
    0
  ) || 0;

  return {
    totalCustomers: customersRes.count ?? 0,
    activeCustomers: activeCustomersRes.count ?? 0,
    newCustomers: newCustomersRes.count ?? 0,
    activeLeads: leadsRes.count ?? 0,
    pendingTasks: tasksRes.count ?? 0,
    pipelineValue,
  };
}

export async function getRecentCustomers(): Promise<Tables<"customers">[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];
  return data ?? [];
}

export async function getLeadPipeline() {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("stage")
    .eq("organization_id", orgId);

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const lead of data) {
    counts[lead.stage] = (counts[lead.stage] || 0) + 1;
  }

  return Object.entries(counts).map(([stage, count]) => ({ stage, count }));
}

export async function getRecentActivities() {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }

  return data ?? [];
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export async function updateOrganizationSettings(formData: FormData): Promise<ActionResult> {
  const { orgId, role } = await getAuthorizedOrgContext();
  if (!orgId) return { error: "No workspace found." };
  if (!isOrgAdminOrOwner(role)) return { error: "You do not have permission to update workspace settings." };

  const name = formData.get("name")?.toString().trim();
  const timezone = formData.get("timezone")?.toString().trim() || "America/New_York";
  const contactEmail = formData.get("contactEmail")?.toString().trim() || null;

  const nameError = validateRequired(name, "Workspace name");
  if (nameError) return { error: nameError };
  const validatedTimezone = validateEnum(timezone, ORGANIZATION_TIMEZONES, "Timezone");
  if (typeof validatedTimezone !== "string") return validatedTimezone;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      timezone: validatedTimezone,
      contact_email: contactEmail,
    })
    .eq("id", orgId);

  if (error) {
    console.error("Failed to update organization:", error);
    return { error: error.message || "Failed to update settings." };
  }

  revalidateCrmPaths("/settings");
  return { success: true };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const context = await getCurrentUserContext();
  if (!context.user) return { error: "Not authenticated." };

  const fullName = formData.get("fullName")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const jobTitle = formData.get("jobTitle")?.toString().trim() || null;
  const emailNotificationsEnabled = formData.get("emailNotificationsEnabled") === "on";
  const inAppNotificationsEnabled = formData.get("inAppNotificationsEnabled") === "on";

  const nameError = validateRequired(fullName, "Full name");
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      job_title: jobTitle,
      email_notifications_enabled: emailNotificationsEnabled,
      in_app_notifications_enabled: inAppNotificationsEnabled,
    })
    .eq("id", context.user.id);

  if (error) {
    console.error("Failed to update profile:", error);
    return { error: error.message || "Failed to update profile." };
  }

  revalidateCrmPaths("/settings");
  return { success: true };
}
