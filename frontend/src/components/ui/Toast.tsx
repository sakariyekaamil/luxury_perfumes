import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastItem, type ToastType } from '@/store/toast';

const styles: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
  },
};

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(onClose, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm toast-enter',
        style.container
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
        <p className={cn('text-sm', toast.title && 'mt-0.5 opacity-90')}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1 opacity-70 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:top-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
      ))}
    </div>
  );
}
