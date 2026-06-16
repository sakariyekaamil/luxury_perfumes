export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  brandId: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  description?: string;
  mainImage?: string;
  galleryImages?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  brand?: Brand;
  category?: Category;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isVip: boolean;
  loyaltyPoints: number;
  totalSpent: number;
  sales?: Sale[];
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  userId: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  customer?: Customer;
  user?: { firstName: string; lastName: string };
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  userId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'CANCELLED' | 'RETURNED';
  totalAmount: number;
  notes?: string;
  approvedAt?: string;
  createdAt: string;
  supplier?: Supplier;
  user?: { firstName: string; lastName: string };
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  product?: Product;
}

export interface Payment {
  id: string;
  saleId?: string;
  purchaseId?: string;
  amount: number;
  method: 'CASH' | 'EVC_PLUS' | 'ZAAD' | 'EDAHAB' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'PARTIAL' | 'REFUNDED';
  reference?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'RENT' | 'SALARIES' | 'UTILITIES' | 'MARKETING' | 'OTHER';
  amount: number;
  description: string;
  date: string;
  userId: string;
  user?: { firstName: string; lastName: string };
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  product?: Product;
  user?: { firstName: string; lastName: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyLogo?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxEnabled: boolean;
  invoicePrefix: string;
  invoiceFooter?: string;
  lowStockThreshold: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalPurchases: number;
  totalProfit: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  topSellingPerfumes: Array<{ product: Product; totalSold: number }>;
  todayRevenue: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  recentActivities: AuditLog[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
