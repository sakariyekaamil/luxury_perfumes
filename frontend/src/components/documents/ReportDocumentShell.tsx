import { DocumentDecor } from './DocumentDecor';

interface ReportDocumentShellProps {
  companyName: string;
  phone?: string;
  email?: string;
  address?: string;
  periodLabel: string;
  dateRange?: string;
  reportRef?: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function ReportDocumentShell({
  companyName,
  phone,
  email,
  address,
  periodLabel,
  dateRange,
  reportRef,
  sidebar,
  children,
}: ReportDocumentShellProps) {
  const footerParts = [phone, email, address].filter(Boolean);

  return (
    <div className="bg-white text-primary-900 border border-slate-100 shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-900 flex items-center justify-center shrink-0">
              <span className="text-gold font-bold text-lg font-display">LP</span>
            </div>
            <div>
              <p className="text-xs text-gold font-semibold uppercase tracking-widest">Luxury</p>
              <p className="text-sm font-bold text-primary-900">{companyName}</p>
            </div>
          </div>
          <div className="flex items-stretch shrink-0">
            <div className="bg-primary-900 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-bl-[2rem] flex items-center">
              <span className="text-xl sm:text-3xl font-bold tracking-wide">REPORT:</span>
            </div>
            <DocumentDecor className="pl-1 sm:pl-2 pb-1 hidden sm:flex" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="px-6 sm:px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
        <div>
          <p className="text-sm font-bold text-gold mb-2">REPORT PERIOD:</p>
          <p className="text-xl font-bold text-primary-900">{periodLabel}</p>
          {dateRange && <p className="text-sm text-slate-500 mt-1">{dateRange}</p>}
        </div>
        <div className="md:text-right space-y-1 text-sm">
          {reportRef && (
            <p>
              <span className="text-slate-500">Report Ref: </span>
              <span className="font-bold text-primary-900">{reportRef}</span>
            </p>
          )}
          <p>
            <span className="text-slate-500">Generated: </span>
            <span className="font-bold text-primary-900">{new Date().toLocaleDateString('en-US')}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 pb-6 flex flex-col lg:flex-row gap-4">
        <div className="lg:w-56 shrink-0 bg-slate-100 rounded-2xl p-5 space-y-5">
          {sidebar}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {/* Footer */}
      {footerParts.length > 0 && (
        <div className="relative bg-primary-900 text-white overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-4 opacity-40">
            <div className="w-8 h-8 rounded-full bg-gold" />
            <div className="w-6 h-6 rounded-full bg-white/30" />
            <div className="w-10 h-10 rounded-t-full bg-gold/60" />
          </div>
          <div className="relative z-10 py-4 px-6 text-center text-sm">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              {footerParts.map((part) => <span key={part}>{part}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
