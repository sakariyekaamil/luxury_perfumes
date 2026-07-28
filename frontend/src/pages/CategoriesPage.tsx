import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { catalogApi } from '@/lib/api';
import { toast, getErrorMessage } from '@/lib/toast';
import { hasPermission, type Resource } from '@/lib/permissions';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';

interface SimpleCrudPageProps {
  title: string;
  description: string;
  queryKey: string;
  resource: Resource;
  getAll: () => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
}

export function SimpleCrudPage({ title, description, queryKey, resource, getAll, create, update, delete: deleteFn }: SimpleCrudPageProps) {
  const { user } = useAuthStore();
  const canCreate = hasPermission(user?.role, resource, 'create');
  const canUpdate = hasPermission(user?.role, resource, 'update');
  const canDelete = hasPermission(user?.role, resource, 'delete');
  const canWrite = canCreate || canUpdate;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: [queryKey], queryFn: getAll });
  const items = (data as { data?: { data?: Array<{ id: string; name: string; description?: string }> } })?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (payload: { id?: string; data: unknown }) =>
      payload.id ? update(payload.id, payload.data) : create(payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setShowModal(false);
      setEditing(null);
      toast.success(editing ? 'Saved successfully' : 'Created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to save')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteId(null);
      toast.success('Deleted successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      id: editing?.id,
      data: { name: form.get('name'), description: form.get('description') },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">{title}</h1>
          <p className="text-slate-500">{description}</p>
        </div>
        {canCreate && (
          <Button variant="gold" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <Table>
            <TableHeader>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              {(canUpdate || canDelete) && <TableHead>Actions</TableHead>}
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-slate-500">{item.description || '-'}</TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell>
                      <div className="flex gap-1">
                        {canUpdate && (
                          <button onClick={() => { setEditing(item); setShowModal(true); }} className="p-1.5 rounded hover:bg-slate-100">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {canWrite && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditing(null); }}
          title={editing ? `Edit ${title}` : `Add ${title}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="gold" loading={mutation.isPending} onClick={() => document.getElementById('crud-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form id="crud-form" onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" name="name" defaultValue={editing?.name} required />
            <Input label="Description" name="description" defaultValue={editing?.description} />
          </form>
        </Modal>
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          title="Confirm Delete"
          message="Are you sure you want to delete this item?"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

export function CategoriesPage() {
  return (
    <SimpleCrudPage
      title="Categories"
      description="Manage product categories"
      queryKey="categories"
      resource="categories"
      getAll={catalogApi.getCategories}
      create={catalogApi.createCategory}
      update={catalogApi.updateCategory}
      delete={catalogApi.deleteCategory}
    />
  );
}

export function BrandsPage() {
  return (
    <SimpleCrudPage
      title="Brands"
      description="Manage perfume brands"
      queryKey="brands"
      resource="brands"
      getAll={catalogApi.getBrands}
      create={catalogApi.createBrand}
      update={catalogApi.updateBrand}
      delete={catalogApi.deleteBrand}
    />
  );
}
