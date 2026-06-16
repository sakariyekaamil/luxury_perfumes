import { UserRole } from '@prisma/client';

export const RESOURCES = [
  'dashboard',
  'products',
  'categories',
  'brands',
  'inventory',
  'suppliers',
  'customers',
  'purchases',
  'sales',
  'payments',
  'expenses',
  'reports',
  'users',
  'audit_logs',
  'notifications',
  'settings',
] as const;

type Resource = typeof RESOURCES[number];

interface PermissionDef {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const fullAccess = (): PermissionDef => ({
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
});

const readOnly = (): PermissionDef => ({
  canCreate: false,
  canRead: true,
  canUpdate: false,
  canDelete: false,
});

const readWrite = (): PermissionDef => ({
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: false,
});

export const DEFAULT_PERMISSIONS: Record<UserRole, Record<Resource, PermissionDef>> = {
  SUPER_ADMIN: Object.fromEntries(RESOURCES.map((r) => [r, fullAccess()])) as Record<Resource, PermissionDef>,
  ADMIN: Object.fromEntries(RESOURCES.map((r) => [r, fullAccess()])) as Record<Resource, PermissionDef>,
  MANAGER: {
    dashboard: readOnly(),
    products: readWrite(),
    categories: readWrite(),
    brands: readWrite(),
    inventory: readWrite(),
    suppliers: readWrite(),
    customers: fullAccess(),
    purchases: readWrite(),
    sales: fullAccess(),
    payments: readWrite(),
    expenses: readWrite(),
    reports: readOnly(),
    users: readOnly(),
    audit_logs: readOnly(),
    notifications: readOnly(),
    settings: readOnly(),
  },
  CASHIER: {
    dashboard: readOnly(),
    products: readOnly(),
    categories: readOnly(),
    brands: readOnly(),
    inventory: readOnly(),
    suppliers: readOnly(),
    customers: readWrite(),
    purchases: readOnly(),
    sales: fullAccess(),
    payments: readWrite(),
    expenses: readOnly(),
    reports: readOnly(),
    users: readOnly(),
    audit_logs: readOnly(),
    notifications: readOnly(),
    settings: readOnly(),
  },
  INVENTORY_STAFF: {
    dashboard: readOnly(),
    products: readWrite(),
    categories: readOnly(),
    brands: readOnly(),
    inventory: fullAccess(),
    suppliers: readWrite(),
    customers: readOnly(),
    purchases: readWrite(),
    sales: readOnly(),
    payments: readOnly(),
    expenses: readOnly(),
    reports: readOnly(),
    users: readOnly(),
    audit_logs: readOnly(),
    notifications: readOnly(),
    settings: readOnly(),
  },
};
