/**
 * Dorpwag™ LPR Service — Hikvision ISAPI + Snipr™ Mobile
 * Supports: Hikvision cameras (ISAPI), Snipr mobile scanning, watchlist matching
 */

export interface LPRResult {
  plate: string;
  confidence: number;
  timestamp: string;
  source: 'hikvision' | 'snipr' | 'manual';
  cameraId?: string;
  location?: string;
  isWatchlisted: boolean;
  watchlistReason?: string;
  imageUrl?: string;
}

export interface HikvisionCamera {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  location: string;
  isOnline: boolean;
}

export class LPRService {
  private apiBase: string;
  private token: string;

  constructor(apiBase: string, token: string) {
    this.apiBase = apiBase;
    this.token = token;
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  // ── Hikvision ISAPI Integration ──────────────────────────
  async getHikvisionCameras(): Promise<HikvisionCamera[]> {
    const res = await fetch(`${this.apiBase}/api/lpr/hikvision/cameras`, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch cameras');
    return res.json();
  }

  async addHikvisionCamera(camera: Omit<HikvisionCamera, 'id' | 'isOnline'>): Promise<HikvisionCamera> {
    const res = await fetch(`${this.apiBase}/api/lpr/hikvision/cameras`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(camera),
    });
    if (!res.ok) throw new Error('Failed to add camera');
    return res.json();
  }

  async getHikvisionEvents(cameraId: string, limit = 50): Promise<LPRResult[]> {
    const res = await fetch(
      `${this.apiBase}/api/lpr/hikvision/events?cameraId=${cameraId}&limit=${limit}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  }

  // ── Snipr™ Mobile LPR ───────────────────────────────────
  async submitSniprScan(plate: string, imageBase64: string, location?: string): Promise<LPRResult> {
    const res = await fetch(`${this.apiBase}/api/lpr/snipr/scan`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ plate, imageBase64, location, source: 'snipr' }),
    });
    if (!res.ok) throw new Error('Snipr scan failed');
    return res.json();
  }

  // ── Watchlist Management ─────────────────────────────────
  async getWatchlist(): Promise<{ plate: string; reason: string; addedAt: string }[]> {
    const res = await fetch(`${this.apiBase}/api/lpr/watchlist`, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    return res.json();
  }

  async addToWatchlist(plate: string, reason: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/lpr/watchlist`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify({ plate, reason }),
    });
    if (!res.ok) throw new Error('Failed to add to watchlist');
  }

  async removeFromWatchlist(plate: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/lpr/watchlist/${encodeURIComponent(plate)}`, {
      method: 'DELETE', headers: this.headers(),
    });
    if (!res.ok) throw new Error('Failed to remove from watchlist');
  }

  // ── Recent Scans ─────────────────────────────────────────
  async getRecentScans(limit = 100): Promise<LPRResult[]> {
    const res = await fetch(`${this.apiBase}/api/lpr/scans?limit=${limit}`, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch scans');
    return res.json();
  }

  // ── Check single plate ───────────────────────────────────
  async checkPlate(plate: string): Promise<{ isWatchlisted: boolean; reason?: string; isResident: boolean }> {
    const res = await fetch(`${this.apiBase}/api/lpr/check/${encodeURIComponent(plate)}`, { headers: this.headers() });
    if (!res.ok) throw new Error('Plate check failed');
    return res.json();
  }
}
