"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/actions";
import type { Tables } from "@/types/database.types";

type ActionResult = {
  error?: string;
  success?: boolean;
};

const CUSTOMER_STATUSES = ["active", "inactive", "lead"] as const;
const LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

async function getOrgId(): Promise<string | null> {
  const context = await getCurrentUserContext();
  return context.organization?.id ?? null;
}

function validateRequired(value: unknown, field: string): string | null {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return `${field} is required.`;
  }
  return null;
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

function normalizeOptionalDate(value: string | null): string | null | ActionResult {
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: "Due date is invalid." };
  }

  return `${value}T00:00:00.000Z`;
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

export async function createCustomer(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const name = formData.get("name")?.toString().trim();
  const company = formData.get("company")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const website = formData.get("website")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const status = formData.get("status")?.toString().trim() || "active";

  const nameError = validateRequired(name, "Name");
  if (nameError) return { error: nameError };
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
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
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

  revalidateCrmPaths("/customers");
  return { success: true };
}

export async function deleteCustomer(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

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
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
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
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
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
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

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

export async function createTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString().trim() || "medium";
  const status = formData.get("status")?.toString().trim() || "pending";
  const dueDate = formData.get("dueDate")?.toString().trim() || null;

  const titleError = validateRequired(title, "Title");
  if (titleError) return { error: titleError };
  const validatedPriority = validateEnum(priority, TASK_PRIORITIES, "Priority");
  if (typeof validatedPriority !== "string") return validatedPriority;
  const validatedStatus = validateEnum(status, TASK_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;
  const normalizedDueDate = normalizeOptionalDate(dueDate);
  if (normalizedDueDate && typeof normalizedDueDate !== "string") return normalizedDueDate;

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    organization_id: orgId,
    title: title!,
    description,
    priority: validatedPriority,
    status: validatedStatus,
    due_date: normalizedDueDate,
  });

  if (error) {
    console.error("Failed to create task:", error);
    return { error: error.message || "Failed to create task." };
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

export async function updateTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const id = formData.get("id")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const priority = formData.get("priority")?.toString().trim();
  const status = formData.get("status")?.toString().trim();
  const dueDate = formData.get("dueDate")?.toString().trim();

  if (!id) return { error: "Task ID is required." };
  const titleError = validateRequired(title, "Title");
  if (titleError) return { error: titleError };
  const validatedPriority = validateEnum(priority || "medium", TASK_PRIORITIES, "Priority");
  if (typeof validatedPriority !== "string") return validatedPriority;
  const validatedStatus = validateEnum(status || "pending", TASK_STATUSES, "Status");
  if (typeof validatedStatus !== "string") return validatedStatus;
  const normalizedDueDate = normalizeOptionalDate(dueDate || null);
  if (normalizedDueDate && typeof normalizedDueDate !== "string") return normalizedDueDate;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: title!,
      description: description || null,
      priority: validatedPriority,
      status: validatedStatus,
      due_date: normalizedDueDate,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update task:", error);
    return { error: error.message || "Failed to update task." };
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
  const { error } = await supabase
    .from("tasks")
    .update({ status: validatedStatus })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to update task status:", error);
    return { error: error.message || "Failed to update task status." };
  }

  revalidateCrmPaths("/tasks");
  return { success: true };
}

export async function deleteTask(
  _prevState: ActionResult | null | FormData,
  formDataOrUndefined?: FormData,
): Promise<ActionResult> {
  const formData = (formDataOrUndefined instanceof FormData
    ? formDataOrUndefined
    : _prevState) as FormData;
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
      activeLeads: 0,
      pendingTasks: 0,
      pipelineValue: 0,
    };
  }

  const supabase = await createClient();

  const [customersRes, leadsRes, tasksRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
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
    activeLeads: leadsRes.count ?? 0,
    pendingTasks: tasksRes.count ?? 0,
    pipelineValue,
  };
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
  const orgId = await getOrgId();
  if (!orgId) return { error: "No workspace found." };

  const name = formData.get("name")?.toString().trim();
  const timezone = formData.get("timezone")?.toString().trim();
  const contactEmail = formData.get("contactEmail")?.toString().trim() || null;

  const nameError = validateRequired(name, "Workspace name");
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      timezone: timezone || "America/New_York",
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

  const nameError = validateRequired(fullName, "Full name");
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      job_title: jobTitle,
    })
    .eq("id", context.user.id);

  if (error) {
    console.error("Failed to update profile:", error);
    return { error: error.message || "Failed to update profile." };
  }

  revalidateCrmPaths("/settings");
  return { success: true };
}
