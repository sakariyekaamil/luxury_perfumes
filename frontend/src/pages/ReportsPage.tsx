import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Upload, X, ImageIcon } from 'lucide-react';
import { adminApi, operationsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, downloadBlob, resolveMediaUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Card, StatCard } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { isAdminRole, formatRoleLabel } from '@/lib/roles';
import type { Sale, CompanySettings } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', period],
    queryFn: () => adminApi.getSalesReport({ period }),
  });

  const { data: profitReport, isLoading: profitLoading } = useQuery({
    queryKey: ['report-profit', period],
    queryFn: () => adminApi.getProfitReport({ period }),
  });

  const { data: inventoryReport } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => adminApi.getInventoryReport(),
  });

  const sales = salesReport?.data?.data?.summary;
  const salesList: Sale[] = salesReport?.data?.data?.sales || [];
  const profit = profitReport?.data?.data;
  const inventory = inventoryReport?.data?.data?.summary;

  const downloadPdf = async (key: string, fn: () => Promise<{ data: Blob }>, filename: string) => {
    setDownloading(key);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
    } catch {
      alert('Failed to download PDF. Ensure the backend is running.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadSaleInvoice = async (saleId: string, saleNumber: string) => {
    setDownloading(`invoice-${saleId}`);
    try {
      const res = await operationsApi.getSaleInvoicePdf(saleId);
      downloadBlob(res.data, `invoice-${saleNumber}.pdf`);
    } catch {
      alert('Failed to download invoice PDF.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Reports</h1>
          <p className="text-slate-500">Business analytics — download PDF reports and invoices</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
            <Button key={p} variant={period === p ? 'gold' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="gold"
          size="sm"
          loading={downloading === 'summary'}
          onClick={() =>
            downloadPdf('summary', () => adminApi.getSummaryReportPdf({ period }), `business-report-${period}.pdf`)
          }
        >
          <Download className="w-4 h-4 mr-1" />
          Business Report PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={downloading === 'sales'}
          onClick={() =>
            downloadPdf('sales', () => adminApi.getSalesReportPdf({ period }), `sales-report-${period}.pdf`)
          }
        >
          <Download className="w-4 h-4 mr-1" />
          Sales Report PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={downloading === 'inventory'}
          onClick={() =>
            downloadPdf('inventory', () => adminApi.getInventoryReportPdf(), 'inventory-report.pdf')
          }
        >
          <Download className="w-4 h-4 mr-1" />
          Inventory PDF
        </Button>
      </div>

      {(salesLoading || profitLoading) ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Revenue" value={formatCurrency(sales?.totalRevenue || 0)} />
            <StatCard title="Sales Count" value={sales?.count || 0} />
            <StatCard title="Gross Profit" value={formatCurrency(profit?.grossProfit || 0)} />
            <StatCard title="Net Profit" value={formatCurrency(profit?.netProfit || 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Profit Breakdown">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b dark:border-slate-700">
                  <span>Revenue</span>
                  <span className="font-semibold text-green-600">{formatCurrency(profit?.revenue || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-slate-700">
                  <span>Purchases</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(profit?.purchases || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-slate-700">
                  <span>Expenses</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(profit?.expenses || 0)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-bold">Net Profit</span>
                  <span className="font-bold text-gold text-lg">{formatCurrency(profit?.netProfit || 0)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Margin</span>
                  <span className="font-semibold">{profit?.margin?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </Card>

            <Card title="Inventory Summary">
              {inventory ? (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b dark:border-slate-700">
                    <span>Total Products</span>
                    <span className="font-semibold">{inventory.totalProducts}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-slate-700">
                    <span>Total Units</span>
                    <span className="font-semibold">{inventory.totalUnits}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-slate-700">
                    <span>Cost Value</span>
                    <span className="font-semibold">{formatCurrency(inventory.totalCostValue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-slate-700">
                    <span>Retail Value</span>
                    <span className="font-semibold">{formatCurrency(inventory.totalRetailValue)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Low Stock Items</span>
                    <span className="font-semibold text-red-500">{inventory.lowStockCount}</span>
                  </div>
                </div>
              ) : <LoadingSpinner />}
            </Card>
          </div>

          <Card title="Sales Invoices" description={`Completed sales for ${period} period — download invoice PDF`}>
            {salesList.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No sales in this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Sale #</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {salesList.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-3 py-3 font-medium">{sale.saleNumber}</td>
                        <td className="px-3 py-3 text-slate-500">{sale.customer?.name || 'Walk-in'}</td>
                        <td className="px-3 py-3 font-semibold">{formatCurrency(Number(sale.totalAmount))}</td>
                        <td className="px-3 py-3 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            loading={downloading === `invoice-${sale.id}`}
                            onClick={() => downloadSaleInvoice(sale.id, sale.saleNumber)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminApi.getUsers({ limit: 50 }),
  });

  const users = (data?.data?.data || []).filter(
    (u: { role: string }) => isAdminRole(u.role)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">User Management</h1>
        <p className="text-slate-500">Admin users only</p>
      </div>
      <Card>
        {isLoading ? <LoadingSpinner /> : users.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No admin users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {users.map((u: { id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">{formatRoleLabel(u.role)}</td>
                    <td className="px-4 py-3">
                      <span className={u.isActive ? 'text-green-600' : 'text-red-500'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminApi.getAuditLogs({ limit: 50 }),
  });

  const logs = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Audit Logs</h1>
        <p className="text-slate-500">System activity tracking</p>
      </div>
      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {logs.map((log: { id: string; action: string; entity: string; details?: string; createdAt: string; user?: { firstName: string; lastName: string } }) => (
              <div key={log.id} className="flex items-start gap-3 py-3 border-b dark:border-slate-700 last:border-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold">
                  {log.user?.firstName?.[0] || 'S'}
                </div>
                <div>
                  <p className="text-sm font-medium">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} — {log.action} on {log.entity}</p>
                  <p className="text-xs text-slate-500">{log.details}</p>
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => adminApi.getNotifications({ limit: 50 }),
  });

  const notifications = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Notifications</h1>
        <p className="text-slate-500">System alerts and notifications</p>
      </div>
      <Card>
        {isLoading ? <LoadingSpinner /> : notifications.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: { id: string; title: string; message: string; isRead: boolean; createdAt: string; type: string }) => (
              <div key={n.id} className={`p-4 rounded-lg border ${n.isRead ? 'border-slate-200 dark:border-slate-700' : 'border-gold/30 bg-gold/5'}`}>
                <div className="flex justify-between">
                  <p className="font-medium">{n.title}</p>
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const settings = data?.data?.data as CompanySettings | undefined;

  const [form, setForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    companyLogo: '',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: '0',
    taxEnabled: true,
    invoicePrefix: 'MP',
    invoiceFooter: '',
    lowStockThreshold: '5',
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      companyName: settings.companyName || '',
      email: settings.email || '',
      phone: settings.phone || '',
      address: settings.address || '',
      companyLogo: settings.companyLogo || '',
      currency: settings.currency || 'USD',
      currencySymbol: settings.currencySymbol || '$',
      taxRate: String(Number(settings.taxRate) || 0),
      taxEnabled: settings.taxEnabled,
      invoicePrefix: settings.invoicePrefix || 'MP',
      invoiceFooter: settings.invoiceFooter || '',
      lowStockThreshold: String(settings.lowStockThreshold ?? 5),
    });
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (payload: unknown) => adminApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleCurrencyChange = (currency: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', SOS: 'Sh' };
    setForm((f) => ({
      ...f,
      currency,
      currencySymbol: symbols[currency] || f.currencySymbol,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError('Company name is required');
      return;
    }
    mutation.mutate({
      companyName: form.companyName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      companyLogo: form.companyLogo.trim() || undefined,
      currency: form.currency,
      currencySymbol: form.currencySymbol.trim(),
      taxRate: Number(form.taxRate) || 0,
      taxEnabled: form.taxEnabled,
      invoicePrefix: form.invoicePrefix.trim() || 'MP',
      invoiceFooter: form.invoiceFooter.trim() || undefined,
      lowStockThreshold: Math.max(0, Number(form.lowStockThreshold) || 0),
    });
  };

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please choose a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be 2MB or smaller');
      return;
    }

    setLogoUploading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const res = await adminApi.uploadLogo(file);
      const updated = res.data.data as CompanySettings;
      setForm((f) => ({ ...f, companyLogo: updated.companyLogo || '' }));
      setLogoPreview('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: unknown) {
      setLogoPreview('');
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setLogoUploading(true);
    setError('');
    try {
      await adminApi.deleteLogo();
      setForm((f) => ({ ...f, companyLogo: '' }));
      setLogoPreview('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to remove logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const logoSrc = logoPreview || (form.companyLogo ? resolveMediaUrl(form.companyLogo) : '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Settings</h1>
          <p className="text-slate-500">Company profile, invoices, and system configuration</p>
        </div>
        {saved && (
          <span className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
            Settings saved successfully
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <Card title="Company Profile">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="companyName"
                label="Company Name"
                value={form.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                required
              />
              <Input
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="info@luxuryperfumes.com"
              />
              <Input
                id="phone"
                label="Phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+252-63-000-0000"
              />
              <div className="sm:col-span-2">
                <p className="luxury-label mb-2">Company Logo</p>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-primary-800 overflow-hidden">
                    {logoSrc ? (
                      <img src={logoSrc} alt="Company logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="logoUpload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={logoUploading}
                      onClick={() => document.getElementById('logoUpload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Logo
                    </Button>
                    {form.companyLogo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={logoUploading}
                        onClick={handleLogoDelete}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove Logo
                      </Button>
                    )}
                    <p className="text-xs text-slate-500">JPEG, PNG, WebP or GIF. Max 2MB.</p>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  id="address"
                  label="Address"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Hargeisa, Somaliland"
                />
              </div>
            </div>
          </Card>

          <Card title="Currency & Tax">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="currency"
                label="Currency"
                value={form.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD — US Dollar' },
                  { value: 'EUR', label: 'EUR — Euro' },
                  { value: 'GBP', label: 'GBP — British Pound' },
                  { value: 'SOS', label: 'SOS — Somali Shilling' },
                ]}
              />
              <Input
                id="currencySymbol"
                label="Currency Symbol"
                value={form.currencySymbol}
                onChange={(e) => setField('currencySymbol', e.target.value)}
                maxLength={5}
              />
              <Input
                id="taxRate"
                label="Tax Rate (%)"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.taxRate}
                onChange={(e) => setField('taxRate', e.target.value)}
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.taxEnabled}
                    onChange={(e) => setField('taxEnabled', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
                  />
                  <span className="text-sm font-medium text-primary-900 dark:text-white">Enable tax on sales</span>
                </label>
              </div>
            </div>
          </Card>

          <Card title="Invoice Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="invoicePrefix"
                label="Invoice Prefix"
                value={form.invoicePrefix}
                onChange={(e) => setField('invoicePrefix', e.target.value)}
                placeholder="MP"
              />
              <div className="sm:col-span-2">
                <Textarea
                  id="invoiceFooter"
                  label="Invoice Footer Message"
                  value={form.invoiceFooter}
                  onChange={(e) => setField('invoiceFooter', e.target.value)}
                  placeholder="Thank you for shopping at Luxury Perfumes"
                />
              </div>
            </div>
          </Card>

          <Card title="Inventory Alerts">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="lowStockThreshold"
                label="Low Stock Threshold (units)"
                type="number"
                min={0}
                value={form.lowStockThreshold}
                onChange={(e) => setField('lowStockThreshold', e.target.value)}
              />
              <p className="text-sm text-slate-500 sm:col-span-2">
                Products with stock at or below this level appear in low-stock alerts on the dashboard.
              </p>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => settings && setForm({
                companyName: settings.companyName || '',
                email: settings.email || '',
                phone: settings.phone || '',
                address: settings.address || '',
                companyLogo: settings.companyLogo || '',
                currency: settings.currency || 'USD',
                currencySymbol: settings.currencySymbol || '$',
                taxRate: String(Number(settings.taxRate) || 0),
                taxEnabled: settings.taxEnabled,
                invoicePrefix: settings.invoicePrefix || 'MP',
                invoiceFooter: settings.invoiceFooter || '',
                lowStockThreshold: String(settings.lowStockThreshold ?? 5),
              })}
            >
              Reset
            </Button>
            <Button type="submit" variant="gold" loading={mutation.isPending}>
              Save Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
