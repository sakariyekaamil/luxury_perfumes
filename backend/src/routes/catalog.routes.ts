import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { CategoryService, BrandService, SupplierService, CustomerService } from '../services/catalog.service';
import { paramId } from '../utils/params';

const router = Router();
router.use(authenticate);

// Categories
router.get('/categories', checkPermission('categories', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.getAll();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/categories', checkPermission('categories', 'create'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/categories/:id', checkPermission('categories', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CategoryService.update(paramId(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/categories/:id', checkPermission('categories', 'delete'), async (req, res: Response, next: NextFunction) => {
  try {
    await CategoryService.delete(paramId(req.params.id));
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
});

// Brands
router.get('/brands', checkPermission('brands', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.getAll();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/brands', checkPermission('brands', 'create'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/brands/:id', checkPermission('brands', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await BrandService.update(paramId(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/brands/:id', checkPermission('brands', 'delete'), async (req, res: Response, next: NextFunction) => {
  try {
    await BrandService.delete(paramId(req.params.id));
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) { next(error); }
});

// Suppliers
router.get('/suppliers', checkPermission('suppliers', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await SupplierService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/suppliers/:id', checkPermission('suppliers', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.getById(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/suppliers', checkPermission('suppliers', 'create'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/suppliers/:id', checkPermission('suppliers', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await SupplierService.update(paramId(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/suppliers/:id', checkPermission('suppliers', 'delete'), async (req, res: Response, next: NextFunction) => {
  try {
    await SupplierService.delete(paramId(req.params.id));
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) { next(error); }
});

// Customers
router.get('/customers', checkPermission('customers', 'read'), async (req, res: Response, next: NextFunction) => {
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

router.get('/customers/vip', checkPermission('customers', 'read'), async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.getVipCustomers();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/customers/:id', checkPermission('customers', 'read'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.getById(paramId(req.params.id));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/customers', checkPermission('customers', 'create'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/customers/:id', checkPermission('customers', 'update'), async (req, res: Response, next: NextFunction) => {
  try {
    const data = await CustomerService.update(paramId(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/customers/:id', checkPermission('customers', 'delete'), async (req, res: Response, next: NextFunction) => {
  try {
    await CustomerService.delete(paramId(req.params.id));
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) { next(error); }
});

export default router;
