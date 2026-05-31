import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const tierOrder: Record<string, number> = { free: 0, basic: 1, standard: 2, premium: 3, platinum: 4 };

export const requireTier = (minTier: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  const userTier = req.user?.tier || 'free';
  if ((tierOrder[userTier] ?? 0) < (tierOrder[minTier] ?? 99)) {
    res.status(402).json({ success: false, message: `${minTier} subscription required`, upgrade: true });
    return;
  }
  next();
};
