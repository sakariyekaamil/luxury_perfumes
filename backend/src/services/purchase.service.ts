import { Prisma, PurchaseStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AuditService } from './audit.service';
import { InventoryService } from './inventory.service';

export class PurchaseService {
  static async generateNumber(): Promise<string> {
    const count = await prisma.purchase.count();
    return `PO-${String(count + 1).padStart(6, '0')}`;
  }

  static async getAll(params: { page?: number; limit?: number; status?: string; supplierId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status as PurchaseStatus;
    if (params.supplierId) where.supplierId = params.supplierId;

    const [purchases, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          user: { select: { id: true, firstName: true, lastName: true } },
          items: { include: { product: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count({ where }),
    ]);

    return {
      data: purchases,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { include: { brand: true, category: true } } } },
        payments: true,
        returns: { include: { items: true } },
      },
    });
    if (!purchase) throw new NotFoundError('Purchase not found');
    return purchase;
  }

  static async create(data: {
    supplierId: string;
    userId: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitCost: number }>;
  }) {
    if (!data.items?.length) throw new ValidationError('Purchase must have at least one item');

    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber: await this.generateNumber(),
        supplierId: data.supplierId,
        userId: data.userId,
        totalAmount,
        notes: data.notes,
        status: PurchaseStatus.DRAFT,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await AuditService.log(data.userId, 'CREATE', 'Purchase', purchase.id, `Created purchase ${purchase.purchaseNumber}`);
    return purchase;
  }

  static async approve(id: string, userId: string) {
    const purchase = await this.getById(id);
    if (purchase.status !== PurchaseStatus.DRAFT && purchase.status !== PurchaseStatus.PENDING) {
      throw new ValidationError('Purchase cannot be approved in current status');
    }

    for (const item of purchase.items) {
      await InventoryService.stockIn(
        item.productId,
        item.quantity,
        userId,
        `Purchase approved: ${purchase.purchaseNumber}`,
        purchase.purchaseNumber
      );
    }

    const updated = await prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.APPROVED, approvedAt: new Date() },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await prisma.notification.create({
      data: {
        type: 'NEW_PURCHASE',
        title: 'Purchase Approved',
        message: `Purchase ${purchase.purchaseNumber} has been approved`,
        data: { purchaseId: id },
      },
    });

    await AuditService.log(userId, 'APPROVE', 'Purchase', id, `Approved purchase ${purchase.purchaseNumber}`);
    return updated;
  }

  static async cancel(id: string, userId: string) {
    const purchase = await this.getById(id);
    if (purchase.status === PurchaseStatus.APPROVED) {
      throw new ValidationError('Cannot cancel approved purchase');
    }

    const updated = await prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
    });

    await AuditService.log(userId, 'CANCEL', 'Purchase', id, `Cancelled purchase ${purchase.purchaseNumber}`);
    return updated;
  }
}
