import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../src/services/fcm.service';

const prisma = new PrismaClient();

export async function triggerSOS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { lat, lng, type, description, townId } = req.body;

    const alert = await prisma.sOSAlert.create({
      data: { userId, lat: lat || 0, lng: lng || 0, type: type || 'security', status: 'active', description, townId },
    });

    // Notify nearby patrol members and guardians
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const guardians = await prisma.guardianLink.findMany({
      where: { watchedUserId: userId },
      include: { guardian: { select: { expoPushToken: true } } },
    });

    const tokens = guardians.map(g => g.guardian.expoPushToken).filter(Boolean) as string[];

    await Promise.all(tokens.map(token =>
      sendPushNotification(null, token,
        '🚨 Dorpwag SOS — ' + (user?.name || 'Lid'),
        type + (description ? ': ' + description : '') + ' — Tap to respond',
        { alertId: alert.id, lat: String(lat), lng: String(lng) }
      )
    ));

    return res.status(201).json({ alert, notified: tokens.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'SOS failed', details: err.message });
  }
}

export async function cancelSOS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const alert = await prisma.sOSAlert.update({
      where: { id, userId },
      data: { status: 'cancelled', resolvedAt: new Date() },
    });
    return res.json(alert);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getActiveAlerts(req: Request, res: Response) {
  try {
    const { townId } = req.query;
    const alerts = await prisma.sOSAlert.findMany({
      where: { status: 'active', ...(townId ? { townId: String(townId) } : {}) },
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function reportIncidentWithSOS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { title, description, lat, lng, category, severity, mediaUrl } = req.body;

    const incident = await prisma.incident.create({
      data: { userId, title, description, lat, lng, category, severity: severity || 'medium', mediaUrl, status: 'open' },
    });

    // If high severity, auto-trigger community SOS
    if (severity === 'high' || severity === 'critical') {
      await prisma.sOSAlert.create({
        data: { userId, lat, lng, type: 'security', status: 'active', description: title, incidentId: incident.id },
      });
    }

    return res.status(201).json(incident);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
