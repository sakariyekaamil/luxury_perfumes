import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { DashboardService } from '../services/dashboard.service';

const router = Router();

router.use(authenticate);

router.get('/stats', checkPermission('dashboard', 'read'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await DashboardService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/revenue', checkPermission('dashboard', 'read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
    const data = await DashboardService.getRevenueAnalytics(period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/sales-analytics', checkPermission('dashboard', 'read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
    const data = await DashboardService.getSalesAnalytics(period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
