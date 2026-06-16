import { UserRole } from '@prisma/client';

/** Single application role — all privileged users are Admin */
export const ADMIN_ROLE: UserRole = 'ADMIN';
export const ADMIN_ROLES: UserRole[] = ['ADMIN'];

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function formatRoleLabel(role?: string): string {
  if (!role) return 'Admin';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'Admin';
  return role.replace(/_/g, ' ');
}
