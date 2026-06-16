import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { catalogApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Supplier, Customer } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';

export function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => catalogApi.getSuppliers({ page, limit: 15, search }),
  });

  const mutation = useMutation({
    mutationFn: (payload: { id?: string; data: unknown }) =>
      payload.id ? catalogApi.updateSupplier(payload.id, payload.data) : catalogApi.createSupplier(payload.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setShowModal(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: catalogApi.deleteSupplier,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteId(null); },
  });

  const suppliers = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      id: editing?.id,
      data: {
        name: form.get('name'),
        companyName: form.get('companyName'),
        phone: form.get('phone'),
        email: form.get('email'),
        address: form.get('address'),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Suppliers</h1>
          <p className="text-slate-500">Manage your perfume suppliers</p>
        </div>
        <Button variant="gold" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Supplier
        </Button>
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="luxury-input pl-10" placeholder="Search suppliers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {suppliers.map((s: Supplier) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.companyName || '-'}</TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                    <TableCell>{s.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(s); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Supplier' : 'Add Supplier'}
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gold" loading={mutation.isPending} onClick={() => document.getElementById('supplier-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>{editing ? 'Update' : 'Create'}</Button></>}>
        <form id="supplier-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Input label="Company Name" name="companyName" defaultValue={editing?.companyName} />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <div className="sm:col-span-2"><Input label="Address" name="address" defaultValue={editing?.address} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Delete Supplier" message="Are you sure?" loading={deleteMutation.isPending} />
    </div>
  );
}

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => catalogApi.getCustomers({ page, limit: 15, search }),
  });

  const mutation = useMutation({
    mutationFn: (payload: { id?: string; data: unknown }) =>
      payload.id ? catalogApi.updateCustomer(payload.id, payload.data) : catalogApi.createCustomer(payload.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowModal(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: catalogApi.deleteCustomer,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setDeleteId(null); },
  });

  const customers = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      id: editing?.id,
      data: {
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        address: form.get('address'),
        isVip: form.get('isVip') === 'true',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Customers</h1>
          <p className="text-slate-500">Manage customer relationships</p>
        </div>
        <Button variant="gold" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="luxury-input pl-10" placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Loyalty</TableHead>
                <TableHead>VIP</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {customers.map((c: Customer) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(c.totalSpent))}</TableCell>
                    <TableCell>{c.loyaltyPoints} pts</TableCell>
                    <TableCell>{c.isVip ? <Badge variant="gold">VIP</Badge> : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(c); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="gold" loading={mutation.isPending} onClick={() => document.getElementById('customer-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>{editing ? 'Update' : 'Create'}</Button></>}>
        <form id="customer-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" name="name" defaultValue={editing?.name} required />
          <Input label="Phone" name="phone" defaultValue={editing?.phone} />
          <Input label="Email" name="email" type="email" defaultValue={editing?.email} />
          <select name="isVip" className="luxury-input" defaultValue={editing?.isVip ? 'true' : 'false'}>
            <option value="false">Regular</option>
            <option value="true">VIP</option>
          </select>
          <div className="sm:col-span-2"><Input label="Address" name="address" defaultValue={editing?.address} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Delete Customer" message="Are you sure?" loading={deleteMutation.isPending} />
    </div>
  );
}
