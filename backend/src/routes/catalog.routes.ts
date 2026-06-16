import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdminRole } from '../middleware/rbac';
import { CategoryService, BrandService, SupplierService, CustomerService } from '../services/catalog.service';

const router = Router();
router.use(authenticate);
router.use(requireAdminRole);

// Categories
router.get('/categories', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.getAll();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/categories', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/categories/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/categories/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await CategoryService.delete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
});

// Brands
router.get('/brands', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.getAll();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/brands', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/brands/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/brands/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await BrandService.delete(req.params.id);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) { next(error); }
});

// Suppliers
router.get('/suppliers', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await SupplierService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/suppliers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/suppliers', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/suppliers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/suppliers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await SupplierService.delete(req.params.id);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) { next(error); }
});

// Customers
router.get('/customers', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await CustomerService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      isVip: req.query.isVip === 'true' ? true : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/customers/vip', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.getVipCustomers();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/customers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/customers', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/customers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/customers/:id', async (req, res: Response, next: NextFunction) => {
  try {
    await CustomerService.delete(req.params.id);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) { next(error); }
});

export default router;
