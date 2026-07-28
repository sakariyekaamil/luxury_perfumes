import { Router, Response, NextFunction } from 'express';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkPermission, requireAdminRole } from '../middleware/rbac';
import { PaymentService, ExpenseService } from '../services/finance.service';
import { ReportService } from '../services/report.service';
import { ReportPdfService } from '../services/report-pdf.service';
import { UserService } from '../services/user.service';
import { SettingsService, NotificationService, AuditLogService } from '../services/settings.service';
import { paramId } from '../utils/params';
import { logoUpload, deleteLocalLogo, saveLocalLogo } from '../middleware/upload';
import { deleteCloudinaryLogo, uploadLogoBuffer } from '../services/cloudinary.service';
import { isCloudinaryConfigured, config } from '../config';
import { ValidationError } from '../utils/errors';

const router = Router();
router.use(authenticate);

// Payments
router.get('/payments', checkPermission('payments', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      saleId: req.query.saleId as string,
      purchaseId: req.query.purchaseId as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.post('/payments', checkPermission('payments', 'create'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await PaymentService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.patch('/payments/:id/status', checkPermission('payments', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await PaymentService.updateStatus(paramId(req.params.id), req.body.status);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Expenses
router.get('/expenses', checkPermission('expenses', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await ExpenseService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      category: req.query.category as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/expenses/summary', checkPermission('expenses', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await ExpenseService.getSummary(req.query.startDate as string, req.query.endDate as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/expenses', checkPermission('expenses', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ExpenseService.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/expenses/:id', checkPermission('expenses', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await ExpenseService.update(paramId(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/expenses/:id', checkPermission('expenses', 'delete'), async (req, res: Response, next: NextFunction) => {
  try {
    await ExpenseService.delete(paramId(req.params.id));
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) { next(error); }
});

// Reports
router.get('/reports/sales', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const { startDate, endDate } = ReportService.getDateRange(period);
    const data = await ReportService.getSalesReport(
      req.query.startDate as string || startDate,
      req.query.endDate as string || endDate
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/reports/purchases', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const { startDate, endDate } = ReportService.getDateRange(period);
    const data = await ReportService.getPurchaseReport(
      req.query.startDate as string || startDate,
      req.query.endDate as string || endDate
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/reports/profit', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const { startDate, endDate } = ReportService.getDateRange(period);
    const data = await ReportService.getProfitReport(
      req.query.startDate as string || startDate,
      req.query.endDate as string || endDate
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/reports/inventory', checkPermission('reports', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await ReportService.getInventoryReport();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/reports/expenses', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const { startDate, endDate } = ReportService.getDateRange(period);
    const data = await ReportService.getExpenseReport(
      req.query.startDate as string || startDate,
      req.query.endDate as string || endDate
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/reports/summary/pdf', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const pdf = await ReportPdfService.generateSummaryPdf(period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="business-report-${period}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

router.get('/reports/sales/pdf', checkPermission('reports', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const pdf = await ReportPdfService.generateSalesPdf(period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sales-report-${period}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

router.get('/reports/inventory/pdf', checkPermission('reports', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const pdf = await ReportPdfService.generateInventoryPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.pdf"');
    res.send(pdf);
  } catch (error) { next(error); }
});

// Users — any staff with read can list; SUPER_ADMIN + ADMIN can mutate
router.get('/users', checkPermission('users', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      role: req.query.role as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/users/:id', checkPermission('users', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await UserService.getById(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/users', requireAdminRole, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await UserService.create(req.body, req.user!.id, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/users/:id', requireAdminRole, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await UserService.update(paramId(req.params.id), req.body, req.user!.id, req.user!.role);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/users/:id', requireAdminRole, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.delete(paramId(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Settings — any authenticated user can read (for logo/company name in UI)
router.get('/settings', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await SettingsService.get();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/settings', requireAdminRole, async (req, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data = await SettingsService.update({
      companyName: typeof body.companyName === 'string' ? body.companyName.trim() : undefined,
      companyLogo: typeof body.companyLogo === 'string' ? body.companyLogo.trim() || null : undefined,
      address: typeof body.address === 'string' ? body.address.trim() || undefined : undefined,
      phone: typeof body.phone === 'string' ? body.phone.trim() || undefined : undefined,
      email: typeof body.email === 'string' ? body.email.trim() || undefined : undefined,
      currency: typeof body.currency === 'string' ? body.currency : undefined,
      currencySymbol: typeof body.currencySymbol === 'string' ? body.currencySymbol : undefined,
      taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
      taxEnabled:
        body.taxEnabled !== undefined
          ? typeof body.taxEnabled === 'boolean'
            ? body.taxEnabled
            : body.taxEnabled === 'true'
          : undefined,
      invoicePrefix: typeof body.invoicePrefix === 'string' ? body.invoicePrefix : undefined,
      invoiceFooter: typeof body.invoiceFooter === 'string' ? body.invoiceFooter.trim() || undefined : undefined,
      lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : undefined,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post(
  '/settings/logo',
  requireAdminRole,
  (req, res, next) => {
    logoUpload.single('logo')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  async (req, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new ValidationError('No logo image provided');
      if (config.isServerless && !isCloudinaryConfigured()) {
        throw new ValidationError(
          'Logo uploads require Cloudinary on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
        );
      }
      const settings = await SettingsService.get();

      if (settings.companyLogo?.includes('cloudinary.com')) {
        await deleteCloudinaryLogo(settings.companyLogo);
      } else {
        deleteLocalLogo(settings.companyLogo);
      }

      let logoUrl: string;
      if (isCloudinaryConfigured()) {
        const buffer = req.file.buffer ?? fs.readFileSync(req.file.path);
        logoUrl = await uploadLogoBuffer(buffer, req.file.mimetype);
        if (req.file.path) deleteLocalLogo(`/uploads/logos/${req.file.filename}`);
      } else if (req.file.buffer) {
        logoUrl = saveLocalLogo(req.file);
      } else {
        logoUrl = `/uploads/logos/${req.file.filename}`;
      }

      const data = await SettingsService.update({ companyLogo: logoUrl });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
);

router.delete('/settings/logo', requireAdminRole, async (_req, res: Response, next: NextFunction) => {
  try {
    const settings = await SettingsService.get();
    if (settings.companyLogo?.includes('cloudinary.com')) {
      await deleteCloudinaryLogo(settings.companyLogo);
    } else {
      deleteLocalLogo(settings.companyLogo);
    }
    const data = await SettingsService.update({ companyLogo: null });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Notifications — any authenticated user can read/mark their own
router.get('/notifications', checkPermission('notifications', 'read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationService.getAll(req.user!.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      unreadOnly: req.query.unreadOnly === 'true',
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.patch('/notifications/:id/read', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await NotificationService.markAsRead(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.patch('/notifications/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await NotificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

// Audit Logs
router.get('/audit-logs', checkPermission('audit_logs', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await AuditLogService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      entity: req.query.entity as string,
      action: req.query.action as string,
      userId: req.query.userId as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

export default router;
