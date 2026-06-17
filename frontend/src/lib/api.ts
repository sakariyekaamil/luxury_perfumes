import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: (period?: string) => api.get('/dashboard/revenue', { params: { period } }),
  getSalesAnalytics: (period?: string) => api.get('/dashboard/sales-analytics', { params: { period } }),
};

// Products
export const productApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Catalog
export const catalogApi = {
  getCategories: () => api.get('/catalog/categories'),
  createCategory: (data: unknown) => api.post('/catalog/categories', data),
  updateCategory: (id: string, data: unknown) => api.put(`/catalog/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/catalog/categories/${id}`),
  getBrands: () => api.get('/catalog/brands'),
  createBrand: (data: unknown) => api.post('/catalog/brands', data),
  updateBrand: (id: string, data: unknown) => api.put(`/catalog/brands/${id}`, data),
  deleteBrand: (id: string) => api.delete(`/catalog/brands/${id}`),
  getSuppliers: (params?: Record<string, unknown>) => api.get('/catalog/suppliers', { params }),
  getSupplier: (id: string) => api.get(`/catalog/suppliers/${id}`),
  createSupplier: (data: unknown) => api.post('/catalog/suppliers', data),
  updateSupplier: (id: string, data: unknown) => api.put(`/catalog/suppliers/${id}`, data),
  deleteSupplier: (id: string) => api.delete(`/catalog/suppliers/${id}`),
  getCustomers: (params?: Record<string, unknown>) => api.get('/catalog/customers', { params }),
  getCustomer: (id: string) => api.get(`/catalog/customers/${id}`),
  getVipCustomers: () => api.get('/catalog/customers/vip'),
  createCustomer: (data: unknown) => api.post('/catalog/customers', data),
  updateCustomer: (id: string, data: unknown) => api.put(`/catalog/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/catalog/customers/${id}`),
};

// Operations
export const operationsApi = {
  getInventoryTransactions: (params?: Record<string, unknown>) => api.get('/operations/inventory/transactions', { params }),
  getInventoryValuation: () => api.get('/operations/inventory/valuation'),
  stockIn: (data: unknown) => api.post('/operations/inventory/stock-in', data),
  stockOut: (data: unknown) => api.post('/operations/inventory/stock-out', data),
  adjustStock: (data: unknown) => api.post('/operations/inventory/adjust', data),
  getPurchases: (params?: Record<string, unknown>) => api.get('/operations/purchases', { params }),
  getPurchase: (id: string) => api.get(`/operations/purchases/${id}`),
  createPurchase: (data: unknown) => api.post('/operations/purchases', data),
  approvePurchase: (id: string) => api.post(`/operations/purchases/${id}/approve`),
  cancelPurchase: (id: string) => api.post(`/operations/purchases/${id}/cancel`),
  getSales: (params?: Record<string, unknown>) => api.get('/operations/sales', { params }),
  getSale: (id: string) => api.get(`/operations/sales/${id}`),
  getSaleInvoicePdf: (id: string) => api.get(`/operations/sales/${id}/invoice/pdf`, { responseType: 'blob' }),
  getTopSelling: (limit?: number) => api.get('/operations/sales/top-selling', { params: { limit } }),
  createSale: (data: unknown) => api.post('/operations/sales', data),
  completeSale: (id: string, data?: { paymentMethod?: string }) => api.post(`/operations/sales/${id}/complete`, data),
  cancelSale: (id: string) => api.post(`/operations/sales/${id}/cancel`),
};

// Admin
export const adminApi = {
  getPayments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
  createPayment: (data: unknown) => api.post('/admin/payments', data),
  updatePaymentStatus: (id: string, status: string) => api.patch(`/admin/payments/${id}/status`, { status }),
  getExpenses: (params?: Record<string, unknown>) => api.get('/admin/expenses', { params }),
  getExpenseSummary: (params?: Record<string, unknown>) => api.get('/admin/expenses/summary', { params }),
  createExpense: (data: unknown) => api.post('/admin/expenses', data),
  updateExpense: (id: string, data: unknown) => api.put(`/admin/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/admin/expenses/${id}`),
  getSalesReport: (params?: Record<string, unknown>) => api.get('/admin/reports/sales', { params }),
  getSalesReportPdf: (params?: Record<string, unknown>) =>
    api.get('/admin/reports/sales/pdf', { params, responseType: 'blob' }),
  getSummaryReportPdf: (params?: Record<string, unknown>) =>
    api.get('/admin/reports/summary/pdf', { params, responseType: 'blob' }),
  getInventoryReportPdf: () => api.get('/admin/reports/inventory/pdf', { responseType: 'blob' }),
  getPurchaseReport: (params?: Record<string, unknown>) => api.get('/admin/reports/purchases', { params }),
  getProfitReport: (params?: Record<string, unknown>) => api.get('/admin/reports/profit', { params }),
  getInventoryReport: () => api.get('/admin/reports/inventory'),
  getExpenseReport: (params?: Record<string, unknown>) => api.get('/admin/reports/expenses', { params }),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: unknown) => api.post('/admin/users', data),
  updateUser: (id: string, data: unknown) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: unknown) => api.put('/admin/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/admin/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteLogo: () => api.delete('/admin/settings/logo'),
  getNotifications: (params?: Record<string, unknown>) => api.get('/admin/notifications', { params }),
  markNotificationRead: (id: string) => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/admin/notifications/read-all'),
  getAuditLogs: (params?: Record<string, unknown>) => api.get('/admin/audit-logs', { params }),
};
