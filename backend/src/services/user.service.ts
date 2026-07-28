import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuditService } from './audit.service';
import {
  canAssignRole,
  canManageTargetUser,
  getAssignableRoles,
  isValidRole,
} from '../config/roles';

export class UserService {
  static async getAll(params: { page?: number; limit?: number; search?: string; role?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.role && isValidRole(params.role)) {
      where.role = params.role as UserRole;
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  private static async countActiveSuperAdmins(excludeId?: string) {
    return prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        deletedAt: null,
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  private static assertCanAssign(actorRole: string, targetRole: string) {
    const allowed = getAssignableRoles(actorRole);
    if (!canAssignRole(actorRole, targetRole)) {
      throw new ForbiddenError(
        `You cannot assign role ${targetRole}. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }
  }

  static async create(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: UserRole;
    },
    adminId: string,
    actorRole: string
  ) {
    if (!data.email?.trim() || !data.password || !data.firstName?.trim() || !data.lastName?.trim()) {
      throw new ValidationError('First name, last name, email, and password are required');
    }
    if (data.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    this.assertCanAssign(actorRole, data.role);

    const email = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing && !existing.deletedAt) {
      throw new ValidationError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Re-activate soft-deleted account with same email instead of failing unique constraint
    if (existing?.deletedAt) {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone || null,
          role: data.role,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
      await AuditService.log(adminId, 'CREATE', 'User', user.id, `Reactivated user: ${user.email} (${user.role})`);
      return user;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone || null,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await AuditService.log(adminId, 'CREATE', 'User', user.id, `Created user: ${user.email} (${user.role})`);
    return user;
  }

  static async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      role: UserRole;
      isActive: boolean;
      password: string;
    }>,
    adminId: string,
    actorRole: string
  ) {
    const existing = await this.getById(id);

    if (id === adminId) {
      if (data.role && data.role !== existing.role) {
        throw new ForbiddenError('Cannot change your own role');
      }
      if (data.isActive === false) {
        throw new ForbiddenError('Cannot deactivate your own account');
      }
    } else if (!canManageTargetUser(actorRole, existing.role)) {
      throw new ForbiddenError('You cannot manage this user');
    }

    if (data.role !== undefined) {
      this.assertCanAssign(actorRole, data.role);
      if (existing.role === UserRole.SUPER_ADMIN && data.role !== UserRole.SUPER_ADMIN) {
        const remaining = await this.countActiveSuperAdmins(id);
        if (remaining < 1) {
          throw new ForbiddenError('Cannot demote the last Super Admin');
        }
      }
    }

    if (data.isActive === false && existing.role === UserRole.SUPER_ADMIN) {
      const remaining = await this.countActiveSuperAdmins(id);
      if (remaining < 1) {
        throw new ForbiddenError('Cannot deactivate the last Super Admin');
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await AuditService.log(adminId, 'UPDATE', 'User', id, `Updated user: ${user.email}`);
    return user;
  }

  static async delete(id: string, adminId: string, actorRole: string) {
    if (id === adminId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    const user = await this.getById(id);

    if (!canManageTargetUser(actorRole, user.role)) {
      throw new ForbiddenError('You cannot delete this user');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Cannot delete Super Admin accounts');
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await AuditService.log(adminId, 'DELETE', 'User', id, `Deleted user: ${user.email}`);
    return { message: 'User deleted' };
  }
}
