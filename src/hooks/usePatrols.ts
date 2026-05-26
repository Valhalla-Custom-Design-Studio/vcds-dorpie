import { useCallback } from 'react';
import { patrols as patrolsAPI } from '../services/api';
import { usePatrolStore } from '../store/patrol';
import { useAuthStore } from '../store/auth';

export function usePatrols() {
  const { patrols, loading, setPatrols, setLoading, joinPatrol } = usePatrolStore();
  const { user } = useAuthStore();

  const fetchPatrols = useCallback(async () => {
    if (!user?.town_id) return;
    setLoading(true);
    try {
      const res = await patrolsAPI.list(user.town_id);
      setPatrols(res.data?.patrols || res.data || []);
    } catch (e) {
      console.error('fetchPatrols:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.town_id]);

  const join = useCallback(async (patrolId: string) => {
    try {
      await patrolsAPI.join(patrolId);
      joinPatrol(patrolId);
    } catch (e) {
      throw e;
    }
  }, []);

  const startPatrol = useCallback(async (area: string, notes?: string) => {
    const res = await patrolsAPI.create({ area, notes, town_id: user?.town_id });
    await fetchPatrols();
    return res.data;
  }, [user?.town_id, fetchPatrols]);

  return { patrols, loading, fetchPatrols, join, startPatrol };
}
