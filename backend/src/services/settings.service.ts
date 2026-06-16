import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class SettingsService {
  static async get() {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }
    return settings;
  }

  static async update(data: Partial<{
    companyName: string;
    companyLogo: string | null;
    address: string;
    phone: string;
    email: string;
    currency: string;
    currencySymbol: string;
    taxRate: number;
    taxEnabled: boolean;
    invoicePrefix: string;
    invoiceFooter: string;
    lowStockThreshold: number;
  }>) {
    const settings = await this.get();
    return prisma.companySettings.update({ where: { id: settings.id }, data });
  }
}

export class NotificationService {
  static async getAll(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { OR: [{ userId }, { userId: null }] };
    if (params.unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async markAsRead(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundError('Notification not found');
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
  }
}

export class AuditLogService {
  static async getAll(params: { page?: number; limit?: number; entity?: string; action?: string; userId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;
    if (params.userId) where.userId = params.userId;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
