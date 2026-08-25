"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { canChangeMemberRole, canInviteMembers, canManageOrganization, canRemoveMember, type Role } from "@/lib/auth/roles";
import { createNotification } from "@/lib/notification-actions";
import type { InvitationStatus, Tables, UserRole } from "@/types/database.types";

type ActionResult = { error?: string; success?: boolean; message?: string; inviteUrl?: string };

type MemberRecord = Tables<"organization_members"> & { profile: Tables<"profiles"> | null };

const allowedRoles: readonly UserRole[] = ["owner", "admin", "member"];

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getAuthorizedContext() {
  const context = await getCurrentUserContext();
  if (!context.user || !context.organization || !context.role) return null;
  return { ...context, user: context.user, organization: context.organization, role: context.role };
}

function canManageTarget(actor: Role, target: UserRole) {
  if (actor === "owner") return target !== "owner";
  return actor === "admin" && target === "member";
}

async function recordOrganizationActivity(
  organizationId: string,
  userId: string,
  title: string,
  detail: string,
) {
  const supabase = await createClient();
  await supabase.from("activities").insert({
    organization_id: organizationId,
    user_id: userId,
    entity_type: "organization",
    entity_id: organizationId,
    title,
    detail,
  });
}

export async function getOrganizationMembers(): Promise<MemberRecord[]> {
  const context = await getAuthorizedContext();
  if (!context) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, profile:profiles(*)")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as MemberRecord[];
}

