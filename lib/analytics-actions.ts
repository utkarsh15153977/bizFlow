"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext, type CurrentUserContext } from "@/lib/auth/actions";
import type { Tables } from "@/types/database.types";

export type ActivityFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  customerId?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export type ActivityRecord = Tables<"activities"> & {
  customerName: string | null;
  creatorName: string | null;
};

const MAX_PAGE_SIZE = 50;

function getDateRange(from?: string, to?: string) {
  const start = from && !Number.isNaN(Date.parse(from)) ? new Date(`${from}T00:00:00.000Z`) : null;
  const end = to && !Number.isNaN(Date.parse(to)) ? new Date(`${to}T23:59:59.999Z`) : null;
  return { start, end };
}

type ScopedContext = CurrentUserContext & {
  user: NonNullable<CurrentUserContext["user"]>;
  organization: NonNullable<CurrentUserContext["organization"]>;
};

async function getScopedContext(): Promise<ScopedContext | null> {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization) return null;
  return { ...context, user: context.user, organization: context.organization };
}

export async function getActivityOptions() {
  const context = await getScopedContext();
  if (!context) return { customers: [], users: [] };
  const supabase = await createClient();
  const [{ data: customers }, { data: members }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("organization_id", context.organization.id).order("name"),
    supabase.from("organization_members").select("user_id, profiles(full_name, email)").eq("organization_id", context.organization.id),
  ]);
  return {
    customers: customers ?? [],
    users: (members ?? []).map((member) => {
      const profile = member.profiles as unknown as { full_name: string | null; email: string } | null;
      return { id: member.user_id, name: profile?.full_name || profile?.email || "Workspace member" };
    }),
  };
}

export async function getActivities(filters: ActivityFilters = {}) {
  const context = await getScopedContext();
  if (!context) return { rows: [] as ActivityRecord[], total: 0 };

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? 20));
  const supabase = await createClient();
  const { start, end } = getDateRange(filters.from, filters.to);
  let query = supabase
    .from("activities")
    .select("*", { count: "exact" })
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("entity_type", filters.type);
  if (filters.customerId) query = query.eq("entity_id", filters.customerId).eq("entity_type", "customer");
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (start) query = query.gte("created_at", start.toISOString());
  if (end) query = query.lte("created_at", end.toISOString());

  const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error || !data) return { rows: [] as ActivityRecord[], total: 0 };

  const customerIds = [...new Set(data.filter((row) => row.entity_type === "customer" && row.entity_id).map((row) => row.entity_id as string))];
  const userIds = [...new Set(data.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  const [{ data: customers }, { data: profiles }] = await Promise.all([
    customerIds.length ? supabase.from("customers").select("id, name").eq("organization_id", context.organization.id).in("id", customerIds) : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    userIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string }> }),
  ]);
  const customerNames = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const creatorNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email]));
  const search = filters.search?.trim().toLowerCase();
  const rows = (search ? data.filter((row) => [row.title, row.detail ?? "", row.entity_type, customerNames.get(row.entity_id ?? "") ?? "", creatorNames.get(row.user_id ?? "") ?? ""].join(" ").toLowerCase().includes(search)) : data).map((row) => ({
    ...row,
    customerName: row.entity_type === "customer" ? customerNames.get(row.entity_id ?? "") ?? null : null,
    creatorName: creatorNames.get(row.user_id ?? "") ?? null,
  }));

  return { rows, total: search ? rows.length : count ?? 0 };
}

