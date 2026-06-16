import type { UserRole } from '@/types';

export const ADMIN_ROLE: UserRole = 'ADMIN';
export const ADMIN_ROLES: UserRole[] = ['ADMIN'];

export function isAdminRole(role?: string): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function formatRoleLabel(role?: string): string {
  if (!role) return 'Admin';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'Admin';
  return role.replace(/_/g, ' ');
}
