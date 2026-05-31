import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; tier: string; suiteUserId?: string; };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin access required' }); return; }
  next();
};

export const requirePaid = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.tier === 'free') { res.status(402).json({ success: false, message: 'Paid subscription required', upgrade: true }); return; }
  next();
};

// Alias for lpr.ts compatibility
export const requireAuth = authenticate;

// Tier-based access control
export const requireTier = (minTier: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  const tierOrder: Record<string, number> = { free: 0, basic: 1, standard: 2, premium: 3, platinum: 4 };
  const userTier = req.user?.tier || 'free';
  if ((tierOrder[userTier] ?? 0) < (tierOrder[minTier] ?? 99)) {
    res.status(402).json({ success: false, message: `${minTier} subscription required`, upgrade: true });
    return;
  }
  next();
};
