import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../utils/errors';
import { isAdminRole, isSuperAdmin } from '../config/roles';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  CASHIER: 2,
  INVENTORY_STAFF: 1,
};

export const requireAdminRole = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new ForbiddenError());
  if (!isAdminRole(req.user.role)) {
    return next(new ForbiddenError('Access restricted to admin users only'));
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new ForbiddenError());
  if (!isSuperAdmin(req.user.role)) {
    return next(new ForbiddenError('Access restricted to Super Admin only'));
  }
  next();
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError());

    if (roles.length === 0 || roles.includes(req.user.role as UserRole)) {
      return next();
    }

    next(new ForbiddenError('Insufficient permissions'));
  };
};

export const checkPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError());

    const role = req.user.role as UserRole;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return next();

    const permission = await prisma.permission.findUnique({
      where: {
        role_resource: { role, resource },
      },
    });

    if (!permission) return next(new ForbiddenError('No permission configured'));

    const actionMap = {
      create: permission.canCreate,
      read: permission.canRead,
      update: permission.canUpdate,
      delete: permission.canDelete,
    };

    if (!actionMap[action]) {
      return next(new ForbiddenError(`Cannot ${action} ${resource}`));
    }

    next();
  };
};

export const hasMinRole = (minRole: UserRole) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError());

    const userLevel = ROLE_HIERARCHY[req.user.role as UserRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel >= requiredLevel) return next();
    next(new ForbiddenError('Insufficient role level'));
  };
};
