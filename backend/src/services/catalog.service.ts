import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class CategoryService {
  static async getAll() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async create(data: { name: string; description?: string }) {
    return prisma.category.create({ data });
  }

  static async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    await this.getById(id);
    return prisma.category.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class BrandService {
  static async getAll() {
    return prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const brand = await prisma.brand.findFirst({ where: { id, deletedAt: null } });
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  static async create(data: { name: string; description?: string; logo?: string }) {
    return prisma.brand.create({ data });
  }

  static async update(id: string, data: { name?: string; description?: string; logo?: string; isActive?: boolean }) {
    await this.getById(id);
    return prisma.brand.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class SupplierService {
  static async getAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { companyName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);

    return { data: suppliers, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getById(id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchases: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: { include: { product: true } } },
        },
      },
    });
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  static async create(data: { name: string; phone?: string; email?: string; address?: string; companyName?: string }) {
    return prisma.supplier.create({ data });
  }

  static async update(id: string, data: Partial<{ name: string; phone: string; email: string; address: string; companyName: string; isActive: boolean }>) {
    await this.getById(id);
    return prisma.supplier.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class CustomerService {
  static async getAll(params: { page?: number; limit?: number; search?: string; isVip?: boolean }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.isVip !== undefined) where.isVip = params.isVip;

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { totalSpent: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    return { data: customers, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        sales: {
          where: { deletedAt: null, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: { include: { product: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  static async create(data: { name: string; phone?: string; email?: string; address?: string; isVip?: boolean }) {
    return prisma.customer.create({ data });
  }

  static async update(id: string, data: Partial<{ name: string; phone: string; email: string; address: string; isVip: boolean }>) {
    await this.getById(id);
    return prisma.customer.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.getById(id);
    return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  static async getVipCustomers() {
    return prisma.customer.findMany({
      where: { deletedAt: null, isVip: true },
      orderBy: { totalSpent: 'desc' },
    });
  }
}
