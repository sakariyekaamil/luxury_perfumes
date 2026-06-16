import { prisma } from '../config/database';

export class ReportService {
  static async getSalesReport(startDate: string, endDate: string) {
    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        customer: true,
        user: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax), 0);

    return {
      sales,
      summary: {
        count: sales.length,
        totalRevenue,
        totalDiscount,
        totalTax,
        averageSale: sales.length > 0 ? totalRevenue / sales.length : 0,
      },
      period: { startDate, endDate },
    };
  }

  static async getPurchaseReport(startDate: string, endDate: string) {
    const purchases = await prisma.purchase.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        supplier: true,
        user: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    return {
      purchases,
      summary: {
        count: purchases.length,
        totalAmount,
        averagePurchase: purchases.length > 0 ? totalAmount / purchases.length : 0,
      },
      period: { startDate, endDate },
    };
  }

  static async getProfitReport(startDate: string, endDate: string) {
    const salesReport = await this.getSalesReport(startDate, endDate);
    const purchaseReport = await this.getPurchaseReport(startDate, endDate);

    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const revenue = salesReport.summary.totalRevenue;
    const purchases = purchaseReport.summary.totalAmount;
    const grossProfit = revenue - purchases;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue,
      purchases,
      expenses: totalExpenses,
      grossProfit,
      netProfit,
      margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      period: { startDate, endDate },
    };
  }

  static async getInventoryReport() {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { brand: true, category: true },
      orderBy: { name: 'asc' },
    });

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      brand: p.brand.name,
      category: p.category.name,
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      costValue: Number(p.costPrice) * p.stockQuantity,
      retailValue: Number(p.sellingPrice) * p.stockQuantity,
      status: p.status,
      isLowStock: p.stockQuantity <= p.minimumStock,
    }));

    return {
      items,
      summary: {
        totalProducts: products.length,
        totalUnits: products.reduce((sum, p) => sum + p.stockQuantity, 0),
        totalCostValue: items.reduce((sum, i) => sum + i.costValue, 0),
        totalRetailValue: items.reduce((sum, i) => sum + i.retailValue, 0),
        lowStockCount: items.filter((i) => i.isLowStock).length,
      },
    };
  }

  static async getExpenseReport(startDate: string, endDate: string) {
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });

    const byCategory: Record<string, number> = {};
    let total = 0;
    expenses.forEach((e) => {
      const amount = Number(e.amount);
      total += amount;
      byCategory[e.category] = (byCategory[e.category] || 0) + amount;
    });

    return {
      expenses,
      summary: { total, byCategory, count: expenses.length },
      period: { startDate, endDate },
    };
  }

  static getDateRange(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }
}
