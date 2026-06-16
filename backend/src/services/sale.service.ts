import { Prisma, SaleStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AuditService } from './audit.service';
import { InventoryService } from './inventory.service';

export class SaleService {
  static async generateNumber(): Promise<string> {
    const count = await prisma.sale.count();
    return `SL-${String(count + 1).padStart(6, '0')}`;
  }

  static async getAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status as SaleStatus;
    if (params.customerId) where.customerId = params.customerId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [sales, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
          items: { include: { product: true } },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const sale = await prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { include: { brand: true, category: true } } } },
        payments: true,
        returns: { include: { items: true } },
      },
    });
    if (!sale) throw new NotFoundError('Sale not found');
    return sale;
  }

  static async create(data: {
    customerId?: string;
    userId: string;
    notes?: string;
    discount?: number;
    tax?: number;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number }>;
  }) {
    if (!data.items?.length) throw new ValidationError('Sale must have at least one item');

    for (const item of data.items) {
      const product = await prisma.product.findFirst({ where: { id: item.productId, deletedAt: null } });
      if (!product) throw new NotFoundError(`Product not found: ${item.productId}`);
      if (product.stockQuantity < item.quantity) {
        throw new ValidationError(`Insufficient stock for ${product.name}`);
      }
    }

    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
      return sum + itemTotal;
    }, 0);

    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = subtotal - discount + tax;

    const sale = await prisma.sale.create({
      data: {
        saleNumber: await this.generateNumber(),
        customerId: data.customerId,
        userId: data.userId,
        subtotal,
        discount,
        tax,
        totalAmount,
        notes: data.notes,
        status: SaleStatus.DRAFT,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice - (item.discount || 0),
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    await AuditService.log(data.userId, 'CREATE', 'Sale', sale.id, `Created sale ${sale.saleNumber}`);
    return sale;
  }

  static async complete(id: string, userId: string, paymentMethod?: PaymentMethod) {
    const sale = await this.getById(id);
    if (sale.status !== SaleStatus.DRAFT) {
      throw new ValidationError('Sale is not in draft status');
    }

    for (const item of sale.items) {
      await InventoryService.stockOut(
        item.productId,
        item.quantity,
        userId,
        `Sale completed: ${sale.saleNumber}`,
        sale.saleNumber
      );
    }

    if (sale.customerId) {
      await prisma.customer.update({
        where: { id: sale.customerId },
        data: {
          totalSpent: { increment: sale.totalAmount },
          loyaltyPoints: { increment: Math.floor(Number(sale.totalAmount) / 10) },
        },
      });
    }

    await prisma.sale.update({
      where: { id },
      data: { status: SaleStatus.COMPLETED, completedAt: new Date() },
    });

    if (paymentMethod) {
      await prisma.payment.create({
        data: {
          saleId: id,
          amount: sale.totalAmount,
          method: paymentMethod,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
    }

    const result = await this.getById(id);
    await AuditService.log(userId, 'APPROVE', 'Sale', id, `Completed sale ${sale.saleNumber}`);
    return result;
  }

  static async cancel(id: string, userId: string) {
    const sale = await this.getById(id);
    if (sale.status === SaleStatus.COMPLETED) {
      throw new ValidationError('Cannot cancel completed sale');
    }

    const updated = await prisma.sale.update({
      where: { id },
      data: { status: SaleStatus.CANCELLED },
    });

    await AuditService.log(userId, 'CANCEL', 'Sale', id, `Cancelled sale ${sale.saleNumber}`);
    return updated;
  }

  static async getTopSelling(limit = 10) {
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true, category: true },
    });

    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product,
        totalSold: item._sum.quantity || 0,
      };
    });
  }
}
