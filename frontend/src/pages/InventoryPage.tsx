import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi, productApi, adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast, getErrorMessage } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'stock-in' | 'stock-out' | 'adjust'>('stock-in');
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['inventory-transactions', page],
    queryFn: () => operationsApi.getInventoryTransactions({ page, limit: 15 }),
  });

  const { data: valuation } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: () => operationsApi.getInventoryValuation(),
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productApi.getAll({ limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: (data: { action: string; payload: unknown }) => {
      if (data.action === 'stock-in') return operationsApi.stockIn(data.payload);
      if (data.action === 'stock-out') return operationsApi.stockOut(data.payload);
      return operationsApi.adjustStock(data.payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      toast.success('Inventory updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update inventory')),
  });

  const txns = transactions?.data?.data || [];
  const meta = transactions?.data?.meta;
  const summary = valuation?.data?.data?.summary;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const productId = form.get('productId') as string;
    if (action === 'adjust') {
      mutation.mutate({ action, payload: { productId, newQuantity: Number(form.get('quantity')), notes: form.get('notes') } });
    } else {
      mutation.mutate({ action, payload: { productId, quantity: Number(form.get('quantity')), notes: form.get('notes') } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Inventory</h1>
          <p className="text-slate-500">Stock management and valuation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setAction('stock-in'); setShowModal(true); }}>Stock In</Button>
          <Button variant="outline" onClick={() => { setAction('stock-out'); setShowModal(true); }}>Stock Out</Button>
          <Button variant="gold" onClick={() => { setAction('adjust'); setShowModal(true); }}>Adjust</Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Products" value={summary.totalProducts} />
          <StatCard title="Total Units" value={summary.totalUnits} />
          <StatCard title="Cost Value" value={formatCurrency(summary.totalCostValue)} />
          <StatCard title="Retail Value" value={formatCurrency(summary.totalRetailValue)} />
        </div>
      )}

      <Card title="Inventory Transactions">
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New Stock</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
              </TableHeader>
              <TableBody>
                {txns.map((txn: { id: string; type: string; quantity: number; previousStock: number; newStock: number; createdAt: string; product?: { name: string }; user?: { firstName: string; lastName: string } }) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{txn.product?.name}</TableCell>
                    <TableCell><StatusBadge status={txn.type} /></TableCell>
                    <TableCell>{txn.quantity}</TableCell>
                    <TableCell>{txn.previousStock}</TableCell>
                    <TableCell className="font-semibold">{txn.newStock}</TableCell>
                    <TableCell>{txn.user ? `${txn.user.firstName} ${txn.user.lastName}` : '-'}</TableCell>
                    <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={action === 'stock-in' ? 'Stock In' : action === 'stock-out' ? 'Stock Out' : 'Adjust Stock'}
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gold" loading={mutation.isPending} onClick={() => document.getElementById('inventory-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>Confirm</Button></>}>
        <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
          <Select label="Product" name="productId" required
            options={[{ value: '', label: 'Select product' }, ...((products?.data?.data || []).map((p: { id: string; name: string }) => ({ value: p.id, label: p.name })))]} />
          <input className="luxury-input" name="quantity" type="number" placeholder={action === 'adjust' ? 'New Quantity' : 'Quantity'} required />
          <input className="luxury-input" name="notes" placeholder="Notes (optional)" />
        </form>
      </Modal>
    </div>
  );
}

export function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => adminApi.getExpenses({ page, limit: 15 }),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      toast.success('Expense recorded successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to record expense')),
  });

  const expenses = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      category: form.get('category'),
      amount: Number(form.get('amount')),
      description: form.get('description'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Expenses</h1>
          <p className="text-slate-500">Track business expenses</p>
        </div>
        <Button variant="gold" onClick={() => setShowModal(true)}>Add Expense</Button>
      </div>
      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>By</TableHead>
              </TableHeader>
              <TableBody>
                {expenses.map((e: { id: string; category: string; description: string; amount: number; date: string; user?: { firstName: string; lastName: string } }) => (
                  <TableRow key={e.id}>
                    <TableCell><StatusBadge status={e.category} /></TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(e.amount))}</TableCell>
                    <TableCell>{formatDateTime(e.date)}</TableCell>
                    <TableCell>{e.user ? `${e.user.firstName} ${e.user.lastName}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gold" loading={createMutation.isPending} onClick={() => document.getElementById('expense-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>Create</Button></>}>
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
          <Select label="Category" name="category" required
            options={['RENT', 'SALARIES', 'UTILITIES', 'MARKETING', 'OTHER'].map((c) => ({ value: c, label: c }))} />
          <input className="luxury-input" name="amount" type="number" step="0.01" placeholder="Amount" required />
          <input className="luxury-input" name="description" placeholder="Description" required />
        </form>
      </Modal>
    </div>
  );
}
