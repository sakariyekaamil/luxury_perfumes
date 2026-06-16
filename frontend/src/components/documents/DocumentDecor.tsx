export function DocumentDecor({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-primary-900" />
      <div className="w-8 h-8 rounded-full bg-gold/80" />
      <div className="w-6 h-12 rounded-t-full bg-primary-700" />
      <div className="w-5 h-5 bg-gold rounded-sm" />
      <div className="w-8 h-8 rounded-full border-2 border-primary-900" />
      <div className="w-4 h-10 bg-primary-800 rounded-sm" />
    </div>
  );
}
