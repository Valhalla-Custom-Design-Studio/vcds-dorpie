import { create } from 'zustand';

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  address?: string;
  town_id: string;
  reported_by: string;
  reporter_name?: string;
  photo_url?: string;
  status: 'open' | 'investigating' | 'resolved';
  upvotes: number;
  created_at: string;
}

interface IncidentStore {
  incidents: Incident[];
  selected: Incident | null;
  loading: boolean;
  error: string | null;
  setIncidents: (i: Incident[]) => void;
  setSelected: (i: Incident | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  addIncident: (i: Incident) => void;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  incidents: [],
  selected: null,
  loading: false,
  error: null,
  setIncidents: (incidents) => set({ incidents }),
  setSelected: (selected) => set({ selected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addIncident: (i) => set((s) => ({ incidents: [i, ...s.incidents] })),
  updateIncident: (id, patch) =>
    set((s) => ({
      incidents: s.incidents.map((inc) => (inc.id === id ? { ...inc, ...patch } : inc)),
    })),
}));
