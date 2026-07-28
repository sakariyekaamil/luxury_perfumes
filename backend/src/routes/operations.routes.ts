import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { InventoryService } from '../services/inventory.service';
import { PurchaseService } from '../services/purchase.service';
import { SaleService } from '../services/sale.service';
import { InvoiceService } from '../services/invoice.service';
import { paramId } from '../utils/params';

const router = Router();
router.use(authenticate);

// Inventory
router.get('/inventory/transactions', checkPermission('inventory', 'read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await InventoryService.getTransactions({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      productId: req.query.productId as string,
      type: req.query.type as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/inventory/valuation', checkPermission('inventory', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await InventoryService.getValuation();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/inventory/stock-in', checkPermission('inventory', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity, notes, reference } = req.body;
    const result = await InventoryService.stockIn(productId, quantity, req.user!.id, notes, reference);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/inventory/stock-out', checkPermission('inventory', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity, notes, reference } = req.body;
    const result = await InventoryService.stockOut(productId, quantity, req.user!.id, notes, reference);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/inventory/adjust', checkPermission('inventory', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, newQuantity, notes } = req.body;
    const result = await InventoryService.adjust(productId, newQuantity, req.user!.id, notes);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Purchases
router.get('/purchases', checkPermission('purchases', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await PurchaseService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      supplierId: req.query.supplierId as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/purchases/:id', checkPermission('purchases', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await PurchaseService.getById(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/purchases', checkPermission('purchases', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await PurchaseService.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/purchases/:id/approve', checkPermission('purchases', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await PurchaseService.approve(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/purchases/:id/cancel', checkPermission('purchases', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await PurchaseService.cancel(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Sales
router.get('/sales', checkPermission('sales', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await SaleService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      customerId: req.query.customerId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/sales/top-selling', checkPermission('sales', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SaleService.getTopSelling(Number(req.query.limit) || 10);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/sales/:id/invoice/pdf', checkPermission('sales', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const pdf = await InvoiceService.generatePdf(paramId(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${paramId(req.params.id)}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
});

router.get('/sales/:id', checkPermission('sales', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SaleService.getById(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/sales', checkPermission('sales', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await SaleService.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/sales/:id/complete', checkPermission('sales', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await SaleService.complete(
      paramId(req.params.id),
      req.user!.id,
      req.body.paymentMethod as import('@prisma/client').PaymentMethod | undefined
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/sales/:id/cancel', checkPermission('sales', 'update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await SaleService.cancel(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
