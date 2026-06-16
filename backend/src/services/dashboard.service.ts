import { prisma } from '../config/database';

export class DashboardService {
  static async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const settings = await prisma.companySettings.findFirst();
    const lowStockThreshold = settings?.lowStockThreshold ?? 5;

    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      lowStockProducts,
      completedSales,
      approvedPurchases,
      totalExpenses,
      todaySales,
      monthSales,
      recentActivities,
      topSelling,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.supplier.count({ where: { deletedAt: null, isActive: true } }),
      prisma.product.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          stockQuantity: { lte: lowStockThreshold },
        },
      }),
      prisma.sale.findMany({
        where: { status: 'COMPLETED', deletedAt: null },
        select: { totalAmount: true, subtotal: true },
      }),
      prisma.purchase.findMany({
        where: { status: 'APPROVED', deletedAt: null },
        select: { totalAmount: true },
      }),
      prisma.expense.findMany({
        where: { deletedAt: null },
        select: { amount: true },
      }),
      prisma.sale.aggregate({
        where: { status: 'COMPLETED', deletedAt: null, createdAt: { gte: startOfDay } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { status: 'COMPLETED', deletedAt: null, createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalPurchases = approvedPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalExpenseAmount = totalExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalProfit = totalRevenue - totalPurchases - totalExpenseAmount;

    const topProductIds = topSelling.map((t) => t.productId);
    const topProducts = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      include: { brand: true },
    });

    const topSellingPerfumes = topSelling.map((t) => ({
      product: topProducts.find((p) => p.id === t.productId),
      totalSold: t._sum.quantity || 0,
    }));

    const lowStock = await prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE', stockQuantity: { lte: lowStockThreshold } },
      include: { brand: true, category: true },
      take: 10,
      orderBy: { stockQuantity: 'asc' },
    });

    return {
      totalRevenue,
      totalSales: completedSales.length,
      totalPurchases: approvedPurchases.length,
      totalProfit,
      totalCustomers,
      totalSuppliers,
      totalProducts,
      lowStockCount: lowStockProducts,
      lowStockProducts: lowStock,
      topSellingPerfumes,
      todayRevenue: Number(todaySales._sum.totalAmount || 0),
      todaySalesCount: todaySales._count,
      monthRevenue: Number(monthSales._sum.totalAmount || 0),
      monthSalesCount: monthSales._count,
      recentActivities,
    };
  }

  static async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupFormat = 'day';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        groupFormat = 'week';
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupFormat = 'month';
        break;
    }

    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        createdAt: { gte: startDate },
      },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    sales.forEach((sale) => {
      const date = sale.createdAt;
      let key: string;
      if (groupFormat === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupFormat === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      grouped[key] = (grouped[key] || 0) + Number(sale.totalAmount);
    });

    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }

  static async getSalesAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const revenueData = await this.getRevenueAnalytics(period);
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const grouped: Record<string, number> = {};
    sales.forEach((sale) => {
      const key = `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return {
      revenue: revenueData,
      salesCount: Object.entries(grouped).map(([date, count]) => ({ date, count })),
    };
  }
}
