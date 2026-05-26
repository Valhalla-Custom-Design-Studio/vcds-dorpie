import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listPatrols(req: Request, res: Response) {
  const patrols = await prisma.patrol.findMany({ where: { status: 'active' }, include: { officer: { select: { name: true } } } });
  return res.json(patrols);
}

export async function checkIn(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { lat, lng, patrolId } = req.body;
  const checkin = await prisma.patrolCheckIn.create({ data: { userId, lat, lng, patrolId, timestamp: new Date() } });
  return res.status(201).json(checkin);
}