export async function getActivityById(id: string): Promise<ActivityRecord | null> {
  const context = await getScopedContext();
  if (!context || !id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .single();
  if (error || !data) return null;

  const customer = data.entity_type === "customer" && data.entity_id
    ? await supabase.from("customers").select("name").eq("id", data.entity_id).eq("organization_id", context.organization.id).single()
    : { data: null };
  const creator = data.user_id
    ? await supabase.from("profiles").select("full_name, email").eq("id", data.user_id).single()
    : { data: null };
  return {
    ...data,
    customerName: customer.data?.name ?? null,
    creatorName: creator.data?.full_name || creator.data?.email || null,
  };
}

export async function getAnalytics(range: { from?: string; to?: string } = {}) {
  const context = await getScopedContext();
  if (!context) return null;
  const supabase = await createClient();
  const { start, end } = getDateRange(range.from, range.to);
  const fromDate = start?.toISOString();
  const toDate = end?.toISOString();
  const applyRange = <T extends { gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(query: T) => {
    let result = query;
    if (fromDate) result = result.gte("created_at", fromDate);
    if (toDate) result = result.lte("created_at", toDate);
    return result;
  };

  const [customersResult, tasksResult, activitiesResult, activeCustomers, inactiveCustomers, leadCustomers, openTasks, completedTasks, overdueTasks] = await Promise.all([
    applyRange(supabase.from("customers").select("created_at, status").eq("organization_id", context.organization.id)),
    applyRange(supabase.from("tasks").select("created_at, completed_at, status, due_date").eq("organization_id", context.organization.id)),
    applyRange(supabase.from("activities").select("created_at, entity_type").eq("organization_id", context.organization.id)),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).eq("status", "active"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).eq("status", "inactive"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).eq("status", "lead"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).in("status", ["pending", "in_progress"]),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).eq("status", "completed"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", context.organization.id).lt("due_date", new Date().toISOString()).in("status", ["pending", "in_progress"]),
  ]);
  const customers = customersResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const activities = activitiesResult.data ?? [];
  const createdByDay = (items: Array<{ created_at: string }>) => items.reduce<Record<string, number>>((result, item) => { const day = item.created_at.slice(0, 10); result[day] = (result[day] ?? 0) + 1; return result; }, {});
  const activityTypes = activities.reduce<Record<string, number>>((result, item) => { result[item.entity_type] = (result[item.entity_type] ?? 0) + 1; return result; }, {});
  const taskStatuses = tasks.reduce<Record<string, number>>((result, item) => { result[item.status] = (result[item.status] ?? 0) + 1; return result; }, {});
  const customerStatuses = customers.reduce<Record<string, number>>((result, item) => { result[item.status] = (result[item.status] ?? 0) + 1; return result; }, {});
  const completedInRange = tasks.filter((task) => task.completed_at && (!start || new Date(task.completed_at) >= start) && (!end || new Date(task.completed_at) <= end)).length;
  return {
    customerMetrics: { total: activeCustomers.count! + inactiveCustomers.count! + leadCustomers.count!, active: activeCustomers.count ?? 0, inactive: inactiveCustomers.count ?? 0, leads: leadCustomers.count ?? 0, created: customers.length },
    taskMetrics: { total: tasks.length, open: openTasks.count ?? 0, completed: completedTasks.count ?? 0, overdue: overdueTasks.count ?? 0, completedInRange },
    activityMetrics: { total: activities.length, created: activities.length, byType: activityTypes },
    performance: { completionRate: tasks.length ? Math.round((completedInRange / tasks.length) * 100) : 0, overdueRate: tasks.length ? Math.round(((overdueTasks.count ?? 0) / tasks.length) * 100) : 0 },
    series: { customersCreated: createdByDay(customers), tasksCreated: createdByDay(tasks), activitiesCreated: createdByDay(activities), taskStatuses, customerStatuses },
  };
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportBusinessCsv(kind: "customers" | "tasks" | "activities", filters: ActivityFilters = {}) {
  const context = await getScopedContext();
  if (!context) return "";
  const supabase = await createClient();
  if (kind === "activities") {
    const result = await getActivities({ ...filters, page: 1, pageSize: MAX_PAGE_SIZE });
    return ["Type,Title,Description,Customer,Creator,Related entity,Created at", ...result.rows.map((row) => [row.entity_type, row.title, row.detail, row.customerName, row.creatorName, row.entity_id, row.created_at].map(csvCell).join(","))].join("\n");
  }
  if (kind === "customers") {
    const { data } = await supabase.from("customers").select("name, company, email, phone, website, status, total_revenue, created_at, updated_at").eq("organization_id", context.organization.id).order("created_at", { ascending: false });
    return ["Name,Company,Email,Phone,Website,Status,Revenue,Created at,Updated at", ...(data ?? []).map((row) => Object.values(row).map(csvCell).join(","))].join("\n");
  }
  const { data } = await supabase.from("tasks").select("title, description, task_type, priority, status, due_date, completed_at, created_at, updated_at").eq("organization_id", context.organization.id).order("created_at", { ascending: false });
  return ["Title,Description,Type,Priority,Status,Due date,Completed at,Created at,Updated at", ...(data ?? []).map((row) => Object.values(row).map(csvCell).join(","))].join("\n");
}
