import { UserRole } from '@prisma/client';

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

/** Roles SUPER_ADMIN may assign */
export const CREATABLE_ROLES: UserRole[] = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

/** Roles ADMIN may assign (staff only) */
export const STAFF_ROLES: UserRole[] = [
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

/** Privileged admin-tier roles */
export const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isValidRole(role: string): boolean {
  return ALL_ROLES.includes(role as UserRole);
}

export function isCreatableRole(role: string): boolean {
  return CREATABLE_ROLES.includes(role as UserRole);
}

/** Roles the actor is allowed to assign when creating/updating users */
export function getAssignableRoles(actorRole: string): UserRole[] {
  if (isSuperAdmin(actorRole)) return [...CREATABLE_ROLES];
  if (actorRole === 'ADMIN') return [...STAFF_ROLES];
  return [];
}

export function canAssignRole(actorRole: string, targetRole: string): boolean {
  return getAssignableRoles(actorRole).includes(targetRole as UserRole);
}

/** Whether actor may edit/delete the target user */
export function canManageTargetUser(actorRole: string, targetRole: string): boolean {
  if (isSuperAdmin(actorRole)) {
    // SUPER_ADMIN manages ADMIN + staff; never delete/demote SUPER_ADMIN via this path
    return targetRole !== 'SUPER_ADMIN';
  }
  if (actorRole === 'ADMIN') {
    return STAFF_ROLES.includes(targetRole as UserRole);
  }
  return false;
}

export function formatRoleLabel(role?: string): string {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
