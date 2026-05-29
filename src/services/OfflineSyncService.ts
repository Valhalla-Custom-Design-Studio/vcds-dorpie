import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'vcds_offline_queue';

export interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isOnline = true;

  static getInstance() {
    if (!this.instance) this.instance = new OfflineSyncService();
    return this.instance;
  }

  async init() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;
      if (wasOffline && this.isOnline) this.flushQueue();
    });
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queue = await this.getQueue();
    queue.push({
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      retries: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async flushQueue() {
    const queue = await this.getQueue();
    if (!queue.length) return;
    const remaining: QueuedAction[] = [];
    for (const action of queue) {
      try {
        const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
        await fetch(`${apiBase}${action.endpoint}`, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
      } catch {
        if (action.retries < 3) remaining.push({ ...action, retries: action.retries + 1 });
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  private async getQueue(): Promise<QueuedAction[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  get online() { return this.isOnline; }
}

export const offlineSync = OfflineSyncService.getInstance();
