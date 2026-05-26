import { create } from 'zustand';

export interface Patrol {
  id: string;
  area: string;
  town_id: string;
  status: 'active' | 'completed' | 'planned';
  organizer_id: string;
  organizer_name: string;
  start_time: string;
  end_time?: string;
  member_count: number;
  joined: boolean;
  notes?: string;
}

interface PatrolStore {
  patrols: Patrol[];
  activePatrol: Patrol | null;
  loading: boolean;
  setPatrols: (p: Patrol[]) => void;
  setActivePatrol: (p: Patrol | null) => void;
  setLoading: (v: boolean) => void;
  joinPatrol: (id: string) => void;
}

export const usePatrolStore = create<PatrolStore>((set) => ({
  patrols: [],
  activePatrol: null,
  loading: false,
  setPatrols: (patrols) => set({ patrols }),
  setActivePatrol: (activePatrol) => set({ activePatrol }),
  setLoading: (loading) => set({ loading }),
  joinPatrol: (id) =>
    set((s) => ({
      patrols: s.patrols.map((p) =>
        p.id === id ? { ...p, joined: true, member_count: p.member_count + 1 } : p
      ),
    })),
}));
