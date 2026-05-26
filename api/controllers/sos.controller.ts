import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function triggerSOS(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { lat, lng, message, type } = req.body;
  const sos = await prisma.sosAlert.create({ data: { userId, lat, lng, message, type: type || 'emergency', status: 'active' } });
  // TODO: push FCM notifications to nearby guardians
  return res.status(201).json(sos);
}

export async function resolveSOSAlert(req: Request, res: Response) {
  const { id } = req.params;
  const sos = await prisma.sosAlert.update({ where: { id }, data: { status: 'resolved', resolvedAt: new Date() } });
  return res.json(sos);
}

export async function listActiveAlerts(req: Request, res: Response) {
  const alerts = await prisma.sosAlert.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' }, take: 50 });
  return res.json(alerts);
}
