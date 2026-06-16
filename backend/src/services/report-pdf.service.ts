import PDFDocument from 'pdfkit';
import { ReportService } from './report.service';
import { SettingsService } from './settings.service';

const NAVY = '#0F172A';
const GOLD = '#D4AF37';
const SLATE = '#64748B';
const LIGHT = '#F1F5F9';

function formatMoney(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawDecor(doc: InstanceType<typeof PDFDocument>, x: number, y: number) {
  doc.circle(x, y + 8, 8).fill(NAVY);
  doc.circle(x + 22, y + 10, 6).fill(GOLD);
  doc.rect(x + 36, y, 8, 16).fill('#334155');
  doc.rect(x + 50, y + 6, 6, 6).fill(GOLD);
  doc.circle(x + 64, y + 10, 6).lineWidth(1.5).stroke(NAVY);
  doc.rect(x + 76, y + 2, 6, 14).fill('#1E293B');
}

function pdfBuffer(build: (doc: InstanceType<typeof PDFDocument>, margin: number, pageW: number) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];
    const pageW = doc.page.width - 100;

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    build(doc, 50, pageW);
    doc.end();
  });
}

function drawReportHeader(
  doc: InstanceType<typeof PDFDocument>,
  settings: { companyName: string; phone?: string | null; email?: string | null; address?: string | null },
  title: string,
  periodLabel: string,
  dateRange: string
) {
  const margin = 50;
  const invBlockX = doc.page.width - margin - 200;

  doc.roundedRect(margin, 45, 40, 40, 6).fill(NAVY);
  doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold').text('LP', margin + 11, 57);
  doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text(settings.companyName, margin + 50, 52);
  doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold').text('LUXURY', margin + 50, 64);

  doc.roundedRect(invBlockX, 40, 160, 50, 0).fill(NAVY);
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('REPORT:', invBlockX + 20, 55);
  drawDecor(doc, invBlockX + 168, 48);

  doc.fillColor(GOLD).fontSize(9).font('Helvetica-Bold').text('REPORT PERIOD:', margin, 120);
  doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold').text(periodLabel, margin, 136);
  doc.fillColor(SLATE).fontSize(9).font('Helvetica').text(dateRange, margin, 154);

  doc.fillColor(SLATE).fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-US')}`, invBlockX, 120);
  doc.fillColor(NAVY).font('Helvetica-Bold').text(title, invBlockX, 136, { width: 200, align: 'right' });

  doc.moveTo(margin, 175).lineTo(doc.page.width - margin, 175).stroke(NAVY);
}

function drawFooter(doc: InstanceType<typeof PDFDocument>, settings: { phone?: string | null; email?: string | null; address?: string | null }) {
  const footerY = doc.page.height - 55;
  const pageW = doc.page.width;
  doc.rect(0, footerY, pageW, 55).fill(NAVY);
  drawDecor(doc, pageW - 120, footerY + 10);
  const footerParts = [settings.phone, settings.email, settings.address].filter(Boolean).join('   |   ');
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text(footerParts, 50, footerY + 22, {
    width: pageW - 100,
    align: 'center',
  });
}

export class ReportPdfService {
  static async generateSummaryPdf(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const { startDate, endDate } = ReportService.getDateRange(period);
    const settings = await SettingsService.get();
    const symbol = settings.currencySymbol || '$';
    const salesReport = await ReportService.getSalesReport(startDate, endDate);
    const profit = await ReportService.getProfitReport(startDate, endDate);
    const periodLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

    return pdfBuffer((doc, margin, pageW) => {
      drawReportHeader(
        doc,
        settings,
        'Business Summary',
        `${periodLabels[period]} Report`,
        `${startDate} to ${endDate}`
      );

      let y = 195;
      doc.roundedRect(margin, y, 130, 200, 10).fill(LIGHT);
      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('SUMMARY', margin + 12, y + 14);
      doc.moveTo(margin + 12, y + 26).lineTo(margin + 118, y + 26).stroke('#CBD5E1');

      const sideRows: Array<[string, string]> = [
        ['Revenue', formatMoney(salesReport.summary.totalRevenue, symbol)],
        ['Sales', String(salesReport.summary.count)],
        ['Net Profit', formatMoney(profit.netProfit, symbol)],
        ['Margin', `${profit.margin.toFixed(1)}%`],
      ];
      let sy = y + 34;
      sideRows.forEach(([label, val]) => {
        doc.fillColor(SLATE).fontSize(8).font('Helvetica').text(label, margin + 12, sy);
        doc.fillColor(NAVY).font('Helvetica-Bold').text(val, margin + 12, sy + 10);
        doc.font('Helvetica');
        sy += 28;
      });

      const tableX = margin + 150;
      doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold');
      doc.text('CATEGORY', tableX, y + 10);
      doc.text('AMOUNT', tableX + pageW - 200, y + 10, { width: 80, align: 'right' });
      y += 28;
      doc.moveTo(tableX, y).lineTo(tableX + pageW - 150, y).stroke(NAVY);
      y += 12;

      const rows: Array<[string, string]> = [
        ['Revenue', formatMoney(profit.revenue, symbol)],
        ['Purchases', `-${formatMoney(profit.purchases, symbol)}`],
        ['Expenses', `-${formatMoney(profit.expenses, symbol)}`],
        ['Gross Profit', formatMoney(profit.grossProfit, symbol)],
        ['Net Profit', formatMoney(profit.netProfit, symbol)],
      ];

      doc.font('Helvetica').fontSize(9).fillColor(NAVY);
      rows.forEach(([label, value]) => {
        doc.text(label, tableX, y);
        doc.font('Helvetica-Bold').text(value, tableX + pageW - 200, y, { width: 80, align: 'right' });
        doc.font('Helvetica');
        y += 18;
      });

      y += 30;
      doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('SALES', tableX, y);
      y += 16;
      doc.fontSize(8).fillColor(SLATE);
      doc.text('Sale #', tableX, y);
      doc.text('Customer', tableX + 80, y);
      doc.text('Amount', tableX + pageW - 200, y, { width: 80, align: 'right' });
      y += 14;

      doc.font('Helvetica').fontSize(8).fillColor(NAVY);
      for (const sale of salesReport.sales.slice(0, 20)) {
        if (y > 680) break;
        doc.text(sale.saleNumber, tableX, y);
        doc.text(sale.customer?.name || 'Walk-in', tableX + 80, y, { width: 100 });
        doc.text(formatMoney(Number(sale.totalAmount), symbol), tableX + pageW - 200, y, { width: 80, align: 'right' });
        y += 14;
      }

      drawFooter(doc, settings);
    });
  }

