import type { Sale, CompanySettings } from '@/types';
import { formatCurrency, formatDate, resolveMediaUrl } from '@/lib/utils';

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  EVC_PLUS: 'EVC Plus',
  ZAAD: 'Zaad',
  EDAHAB: 'Edahab',
  BANK_TRANSFER: 'Bank Transfer',
};

const ALL_PAYMENT_METHODS = ['Cash', 'EVC Plus', 'Zaad', 'Edahab', 'Bank Transfer'];

function InvoiceDecor({ className = '' }: { className?: string }) {
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

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-600">
      <span className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0" />
      <span>{children}</span>
    </div>
  );
}

interface SaleInvoiceProps {
  sale: Sale;
  settings: CompanySettings;
  className?: string;
}

export function SaleInvoice({ sale, settings, className = '' }: SaleInvoiceProps) {
  const symbol = settings.currencySymbol || '$';
  const payment = sale.payments?.[0];
  const invoiceNumber = `${settings.invoicePrefix || 'MP'}-${sale.saleNumber.replace(/^SL-/, '')}`;
  const invoiceDate = formatDate(sale.completedAt || sale.createdAt);
  const cashierName = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Staff';
  const termsText = settings.invoiceFooter || 'Payment is due upon receipt. All perfume products are subject to our return policy. Thank you for choosing Luxury Perfumes.';

  return (
    <div className={`invoice-print-area bg-white text-primary-900 ${className}`}>
      <div className="overflow-hidden shadow-sm border border-slate-100">

        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {settings.companyLogo ? (
                <img src={resolveMediaUrl(settings.companyLogo)} alt={settings.companyName} className="h-14 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-900 flex items-center justify-center">
                    <span className="text-gold font-bold text-lg font-display">LP</span>
                  </div>
                  <div>
                    <p className="text-xs text-gold font-semibold uppercase tracking-widest">Luxury</p>
                    <p className="text-sm font-bold text-primary-900">{settings.companyName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-stretch">
              <div className="bg-primary-900 text-white px-10 py-5 rounded-bl-[2rem] flex items-center">
                <span className="text-3xl font-bold tracking-wide">INVOICE:</span>
              </div>
              <InvoiceDecor className="pl-2 pb-1" />
            </div>
          </div>
        </div>

        {/* Invoice To + Meta */}
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-bold text-gold mb-3">INVOICE TO:</p>
            <p className="text-xl font-bold text-primary-900 mb-3">
              {sale.customer?.name || 'Walk-in Customer'}
            </p>
            <div className="space-y-1.5">
              {sale.customer?.address && <BulletItem>{sale.customer.address}</BulletItem>}
              {!sale.customer?.address && settings.address && <BulletItem>{settings.address}</BulletItem>}
              {sale.customer?.phone && <BulletItem>{sale.customer.phone}</BulletItem>}
              {sale.customer?.email && <BulletItem>{sale.customer.email}</BulletItem>}
              {!sale.customer && <BulletItem>Retail customer — no account on file</BulletItem>}
            </div>
          </div>

          <div className="md:text-right space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Invoice No: </span>
              <span className="font-bold text-primary-900">{invoiceNumber}</span>
            </p>
            <p>
              <span className="text-slate-500">Invoice Date: </span>
              <span className="font-bold text-primary-900">{invoiceDate}</span>
            </p>
            <p>
              <span className="text-slate-500">Sale Ref: </span>
              <span className="font-bold text-primary-900">{sale.saleNumber}</span>
            </p>
            <p>
              <span className="text-slate-500">Status: </span>
              <span className="font-bold text-primary-900">{sale.status}</span>
            </p>
          </div>
        </div>

        {/* Sidebar + Table */}
        <div className="px-6 pb-4 flex flex-col lg:flex-row gap-4">
          {/* Left sidebar */}
          <div className="lg:w-52 shrink-0 bg-slate-100 rounded-2xl p-5 space-y-6">
            <div>
              <p className="text-xs font-bold text-primary-900 uppercase tracking-wider mb-3 border-b border-slate-300 pb-2">
                Payment Method
              </p>
              <div className="space-y-2">
                {ALL_PAYMENT_METHODS.map((method) => {
                  const isActive = payment && PAYMENT_LABELS[payment.method] === method;
                  return (
                    <p
                      key={method}
                      className={`text-sm ${isActive ? 'font-bold text-primary-900' : 'text-slate-500'}`}
                    >
                      {isActive ? '● ' : '○ '}{method}
                    </p>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-primary-900 uppercase tracking-wider mb-3 border-b border-slate-300 pb-2">
                Terms &amp; Conditions
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">{termsText}</p>
            </div>
          </div>

          {/* Products table */}
          <div className="flex-1 min-w-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y-2 border-primary-900">
                  <th className="py-3 text-left font-bold text-primary-900 uppercase text-xs tracking-wider">Product</th>
                  <th className="py-3 text-right font-bold text-primary-900 uppercase text-xs tracking-wider w-24">Price</th>
                  <th className="py-3 text-center font-bold text-primary-900 uppercase text-xs tracking-wider w-16">Qty</th>
                  <th className="py-3 text-right font-bold text-primary-900 uppercase text-xs tracking-wider w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-primary-900">{item.product?.name || 'Product'}</p>
                      {item.product?.brand && (
                        <p className="text-xs text-slate-400 mt-0.5">{item.product.brand.name} · {item.product?.sku}</p>
                      )}
                    </td>
                    <td className="py-4 text-right text-slate-600">
                      {formatCurrency(Number(item.unitPrice), symbol)}
                    </td>
                    <td className="py-4 text-center font-medium">{item.quantity}</td>
                    <td className="py-4 text-right font-semibold text-primary-900">
                      {formatCurrency(Number(item.total), symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals + Signature */}
            <div className="flex flex-col sm:flex-row justify-between gap-8 mt-8 px-2">
              <div className="text-center sm:text-left">
                <p className="font-bold text-primary-900 text-lg">{cashierName}</p>
                <div className="mt-2 mb-1 h-10 flex items-center">
                  <svg viewBox="0 0 200 40" className="w-36 h-8 text-gold" fill="none">
                    <path
                      d="M5 30 Q40 5, 80 25 T160 15 T195 28"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">Authorized Cashier</p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 uppercase text-xs font-semibold">Sub Total</span>
                  <span className="font-semibold">{formatCurrency(Number(sale.subtotal), symbol)}</span>
                </div>
                {Number(sale.discount) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 uppercase text-xs font-semibold">Discount</span>
                    <span className="font-semibold">-{formatCurrency(Number(sale.discount), symbol)}</span>
                  </div>
                )}
                {Number(sale.tax) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 uppercase text-xs font-semibold">
                      Tax{settings.taxEnabled ? ` (${settings.taxRate}%)` : ''}
                    </span>
                    <span className="font-semibold">{formatCurrency(Number(sale.tax), symbol)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-primary-900">
                  <span className="font-bold text-primary-900 uppercase">Total</span>
                  <span className="font-bold text-xl text-gold">{formatCurrency(Number(sale.totalAmount), symbol)}</span>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div className="mt-6 px-2">
                <p className="text-xs font-bold text-gold uppercase mb-1">Notes</p>
                <p className="text-sm text-slate-600">{sale.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-4 bg-primary-900 text-white overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-4 opacity-40">
            <div className="w-8 h-8 rounded-full bg-gold" />
            <div className="w-6 h-6 rounded-full bg-white/30" />
            <div className="w-10 h-10 rounded-t-full bg-gold/60" />
            <div className="w-5 h-5 bg-white/20 rounded-sm" />
          </div>
          <div className="relative z-10 py-5 px-8 text-center text-sm">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
              {settings.phone && <span>{settings.phone}</span>}
              {settings.email && <span>{settings.email}</span>}
              {settings.address && <span>{settings.address}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
