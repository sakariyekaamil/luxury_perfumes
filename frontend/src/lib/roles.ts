import type { UserRole } from '@/types';
import { hasPermission, PATH_RESOURCE } from './permissions';

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

export const CREATABLE_ROLES: UserRole[] = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

export const STAFF_ROLES: UserRole[] = [
  'MANAGER',
  'CASHIER',
  'INVENTORY_STAFF',
];

export const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

export function isSuperAdmin(role?: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function isAdminRole(role?: string): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isValidRole(role?: string): boolean {
  if (!role) return false;
  return ALL_ROLES.includes(role as UserRole);
}

export function getAssignableRoles(actorRole?: string): UserRole[] {
  if (isSuperAdmin(actorRole)) return [...CREATABLE_ROLES];
  if (actorRole === 'ADMIN') return [...STAFF_ROLES];
  return [];
}

export function canManageUsers(role?: string): boolean {
  return isAdminRole(role);
}

export function canManageTargetUser(actorRole?: string, targetRole?: string): boolean {
  if (!actorRole || !targetRole) return false;
  if (isSuperAdmin(actorRole)) return targetRole !== 'SUPER_ADMIN';
  if (actorRole === 'ADMIN') return STAFF_ROLES.includes(targetRole as UserRole);
  return false;
}

export function formatRoleLabel(role?: string): string {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

/** Nav visibility from DEFAULT_PERMISSIONS canRead */
export function canAccessNav(path: string, role?: string): boolean {
  if (!role || !isValidRole(role)) return false;
  const resource = PATH_RESOURCE[path];
  if (!resource) return false;
  return hasPermission(role, resource, 'read');
}
