import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gold: 'bg-gold/10 text-gold-700 dark:text-gold',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    INACTIVE: { variant: 'default', label: 'Inactive' },
    DISCONTINUED: { variant: 'danger', label: 'Discontinued' },
    DRAFT: { variant: 'default', label: 'Draft' },
    PENDING: { variant: 'warning', label: 'Pending' },
    APPROVED: { variant: 'success', label: 'Approved' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
    RETURNED: { variant: 'warning', label: 'Returned' },
    PAID: { variant: 'success', label: 'Paid' },
    PARTIAL: { variant: 'warning', label: 'Partial' },
    REFUNDED: { variant: 'info', label: 'Refunded' },
  };

  const config = statusMap[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
