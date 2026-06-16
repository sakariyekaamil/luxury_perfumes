import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';

export class ProductService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    status?: string;
    lowStock?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.brandId) where.brandId = params.brandId;
    if (params.status) where.status = params.status as any;
    if (params.lowStock) {
      where.stockQuantity = { lte: await this.getLowStockThreshold() };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { brand: true, category: true },
    });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  static async create(data: any, userId: string) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || this.generateBarcode(),
        brandId: data.brandId,
        categoryId: data.categoryId,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity || 0,
        minimumStock: data.minimumStock || 5,
        description: data.description,
        mainImage: data.mainImage,
        galleryImages: data.galleryImages || [],
        status: data.status || 'ACTIVE',
      },
      include: { brand: true, category: true },
    });

    await AuditService.log(userId, 'CREATE', 'Product', product.id, `Created product: ${product.name}`);
    return product;
  }

  static async update(id: string, data: any, userId: string) {
    await this.getById(id);
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        brandId: data.brandId,
        categoryId: data.categoryId,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        minimumStock: data.minimumStock,
        description: data.description,
        mainImage: data.mainImage,
        galleryImages: data.galleryImages,
        status: data.status,
      },
      include: { brand: true, category: true },
    });

    await AuditService.log(userId, 'UPDATE', 'Product', id, `Updated product: ${product.name}`);
    return product;
  }

  static async delete(id: string, userId: string) {
    const product = await this.getById(id);
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await AuditService.log(userId, 'DELETE', 'Product', id, `Deleted product: ${product.name}`);
    return { message: 'Product deleted' };
  }

  static generateBarcode(): string {
    return `MP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  static async getLowStockThreshold(): Promise<number> {
    const settings = await prisma.companySettings.findFirst();
    return settings?.lowStockThreshold || 5;
  }

  static async getLowStock() {
    const threshold = await this.getLowStockThreshold();
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        stockQuantity: { lte: threshold },
      },
      include: { brand: true, category: true },
      orderBy: { stockQuantity: 'asc' },
    });
  }
}
