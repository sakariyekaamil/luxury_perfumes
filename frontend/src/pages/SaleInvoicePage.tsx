import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { operationsApi, adminApi } from '@/lib/api';
import { SaleInvoice } from '@/components/sales/SaleInvoice';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import type { Sale, CompanySettings } from '@/types';

export function SaleInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';

  const { data: saleData, isLoading: saleLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => operationsApi.getSale(id!),
    enabled: !!id,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const sale = saleData?.data?.data as Sale | undefined;
  const settings = settingsData?.data?.data as CompanySettings | undefined;

  useEffect(() => {
    if (autoPrint && sale && settings) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, sale, settings]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      const response = await operationsApi.getSaleInvoicePdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${sale?.saleNumber || id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/sales/${id}/invoice?print=1`, '_blank');
    }
  };

  if (saleLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sale || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button variant="gold" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf}>
          <Download className="w-4 h-4 mr-1" /> Download PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <SaleInvoice sale={sale} settings={settings} />
      </div>
    </div>
  );
}
