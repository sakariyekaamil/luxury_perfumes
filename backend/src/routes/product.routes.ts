import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdminRole } from '../middleware/rbac';
import { ProductService } from '../services/product.service';
import { paramId } from '../utils/params';

const router = Router();

router.use(authenticate);
router.use(requireAdminRole);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.getAll({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      brandId: req.query.brandId as string,
      status: req.query.status as string,
      lowStock: req.query.lowStock === 'true',
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/low-stock', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await ProductService.getLowStock();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.get('/barcode/:barcode', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../config/database');
    const product = await prisma.product.findFirst({
      where: { barcode: paramId(req.params.barcode), deletedAt: null },
      include: { brand: true, category: true },
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.getById(paramId(req.params.id));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.update(paramId(req.params.id), req.body, req.user!.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.delete(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
