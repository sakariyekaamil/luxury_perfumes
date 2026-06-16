import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-red-500 text-4xl">⚠</div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Something went wrong</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm text-gold hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
