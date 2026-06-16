import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class PaymentService {
  static async getAll(params: { page?: number; limit?: number; status?: string; saleId?: string; purchaseId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.saleId) where.saleId = params.saleId;
    if (params.purchaseId) where.purchaseId = params.purchaseId;

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: { sale: true, purchase: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async create(data: {
    saleId?: string;
    purchaseId?: string;
    amount: number;
    method: PaymentMethod;
    status?: PaymentStatus;
    reference?: string;
    notes?: string;
  }) {
    const payment = await prisma.payment.create({
      data: {
        saleId: data.saleId,
        purchaseId: data.purchaseId,
        amount: data.amount,
        method: data.method,
        status: data.status || PaymentStatus.PENDING,
        reference: data.reference,
        notes: data.notes,
        paidAt: data.status === PaymentStatus.PAID ? new Date() : null,
      },
      include: { sale: true, purchase: true },
    });

    return payment;
  }

  static async updateStatus(id: string, status: PaymentStatus) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment not found');

    return prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === PaymentStatus.PAID ? new Date() : payment.paidAt,
      },
      include: { sale: true, purchase: true },
    });
  }
}

export class ExpenseService {
  static async getAll(params: { page?: number; limit?: number; category?: string; startDate?: string; endDate?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params.category) where.category = params.category;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) where.date.lte = new Date(params.endDate);
    }

    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true } } },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return { data: expenses, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async create(data: { category: any; amount: number; description: string; date?: Date; userId: string }) {
    return prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date || new Date(),
        userId: data.userId,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  static async update(id: string, data: Partial<{ category: any; amount: number; description: string; date: Date }>) {
    const expense = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!expense) throw new NotFoundError('Expense not found');
    return prisma.expense.update({
      where: { id },
      data,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  static async delete(id: string) {
    const expense = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!expense) throw new NotFoundError('Expense not found');
    return prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  static async getSummary(startDate?: string, endDate?: string) {
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({ where });
    const byCategory: Record<string, number> = {};
    let total = 0;

    expenses.forEach((e) => {
      const amount = Number(e.amount);
      total += amount;
      byCategory[e.category] = (byCategory[e.category] || 0) + amount;
    });

    return { total, byCategory, count: expenses.length };
  }
}
