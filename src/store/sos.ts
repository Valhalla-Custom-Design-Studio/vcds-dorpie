import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SOSContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface SOSStore {
  active: boolean;
  sosId: string | null;
  contacts: SOSContact[];
  guardianMode: boolean;
  deadmanIntervalMinutes: number;
  lastCheckin: string | null;
  setActive: (v: boolean, id?: string) => void;
  setContacts: (c: SOSContact[]) => void;
  setGuardianMode: (v: boolean) => void;
  setDeadmanInterval: (m: number) => void;
  setLastCheckin: (t: string) => void;
}

export const useSOSStore = create<SOSStore>()(
  persist(
    (set) => ({
      active: false,
      sosId: null,
      contacts: [],
      guardianMode: false,
      deadmanIntervalMinutes: 30,
      lastCheckin: null,
      setActive: (active, sosId = null) => set({ active, sosId }),
      setContacts: (contacts) => set({ contacts }),
      setGuardianMode: (guardianMode) => set({ guardianMode }),
      setDeadmanInterval: (deadmanIntervalMinutes) => set({ deadmanIntervalMinutes }),
      setLastCheckin: (lastCheckin) => set({ lastCheckin }),
    }),
    { name: 'sos-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
