import { Router, Request, Response } from 'express';
const r = Router();
r.get('/health', (_req: Request, res: Response) => res.json({ success: true }));
export default r;