export async function getOrganizationInvitations(): Promise<Array<Tables<"organization_invitations">>> {
  const context = await getAuthorizedContext();
  if (!context || !canInviteMembers(context.role)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function inviteOrganizationMember(
  _previous: ActionResult | null | FormData,
  formData?: FormData,
): Promise<ActionResult> {
  const submitted = formData ?? (_previous instanceof FormData ? _previous : null);
  if (!submitted) return { error: "Invalid invitation form." };
  const context = await getAuthorizedContext();
  if (!context || !canInviteMembers(context.role)) return { error: "You do not have permission to invite members." };

  const email = submitted.get("email")?.toString().trim().toLowerCase() ?? "";
  const role = submitted.get("role")?.toString() as UserRole;
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  if (!allowedRoles.includes(role) || role === "owner") return { error: "Only admin or member roles can be invited." };

  const supabase = await createClient();
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("user_id, profiles!inner(email)")
    .eq("organization_id", context.organization.id)
    .ilike("profiles.email", email)
    .maybeSingle();
  if (existingMember) return { error: "This user is already a member of the organization." };

  const { data: pendingInvite } = await supabase
    .from("organization_invitations")
    .select("id")
    .eq("organization_id", context.organization.id)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle();
  if (pendingInvite) return { error: "An active invitation already exists for this email." };

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: context.organization.id,
    email,
    role,
    token_hash: hashToken(token),
    invited_by: context.user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) return { error: "Unable to create the invitation." };

  await recordOrganizationActivity(context.organization.id, context.user.id, "Member invited", `Invitation sent to ${email}.`);
  return { success: true, message: `Invitation created for ${email}.`, inviteUrl: `/invite/${token}` };
}

export async function resendOrganizationInvitation(id: string): Promise<ActionResult> {
  const context = await getAuthorizedContext();
  if (!context || !canInviteMembers(context.role) || !id) return { error: "You do not have permission to resend invitations." };
  const supabase = await createClient();
  const { data: invitation } = await supabase.from("organization_invitations").select("email, role, status").eq("id", id).eq("organization_id", context.organization.id).single();
  if (!invitation || invitation.status !== "pending") return { error: "Invitation is no longer pending." };
  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("organization_invitations").update({ token_hash: hashToken(token), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", id).eq("organization_id", context.organization.id).eq("status", "pending");
  if (error) return { error: "Unable to resend the invitation." };
  return { success: true, message: "Invitation renewed.", inviteUrl: `/invite/${token}` };
}

export async function cancelOrganizationInvitation(id: string): Promise<ActionResult> {
  const context = await getAuthorizedContext();
  if (!context || !canInviteMembers(context.role) || !id) return { error: "You do not have permission to cancel invitations." };
  const supabase = await createClient();
  const { data: invitation } = await supabase.from("organization_invitations").select("email").eq("id", id).eq("organization_id", context.organization.id).eq("status", "pending").single();
  if (!invitation) return { error: "Invitation not found." };
  const { error } = await supabase.from("organization_invitations").update({ status: "cancelled" as InvitationStatus }).eq("id", id).eq("organization_id", context.organization.id);
  if (error) return { error: "Unable to cancel invitation." };
  await recordOrganizationActivity(context.organization.id, context.user.id, "Invitation cancelled", `Invitation for ${invitation.email} was cancelled.`);
  return { success: true };
}

export async function acceptOrganizationInvitation(token: string): Promise<ActionResult> {
  const context = await getCurrentUserContext();
  if (!context.user || !token) return { error: "Please sign in with the invited email address." };
  const supabase = await createClient();
  const { data: organizationId, error } = await supabase.rpc("accept_organization_invitation", { invitation_token_hash: hashToken(token) });
  if (error || !organizationId) return { error: error?.message.includes("expired") ? "This invitation has expired." : error?.message.includes("match") ? "This invitation belongs to a different email address." : "This invitation is invalid or no longer active." };
  await recordOrganizationActivity(organizationId, context.user.id, "Invitation accepted", `${context.user.email} joined the organization.`);
  revalidatePath("/");
  revalidatePath("/team");
  return { success: true };
}

export async function getOrganizationInvitationPreview(token: string) {
  const context = await getCurrentUserContext();
  if (!context.user || !token) return null;
  const supabase = await createClient();
  // Direct reads are blocked by RLS for non-members; the security-definer RPC
  // returns only the minimum preview fields for the exact token hash.
  const { data, error } = await supabase
    .rpc("preview_organization_invitation", { invitation_token_hash: hashToken(token) })
    .maybeSingle();
  if (error || !data) return null;
  return {
    email: data.email,
    role: data.role,
    status: data.status,
    expiresAt: data.expires_at,
    organizationName: data.organization_name || "BizFlow workspace",
  };
}

export async function changeOrganizationMemberRole(memberId: string, role: UserRole): Promise<ActionResult> {
  const context = await getAuthorizedContext();
  if (!context || !canChangeMemberRole(context.role) || !memberId || !allowedRoles.includes(role)) return { error: "You do not have permission to change this role." };
  const supabase = await createClient();
  const { data: member } = await supabase.from("organization_members").select("user_id, role").eq("id", memberId).eq("organization_id", context.organization.id).single();
  if (!member || !canManageTarget(context.role, member.role) || role === "owner") return { error: "This member role cannot be changed." };
  const { error } = await supabase.from("organization_members").update({ role }).eq("id", memberId).eq("organization_id", context.organization.id);
  if (error) return { error: "Unable to change member role." };
  await recordOrganizationActivity(context.organization.id, context.user.id, "Member role changed", `Member role changed to ${role}.`);
  if (member.user_id !== context.user.id) await createNotification({ recipientId: member.user_id, title: "Your role changed", message: `Your organization role is now ${role}.`, type: "SYSTEM", dedupeKey: `role-changed:${context.organization.id}:${member.user_id}:${memberId}:${role}` });
  revalidatePath("/team");
  return { success: true };
}

export async function removeOrganizationMember(memberId: string): Promise<ActionResult> {
  const context = await getAuthorizedContext();
  if (!context || !canRemoveMember(context.role) || !memberId) return { error: "You do not have permission to remove members." };
  const supabase = await createClient();
  const { data: member } = await supabase.from("organization_members").select("user_id, role").eq("id", memberId).eq("organization_id", context.organization.id).single();
  if (!member || member.user_id === context.user.id || !canManageTarget(context.role, member.role)) return { error: "This member cannot be removed." };
  if (member.role === "owner") return { error: "The organization owner cannot be removed." };
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId).eq("organization_id", context.organization.id);
  if (error) return { error: "Unable to remove member." };
  await recordOrganizationActivity(context.organization.id, context.user.id, "Member removed", "A team member was removed from the organization.");
  await createNotification({ recipientId: member.user_id, title: "You were removed", message: "Your organization membership was removed.", type: "SYSTEM", dedupeKey: `member-removed:${context.organization.id}:${member.user_id}:${memberId}` });
  revalidatePath("/team");
  return { success: true };
}

export async function updateOrganizationDetails(formData: FormData): Promise<ActionResult> {
  const context = await getAuthorizedContext();
  if (!context || !canManageOrganization(context.role)) return { error: "You do not have permission to update organization settings." };
  const name = formData.get("name")?.toString().trim() ?? "";
  const slug = formData.get("slug")?.toString().trim().toLowerCase() || null;
  const contactEmail = formData.get("contactEmail")?.toString().trim() || null;
  const timezone = formData.get("timezone")?.toString().trim() ?? "";
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  if (!name || name.length > 120) return { error: "Organization name is required and must be 120 characters or fewer." };
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Slug may contain lowercase letters, numbers, and hyphens." };
  if (contactEmail && !validEmail(contactEmail)) return { error: "Please enter a valid contact email." };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a three-letter code." };
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ name, slug, contact_email: contactEmail, timezone, currency }).eq("id", context.organization.id);
  if (error) return { error: "Unable to update organization settings." };
  await recordOrganizationActivity(context.organization.id, context.user.id, "Organization settings updated", "Organization details were updated.");
  revalidatePath("/settings");
  revalidatePath("/organization");
  return { success: true };
}
