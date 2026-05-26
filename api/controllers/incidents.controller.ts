import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listIncidents(req: Request, res: Response) {
  const incidents = await prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return res.json(incidents);
}

export async function createIncident(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const incident = await prisma.incident.create({ data: { ...req.body, reportedBy: userId } });
  return res.status(201).json(incident);
}