  static async generateSalesPdf(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const { startDate, endDate } = ReportService.getDateRange(period);
    const settings = await SettingsService.get();
    const symbol = settings.currencySymbol || '$';
    const salesReport = await ReportService.getSalesReport(startDate, endDate);
    const periodLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

    return pdfBuffer((doc, margin, pageW) => {
      drawReportHeader(
        doc,
        settings,
        'Sales Report',
        `${periodLabels[period]} Report`,
        `${startDate} to ${endDate}`
      );

      let y = 195;
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold');
      doc.text('SALE #', margin, y);
      doc.text('CUSTOMER', margin + 80, y);
      doc.text('CASHIER', margin + 180, y);
      doc.text('AMOUNT', margin + pageW - 80, y, { width: 80, align: 'right' });
      y += 14;
      doc.moveTo(margin, y).lineTo(margin + pageW, y).stroke(NAVY);
      y += 10;

      doc.font('Helvetica').fontSize(9).fillColor(NAVY);
      for (const sale of salesReport.sales) {
        if (y > 680) {
          doc.addPage();
          y = 50;
        }
        const cashier = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : '-';
        doc.text(sale.saleNumber, margin, y);
        doc.text(sale.customer?.name || 'Walk-in', margin + 80, y, { width: 95 });
        doc.text(cashier, margin + 180, y, { width: 95 });
        doc.font('Helvetica-Bold').text(formatMoney(Number(sale.totalAmount), symbol), margin + pageW - 80, y, { width: 80, align: 'right' });
        doc.font('Helvetica');
        y += 16;
      }

      y += 8;
      doc.moveTo(margin, y).lineTo(margin + pageW, y).stroke(NAVY);
      y += 10;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD);
      doc.text('TOTAL', margin, y);
      doc.text(formatMoney(salesReport.summary.totalRevenue, symbol), margin + pageW - 80, y, { width: 80, align: 'right' });

      drawFooter(doc, settings);
    });
  }

  static async generateInventoryPdf() {
    const settings = await SettingsService.get();
    const symbol = settings.currencySymbol || '$';
    const report = await ReportService.getInventoryReport();

    return pdfBuffer((doc, margin, pageW) => {
      drawReportHeader(
        doc,
        settings,
        'Inventory Report',
        'Full Stock Report',
        new Date().toLocaleDateString('en-US')
      );

      let y = 195;
      const summary = report.summary;
      doc.roundedRect(margin, y, 130, 120, 10).fill(LIGHT);
      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('SUMMARY', margin + 12, y + 14);
      const summaryRows: Array<[string, string]> = [
        ['Products', String(summary.totalProducts)],
        ['Units', String(summary.totalUnits)],
        ['Cost Val.', formatMoney(summary.totalCostValue, symbol)],
        ['Retail Val.', formatMoney(summary.totalRetailValue, symbol)],
        ['Low Stock', String(summary.lowStockCount)],
      ];
      let sy = y + 28;
      summaryRows.forEach(([label, val]) => {
        doc.fillColor(SLATE).fontSize(8).text(label, margin + 12, sy);
        doc.fillColor(NAVY).font('Helvetica-Bold').text(val, margin + 12, sy + 10);
        doc.font('Helvetica');
        sy += 22;
      });

      const tableX = margin + 150;
      let ty = y;
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold');
      doc.text('PRODUCT', tableX, ty);
      doc.text('SKU', tableX + 140, ty);
      doc.text('STOCK', tableX + 220, ty);
      doc.text('RETAIL', tableX + pageW - 80, ty, { width: 80, align: 'right' });
      ty += 14;
      doc.moveTo(tableX, ty).lineTo(tableX + pageW - 150, ty).stroke(NAVY);
      ty += 10;

      doc.font('Helvetica').fontSize(8);
      for (const item of report.items) {
        if (ty > 680) {
          doc.addPage();
          ty = 50;
        }
        doc.fillColor(item.isLowStock ? '#DC2626' : NAVY);
        doc.text(item.name, tableX, ty, { width: 130 });
        doc.fillColor(NAVY).text(item.sku, tableX + 140, ty);
        doc.text(String(item.stockQuantity), tableX + 220, ty);
        doc.text(formatMoney(item.retailValue, symbol), tableX + pageW - 80, ty, { width: 80, align: 'right' });
        ty += 14;
      }

      drawFooter(doc, settings);
    });
  }
}
