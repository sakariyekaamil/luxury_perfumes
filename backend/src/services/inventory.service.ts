import { InventoryTransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AuditService } from './audit.service';

export class InventoryService {
  static async stockIn(productId: string, quantity: number, userId: string, notes?: string, reference?: string) {
    if (quantity <= 0) throw new ValidationError('Quantity must be positive');

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundError('Product not found');

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;

    const [updatedProduct, transaction] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
        include: { brand: true, category: true },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId,
          type: InventoryTransactionType.STOCK_IN,
          quantity,
          previousStock,
          newStock,
          reference,
          notes,
          userId,
        },
      }),
    ]);

    await AuditService.log(userId, 'STOCK_IN', 'Inventory', transaction.id, `Stock in: ${quantity} units of ${product.name}`);
    return { product: updatedProduct, transaction };
  }

  static async stockOut(productId: string, quantity: number, userId: string, notes?: string, reference?: string) {
    if (quantity <= 0) throw new ValidationError('Quantity must be positive');

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundError('Product not found');
    if (product.stockQuantity < quantity) throw new ValidationError('Insufficient stock');

    const previousStock = product.stockQuantity;
    const newStock = previousStock - quantity;

    const [updatedProduct, transaction] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
        include: { brand: true, category: true },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId,
          type: InventoryTransactionType.STOCK_OUT,
          quantity,
          previousStock,
          newStock,
          reference,
          notes,
          userId,
        },
      }),
    ]);

    await AuditService.log(userId, 'STOCK_OUT', 'Inventory', transaction.id, `Stock out: ${quantity} units of ${product.name}`);
    return { product: updatedProduct, transaction };
  }

  static async adjust(productId: string, newQuantity: number, userId: string, notes?: string) {
    if (newQuantity < 0) throw new ValidationError('Quantity cannot be negative');

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundError('Product not found');

    const previousStock = product.stockQuantity;
    const diff = newQuantity - previousStock;

    const [updatedProduct, transaction] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newQuantity },
        include: { brand: true, category: true },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId,
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: Math.abs(diff),
          previousStock,
          newStock: newQuantity,
          notes: notes || `Adjusted from ${previousStock} to ${newQuantity}`,
          userId,
        },
      }),
    ]);

    await AuditService.log(userId, 'ADJUSTMENT', 'Inventory', transaction.id, `Stock adjusted for ${product.name}`);
    return { product: updatedProduct, transaction };
  }

  static async getTransactions(params: { page?: number; limit?: number; productId?: string; type?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.productId) where.productId = params.productId;
    if (params.type) where.type = params.type;

    const [transactions, total] = await prisma.$transaction([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: { include: { brand: true, category: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getValuation() {
    const products = await prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: { brand: true, category: true },
    });

    const valuation = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      costValue: Number(p.costPrice) * p.stockQuantity,
      retailValue: Number(p.sellingPrice) * p.stockQuantity,
      brand: p.brand.name,
      category: p.category.name,
    }));

    const totalCostValue = valuation.reduce((sum, v) => sum + v.costValue, 0);
    const totalRetailValue = valuation.reduce((sum, v) => sum + v.retailValue, 0);

    return {
      items: valuation,
      summary: {
        totalProducts: products.length,
        totalUnits: products.reduce((sum, p) => sum + p.stockQuantity, 0),
        totalCostValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalCostValue,
      },
    };
  }
}
