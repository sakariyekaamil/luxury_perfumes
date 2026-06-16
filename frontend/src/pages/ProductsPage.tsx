import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { productApi, catalogApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/Loading';

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, brandFilter],
    queryFn: () => productApi.getAll({ page, limit: 15, search, categoryId: categoryFilter, brandId: brandFilter }),
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => catalogApi.getCategories() });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => catalogApi.getBrands() });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => editingProduct ? productApi.update(editingProduct.id, data) : productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
  });

  const products = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      name: form.get('name'),
      sku: form.get('sku'),
      barcode: form.get('barcode') || undefined,
      brandId: form.get('brandId'),
      categoryId: form.get('categoryId'),
      costPrice: Number(form.get('costPrice')),
      sellingPrice: Number(form.get('sellingPrice')),
      stockQuantity: Number(form.get('stockQuantity')),
      minimumStock: Number(form.get('minimumStock')),
      description: form.get('description'),
      status: form.get('status'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Products</h1>
          <p className="text-slate-500">Manage your perfume inventory</p>
        </div>
        <Button variant="gold" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="luxury-input pl-10"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="luxury-input w-full sm:w-40" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories?.data?.data?.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="luxury-input w-full sm:w-40" value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}>
            <option value="">All Brands</option>
            {brands?.data?.data?.map((b: { id: string; name: string }) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? <LoadingSpinner /> : products.length === 0 ? (
          <EmptyState icon={<Package className="h-12 w-12" />} title="No products found" description="Add your first perfume product" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-slate-500">{product.sku}</TableCell>
                    <TableCell>{product.brand?.name}</TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell>{formatCurrency(Number(product.costPrice))}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(product.sellingPrice))}</TableCell>
                    <TableCell>
                      <span className={product.stockQuantity <= product.minimumStock ? 'text-red-500 font-semibold' : ''}>
                        {product.stockQuantity}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={product.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-primary-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(product.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="gold" loading={createMutation.isPending} onClick={() => document.getElementById('product-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Product Name" name="name" defaultValue={editingProduct?.name} required />
          <Input label="SKU" name="sku" defaultValue={editingProduct?.sku} required />
          <Input label="Barcode" name="barcode" defaultValue={editingProduct?.barcode} />
          <Select label="Brand" name="brandId" defaultValue={editingProduct?.brandId || ''} required
            options={[{ value: '', label: 'Select brand' }, ...((brands?.data?.data || []).map((b: { id: string; name: string }) => ({ value: b.id, label: b.name })))]} />
          <Select label="Category" name="categoryId" defaultValue={editingProduct?.categoryId || ''} required
            options={[{ value: '', label: 'Select category' }, ...((categories?.data?.data || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))]} />
          <Input label="Cost Price" name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice} required />
          <Input label="Selling Price" name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice} required />
          <Input label="Stock Quantity" name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity || 0} />
          <Input label="Minimum Stock" name="minimumStock" type="number" defaultValue={editingProduct?.minimumStock || 5} />
          <Select label="Status" name="status" defaultValue={editingProduct?.status || 'ACTIVE'}
            options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'DISCONTINUED', label: 'Discontinued' }]} />
          <div className="sm:col-span-2">
            <Input label="Description" name="description" defaultValue={editingProduct?.description} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
