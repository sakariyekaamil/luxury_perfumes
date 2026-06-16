import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileText, Printer, Download } from 'lucide-react';
import { operationsApi, catalogApi, productApi, adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Sale, Purchase, Product, Customer, CompanySettings } from '@/types';
import { SaleInvoice } from '@/components/sales/SaleInvoice';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Select, Input, Textarea } from '@/components/ui/Input';

interface SaleLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'EVC_PLUS', label: 'EVC Plus' },
  { value: 'ZAAD', label: 'Zaad' },
  { value: 'EDAHAB', label: 'Edahab' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const emptyLine = (): SaleLineItem => ({ productId: '', quantity: 1, unitPrice: 0 });

export function SalesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([emptyLine()]);
  const [error, setError] = useState('');
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page],
    queryFn: () => operationsApi.getSales({ page, limit: 15 }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => catalogApi.getCustomers({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productApi.getAll({ limit: 100, status: 'ACTIVE' }),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => operationsApi.completeSale(id, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: operationsApi.cancelSale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const validItems = lineItems.filter((item) => item.productId && item.quantity > 0);
      if (validItems.length === 0) throw new Error('Add at least one product');

      const subtotal = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const settings = settingsData?.data?.data;
      const taxRate = settings?.taxEnabled ? Number(settings.taxRate || 0) : 0;
      const tax = subtotal * (taxRate / 100);

      const saleRes = await operationsApi.createSale({
        customerId: customerId || undefined,
        notes: notes || undefined,
        discount,
        tax,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      const sale = saleRes.data?.data;
      if (!sale?.id) throw new Error('Failed to create sale');

      await operationsApi.completeSale(sale.id, { paymentMethod });
      const fullSale = await operationsApi.getSale(sale.id);
      return fullSale.data?.data as Sale;
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      resetForm();
      setShowModal(false);
      if (sale) setInvoiceSale(sale);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to create sale');
    },
  });

  const sales = data?.data?.data || [];
  const meta = data?.data?.meta;
  const customers: Customer[] = customersData?.data?.data || [];
  const products: Product[] = productsData?.data?.data || [];
  const settings = settingsData?.data?.data as CompanySettings | undefined;

  const openInvoice = async (saleId: string) => {
    const res = await operationsApi.getSale(saleId);
    const sale = res.data?.data as Sale;
    if (sale) setInvoiceSale(sale);
  };

  const handlePrintInvoice = (saleId: string) => {
    window.open(`/sales/${saleId}/invoice?print=1`, '_blank');
  };

  const handleDownloadPdf = async (saleId: string, saleNumber?: string) => {
    try {
      const response = await operationsApi.getSaleInvoicePdf(saleId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${saleNumber || saleId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      handlePrintInvoice(saleId);
    }
  };

  const subtotal = lineItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    return sum + item.quantity * item.unitPrice;
  }, 0);
  const taxRate = settings?.taxEnabled ? Number(settings.taxRate || 0) : 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal - discount + tax;

  const resetForm = () => {
    setCustomerId('');
    setPaymentMethod('CASH');
    setDiscount(0);
    setNotes('');
    setLineItems([emptyLine()]);
    setError('');
  };

  const updateLineItem = (index: number, field: keyof SaleLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        if (product) item.unitPrice = Number(product.sellingPrice);
      }
      next[index] = item;
      return next;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLine()]);

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const productOptions = [
    { value: '', label: 'Select product' },
    ...products.map((p) => ({
      value: p.id,
      label: `${p.name} — ${formatCurrency(Number(p.sellingPrice))} (${p.stockQuantity} in stock)`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Sales</h1>
          <p className="text-slate-500">View and manage sales transactions</p>
        </div>
        <Button variant="gold" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          Create Sale
        </Button>
      </div>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                      No sales yet — click Create Sale to add one
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                      <TableCell><StatusBadge status={sale.status} /></TableCell>
                      <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                      <TableCell>{sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {sale.status === 'COMPLETED' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openInvoice(sale.id)}>
                                <FileText className="w-3 h-3 mr-1" /> Invoice
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(sale.id)}>
                                <Printer className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {sale.status === 'DRAFT' && (
                            <>
                              <Button
                                size="sm"
                                variant="gold"
                                loading={completeMutation.isPending}
                                onClick={() => completeMutation.mutate(sale.id)}
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                loading={cancelMutation.isPending}
                                onClick={() => cancelMutation.mutate(sale.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Sale"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="gold" loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Complete Sale
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Customer (optional)"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={[
                { value: '', label: 'Walk-in customer' },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={PAYMENT_METHODS}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="luxury-label">Products</p>
              <Button size="sm" variant="outline" onClick={addLineItem}>
                <Plus className="w-3 h-3 mr-1" /> Add item
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-5">
                  <Select
                    label={index === 0 ? 'Product' : undefined}
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                    options={productOptions}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    label={index === 0 ? 'Qty' : undefined}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <Input
                    label={index === 0 ? 'Unit Price' : undefined}
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 flex items-end gap-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 pb-2">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </p>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tax ({taxRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total</span>
              <span className="text-gold-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!invoiceSale && !!settings}
        onClose={() => setInvoiceSale(null)}
        title="Sales Invoice"
        size="lg"
        footer={
          invoiceSale ? (
            <>
              <Button variant="outline" onClick={() => setInvoiceSale(null)}>Close</Button>
              <Button variant="outline" onClick={() => handleDownloadPdf(invoiceSale.id, invoiceSale.saleNumber)}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
              <Button variant="gold" onClick={() => handlePrintInvoice(invoiceSale.id)}>
                <Printer className="w-4 h-4 mr-1" /> Print
              </Button>
            </>
          ) : undefined
        }
      >
        {invoiceSale && settings && (
          <SaleInvoice sale={invoiceSale} settings={settings} />
        )}
      </Modal>
    </div>
  );
}

export function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: () => operationsApi.getPurchases({ page, limit: 15 }),
  });

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: () => catalogApi.getSuppliers({ limit: 100 }) });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productApi.getAll({ limit: 100 }) });

  const approveMutation = useMutation({
    mutationFn: operationsApi.approvePurchase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });

  const createMutation = useMutation({
    mutationFn: operationsApi.createPurchase,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); setShowModal(false); },
  });

  const purchases = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      supplierId: form.get('supplierId'),
      notes: form.get('notes'),
      items: [{ productId: form.get('productId'), quantity: Number(form.get('quantity')), unitCost: Number(form.get('unitCost')) }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Purchases</h1>
          <p className="text-slate-500">Manage purchase orders</p>
        </div>
        <Button variant="gold" onClick={() => setShowModal(true)}>Create Purchase</Button>
      </div>
      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase: Purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                    <TableCell>{purchase.supplier?.name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(purchase.totalAmount))}</TableCell>
                    <TableCell><StatusBadge status={purchase.status} /></TableCell>
                    <TableCell>{formatDateTime(purchase.createdAt)}</TableCell>
                    <TableCell>
                      {purchase.status === 'DRAFT' && (
                        <Button size="sm" variant="gold" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(purchase.id)}>
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gold" loading={createMutation.isPending} onClick={() => document.getElementById('purchase-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>Create</Button></>}>
        <form id="purchase-form" onSubmit={handleCreate} className="space-y-4">
          <Select label="Supplier" name="supplierId" required
            options={[{ value: '', label: 'Select supplier' }, ...((suppliers?.data?.data || []).map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })))]} />
          <Select label="Product" name="productId" required
            options={[{ value: '', label: 'Select product' }, ...((products?.data?.data || []).map((p: { id: string; name: string }) => ({ value: p.id, label: p.name })))]} />
          <div className="grid grid-cols-2 gap-4">
            <input className="luxury-input" name="quantity" type="number" placeholder="Quantity" required />
            <input className="luxury-input" name="unitCost" type="number" step="0.01" placeholder="Unit Cost" required />
          </div>
          <input className="luxury-input" name="notes" placeholder="Notes" />
        </form>
      </Modal>
    </div>
  );
}
