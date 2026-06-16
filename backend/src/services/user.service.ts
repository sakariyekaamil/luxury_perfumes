import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuditService } from './audit.service';
import { isAdminRole, ADMIN_ROLES } from '../config/roles';

export class UserService {
  static async getAll(params: { page?: number; limit?: number; search?: string; role?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      role: { in: ADMIN_ROLES },
    };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.role && isAdminRole(params.role)) {
      where.role = params.role;
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

  static async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }, adminId: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ValidationError('Email already exists');

    if (!isAdminRole(data.role)) {
      throw new ValidationError('Only Admin role is allowed');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: UserRole.ADMIN,
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

    await AuditService.log(adminId, 'CREATE', 'User', user.id, `Created user: ${user.email}`);
    return user;
  }

  static async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
  }>, adminId: string) {
    await this.getById(id);

    if (data.role && !isAdminRole(data.role)) {
      throw new ValidationError('Only Admin role is allowed');
    }
    if (data.role) {
      data.role = UserRole.ADMIN;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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

    await AuditService.log(adminId, 'UPDATE', 'User', id, `Updated user: ${user.email}`);
    return user;
  }

  static async delete(id: string, adminId: string) {
    const user = await this.getById(id);
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await AuditService.log(adminId, 'DELETE', 'User', id, `Deleted user: ${user.email}`);
    return { message: 'User deleted' };
  }
}
