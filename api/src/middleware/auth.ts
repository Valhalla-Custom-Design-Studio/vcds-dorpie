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
