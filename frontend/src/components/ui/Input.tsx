import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="luxury-label">{label}</label>}
      <input
        id={id}
        className={cn('luxury-input', error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ className, label, error, id, options, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="luxury-label">{label}</label>}
      <select
        id={id}
        className={cn('luxury-input', error && 'border-red-500', className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="luxury-label">{label}</label>}
      <textarea
        id={id}
        className={cn('luxury-input min-h-[80px]', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
