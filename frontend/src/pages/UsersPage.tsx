import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast, getErrorMessage } from '@/lib/toast';
import {
  canManageTargetUser,
  canManageUsers,
  formatRoleLabel,
  getAssignableRoles,
  isSuperAdmin,
} from '@/lib/roles';
import { useAuthStore } from '@/store';
import type { User, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const canManage = canManageUsers(currentUser?.role);
  const assignableRoles = getAssignableRoles(currentUser?.role);
  const roleOptions = assignableRoles.map((role) => ({
    value: role,
    label: formatRoleLabel(role),
  }));

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 15, search }),
  });

  const mutation = useMutation({
    mutationFn: (payload: { id?: string; data: Record<string, unknown> }) =>
      payload.id ? adminApi.updateUser(payload.id, payload.data) : adminApi.createUser(payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditing(null);
      toast.success(editing ? 'User updated successfully' : 'User created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to save user')),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      toast.success('User deleted successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete user')),
  });

  const users: User[] = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManage) return;

    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      firstName: String(form.get('firstName') || '').trim(),
      lastName: String(form.get('lastName') || '').trim(),
    };
    const phone = String(form.get('phone') || '').trim();
    if (phone) payload.phone = phone;

    if (!editing) {
      payload.email = String(form.get('email') || '').trim().toLowerCase();
      const role = String(form.get('role') || '') as UserRole;
      if (!assignableRoles.includes(role)) {
        toast.error('Please select a valid role');
        return;
      }
      payload.role = role;
    } else if (editing.id !== currentUser?.id && canManageTargetUser(currentUser?.role, editing.role)) {
      const role = String(form.get('role') || '') as UserRole;
      if (assignableRoles.includes(role)) {
        payload.role = role;
      }
      payload.isActive = form.get('isActive') === 'true';
    }

    const password = String(form.get('password') || '');
    if (!editing) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      payload.password = password;
    } else if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      payload.password = password;
    }

    mutation.mutate({ id: editing?.id, data: payload });
  };

  const openCreate = () => {
    if (!canManage) return;
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    if (!canManage) return;
    const isSelf = user.id === currentUser?.id;
    if (!isSelf && !canManageTargetUser(currentUser?.role, user.role)) {
      toast.error('You cannot manage this user');
      return;
    }
    setEditing(user);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Users</h1>
          <p className="text-slate-500">
            {canManage
              ? 'Create and manage staff accounts and roles'
              : 'View staff accounts (read-only)'}
          </p>
        </div>
        {canManage && (
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        )}
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="luxury-input pl-10"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                {canManage && <TableHead>Actions</TableHead>}
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const canEditRow = isSelf || canManageTargetUser(currentUser?.role, u.role);
                  const canDeleteRow = !isSelf && canManageTargetUser(currentUser?.role, u.role);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.firstName} {u.lastName}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{formatRoleLabel(u.role)}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              disabled={!canEditRow}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed"
                              title={canEditRow ? 'Edit' : 'Cannot edit this user'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(u.id)}
                              disabled={!canDeleteRow}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              title={
                                isSelf
                                  ? 'Cannot delete yourself'
                                  : !canDeleteRow
                                    ? 'Cannot delete this user'
                                    : 'Delete'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
          </>
        )}
      </Card>

      {canManage && (
        <>
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditing(null);
            }}
            title={editing ? 'Edit User' : 'Add User'}
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="gold"
                  loading={mutation.isPending}
                  onClick={() =>
                    document.getElementById('user-form')?.dispatchEvent(new Event('submit', { bubbles: true }))
                  }
                >
                  {editing ? 'Update' : 'Create'}
                </Button>
              </>
            }
          >
            <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" name="firstName" defaultValue={editing?.firstName} required />
              <Input label="Last Name" name="lastName" defaultValue={editing?.lastName} required />
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={editing?.email}
                required={!editing}
                disabled={!!editing}
              />
              <Input label="Phone" name="phone" defaultValue={editing?.phone} />
              <Input
                label={editing ? 'New Password (optional)' : 'Password'}
                name="password"
                type="password"
                required={!editing}
                autoComplete="new-password"
              />
              {editing && isSuperAdmin(editing.role) ? (
                <div className="w-full">
                  <label className="luxury-label">Role</label>
                  <p className="luxury-input bg-slate-50 dark:bg-primary-900/50 text-slate-600 dark:text-slate-300">
                    Super Admin
                  </p>
                </div>
              ) : (
                <Select
                  label="Role"
                  name="role"
                  options={roleOptions}
                  defaultValue={
                    editing?.role && assignableRoles.includes(editing.role)
                      ? editing.role
                      : roleOptions[0]?.value || 'CASHIER'
                  }
                  disabled={editing?.id === currentUser?.id}
                  required
                />
              )}
              {editing && (
                <Select
                  label="Status"
                  name="isActive"
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                  defaultValue={editing.isActive ? 'true' : 'false'}
                  disabled={editing.id === currentUser?.id || isSuperAdmin(editing.role)}
                />
              )}
            </form>
          </Modal>

          <ConfirmDialog
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
            title="Delete User"
            message="This will deactivate and soft-delete the user. Continue?"
            loading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
