import type { UserRole } from "@/types/database.types";

export type Role = "owner" | "admin" | "member";

export type Permission =
  | "org:update"
  | "org:delete"
  | "members:manage"
  | "members:view"
  | "customers:create"
  | "customers:read"
  | "customers:update"
  | "customers:delete"
  | "leads:create"
  | "leads:read"
  | "leads:update"
  | "leads:delete"
  | "tasks:create"
  | "tasks:read"
  | "tasks:update"
  | "tasks:delete"
  | "billing:manage"
  | "integrations:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "org:update",
    "org:delete",
    "members:manage",
    "members:view",
    "customers:create",
    "customers:read",
    "customers:update",
    "customers:delete",
    "leads:create",
    "leads:read",
    "leads:update",
    "leads:delete",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "billing:manage",
    "integrations:manage",
  ],
  admin: [
    "org:update",
    "members:manage",
    "members:view",
    "customers:create",
    "customers:read",
    "customers:update",
    "customers:delete",
    "leads:create",
    "leads:read",
    "leads:update",
    "leads:delete",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "billing:manage",
    "integrations:manage",
  ],
  member: [
    "members:view",
    "customers:create",
    "customers:read",
    "customers:update",
    "leads:create",
    "leads:read",
    "leads:update",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
  ],
};

export function isOwner(role?: Role | UserRole | null): boolean {
  return role === "owner";
}

export function isAdmin(role?: Role | UserRole | null): boolean {
  return role === "admin";
}

export function isMember(role?: Role | UserRole | null): boolean {
  return role === "member";
}

export function isOrgAdminOrOwner(role?: Role | UserRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageOrganization(role?: Role | UserRole | null): boolean {
  return isOrgAdminOrOwner(role);
}

export function canManageMembers(role?: Role | UserRole | null): boolean {
  return isOrgAdminOrOwner(role);
}

export function canManageBilling(role?: Role | UserRole | null): boolean {
  return isOrgAdminOrOwner(role);
}

export function canManageIntegrations(role?: Role | UserRole | null): boolean {
  return isOrgAdminOrOwner(role);
}

export function canDeleteRecords(role?: Role | UserRole | null): boolean {
  return isOrgAdminOrOwner(role);
}

export function hasPermission(role: Role | UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role as Role]?.includes(permission) ?? false;
}
