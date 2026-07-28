import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data.email, data.password, req.ip);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Public registration disabled — users are created by SUPER_ADMIN via /api/admin/users

router.post('/refresh', async (req, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });
    const result = await AuthService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await AuthService.logout(req.user!.id, req.body.refreshToken, req.ip);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getProfile(req.user!.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
