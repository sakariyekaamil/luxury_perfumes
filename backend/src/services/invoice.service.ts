import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { SaleService } from './sale.service';
import { SettingsService } from './settings.service';

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  EVC_PLUS: 'EVC Plus',
  ZAAD: 'Zaad',
  EDAHAB: 'Edahab',
  BANK_TRANSFER: 'Bank Transfer',
};

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

export class InvoiceService {
  static async generatePdf(saleId: string): Promise<Buffer> {
    const sale = await SaleService.getById(saleId);
    const settings = await SettingsService.get();
    const symbol = settings.currencySymbol || '$';
    const invoiceNumber = `${settings.invoicePrefix || 'MP'}-${sale.saleNumber.replace(/^SL-/, '')}`;
    const payment = sale.payments?.[0];
    const cashierName = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Staff';
    const termsText = settings.invoiceFooter || 'Payment is due upon receipt. Thank you for choosing Luxury Perfumes.';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const chunks: Buffer[] = [];
      const pageW = doc.page.width;
      const margin = 50;

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo / company
      const localLogoPath = settings.companyLogo?.startsWith('/uploads/')
        ? path.join(process.cwd(), settings.companyLogo.replace(/^\//, '').replace(/\//g, path.sep))
        : null;
      const hasLocalLogo = localLogoPath && fs.existsSync(localLogoPath);

      if (hasLocalLogo) {
        doc.image(localLogoPath!, margin, 45, { fit: [40, 40], align: 'center', valign: 'center' });
      } else {
        doc.roundedRect(margin, 45, 40, 40, 6).fill(NAVY);
        doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold').text('LP', margin + 11, 57);
      }
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text(settings.companyName, margin + 50, 52);
      doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold').text('LUXURY', margin + 50, 64);

      // INVOICE block
      const invBlockX = pageW - margin - 200;
      doc.roundedRect(invBlockX, 40, 160, 50, 0).fill(NAVY);
      doc.path(`M ${invBlockX} 90 Q ${invBlockX} 90, ${invBlockX + 24} 90 L ${invBlockX + 160} 90 L ${invBlockX + 160} 40 Z`).fill(NAVY);
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('INVOICE:', invBlockX + 20, 55);
      drawDecor(doc, invBlockX + 168, 48);

      // Invoice to
      let y = 120;
      doc.fillColor(GOLD).fontSize(9).font('Helvetica-Bold').text('INVOICE TO:', margin, y);
      y += 16;
      doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold').text(sale.customer?.name || 'Walk-in Customer', margin, y);
      y += 20;
      doc.font('Helvetica').fontSize(9).fillColor(SLATE);
      const customerLines = [
        sale.customer?.address,
        sale.customer?.phone,
        sale.customer?.email,
      ].filter(Boolean);
      if (customerLines.length === 0) customerLines.push('Retail customer');
      customerLines.forEach((line) => {
        doc.circle(margin + 4, y + 4, 3).fill(GOLD);
        doc.text(String(line), margin + 14, y, { width: 220 });
        y += 14;
      });

      // Meta right
      const metaX = pageW - margin - 180;
      let metaY = 120;
      const metaRows = [
        ['Invoice No:', invoiceNumber],
        ['Invoice Date:', new Date(sale.completedAt || sale.createdAt).toLocaleDateString('en-US')],
        ['Sale Ref:', sale.saleNumber],
        ['Status:', sale.status],
      ];
      metaRows.forEach(([label, value]) => {
        doc.fillColor(SLATE).fontSize(9).text(label, metaX, metaY, { continued: true });
        doc.fillColor(NAVY).font('Helvetica-Bold').text(` ${value}`, { width: 180 });
        doc.font('Helvetica');
        metaY += 16;
      });

      // Sidebar background
      const contentY = 210;
      const sidebarW = 130;
      doc.roundedRect(margin, contentY, sidebarW, 280, 12).fill(LIGHT);

      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('PAYMENT METHOD', margin + 12, contentY + 16);
      doc.moveTo(margin + 12, contentY + 28).lineTo(margin + sidebarW - 12, contentY + 28).stroke('#CBD5E1');

      let payY = contentY + 36;
      const methods = ['Cash', 'EVC Plus', 'Zaad', 'Edahab', 'Bank Transfer'];
      methods.forEach((m) => {
        const active = payment && PAYMENT_LABELS[payment.method] === m;
        doc.fillColor(active ? NAVY : SLATE).fontSize(8).font(active ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(`${active ? '●' : '○'} ${m}`, margin + 12, payY);
        payY += 14;
      });

      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS', margin + 12, payY + 10);
      doc.moveTo(margin + 12, payY + 22).lineTo(margin + sidebarW - 12, payY + 22).stroke('#CBD5E1');
      doc.fillColor(SLATE).fontSize(7).font('Helvetica').text(termsText, margin + 12, payY + 28, {
        width: sidebarW - 24,
        lineGap: 2,
      });

      // Table
      const tableX = margin + sidebarW + 20;
      const tableW = pageW - tableX - margin;
      let tableY = contentY + 10;

      doc.moveTo(tableX, tableY).lineTo(tableX + tableW, tableY).stroke(NAVY);
      tableY += 10;
      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold');
      doc.text('PRODUCT', tableX, tableY);
      doc.text('PRICE', tableX + tableW - 180, tableY, { width: 60, align: 'right' });
      doc.text('QTY', tableX + tableW - 110, tableY, { width: 40, align: 'center' });
      doc.text('TOTAL', tableX + tableW - 70, tableY, { width: 70, align: 'right' });
      tableY += 12;
      doc.moveTo(tableX, tableY).lineTo(tableX + tableW, tableY).stroke(NAVY);
      tableY += 14;

      doc.font('Helvetica').fontSize(9).fillColor(NAVY);
      for (const item of sale.items) {
        doc.font('Helvetica-Bold').text(item.product?.name || 'Product', tableX, tableY, { width: tableW - 200 });
        doc.font('Helvetica').fillColor(SLATE).fontSize(7).text(item.product?.sku || '', tableX, tableY + 12);
        doc.fillColor(NAVY).fontSize(9);
        doc.text(formatMoney(Number(item.unitPrice), symbol), tableX + tableW - 180, tableY, { width: 60, align: 'right' });
        doc.text(String(item.quantity), tableX + tableW - 110, tableY, { width: 40, align: 'center' });
        doc.font('Helvetica-Bold').text(formatMoney(Number(item.total), symbol), tableX + tableW - 70, tableY, { width: 70, align: 'right' });
        doc.font('Helvetica');
        tableY += 28;
        doc.moveTo(tableX, tableY - 6).lineTo(tableX + tableW, tableY - 6).stroke('#E2E8F0');
      }

      // Signature + totals
      tableY += 20;
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text(cashierName, tableX, tableY);
      doc.moveTo(tableX, tableY + 18).lineTo(tableX + 100, tableY + 12).stroke(GOLD);
      doc.fillColor(SLATE).fontSize(8).text('Authorized Cashier', tableX, tableY + 22);

      const totalsX = tableX + tableW - 160;
      let totalsY = tableY;
      const totalRows: Array<[string, string]> = [
        ['SUB TOTAL', formatMoney(Number(sale.subtotal), symbol)],
      ];
      if (Number(sale.discount) > 0) totalRows.push(['DISCOUNT', `-${formatMoney(Number(sale.discount), symbol)}`]);
      if (Number(sale.tax) > 0) totalRows.push([`TAX (${settings.taxRate}%)`, formatMoney(Number(sale.tax), symbol)]);

      totalRows.forEach(([label, val]) => {
        doc.fillColor(SLATE).fontSize(8).text(label, totalsX, totalsY);
        doc.fillColor(NAVY).font('Helvetica-Bold').text(val, totalsX + 80, totalsY, { width: 80, align: 'right' });
        doc.font('Helvetica');
        totalsY += 16;
      });

      totalsY += 4;
      doc.moveTo(totalsX, totalsY).lineTo(totalsX + 160, totalsY).stroke(NAVY);
      totalsY += 8;
      doc.fillColor(NAVY).fontSize(10).font('Helvetica-Bold').text('TOTAL', totalsX, totalsY);
      doc.fillColor(GOLD).fontSize(14).text(formatMoney(Number(sale.totalAmount), symbol), totalsX + 80, totalsY - 2, { width: 80, align: 'right' });

      // Footer band
      const footerY = doc.page.height - 55;
      doc.rect(0, footerY, pageW, 55).fill(NAVY);
      drawDecor(doc, pageW - 120, footerY + 10);

      const footerParts = [settings.phone, settings.email, settings.address].filter(Boolean).join('   |   ');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text(footerParts, margin, footerY + 22, {
        width: pageW - margin * 2,
        align: 'center',
      });

      doc.end();
    });
  }
}
