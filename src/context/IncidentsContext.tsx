import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { normalizeIntegrationError } from '../lib/integrationError';
import { isSupabaseEnabled } from '../lib/runtime';
import { getSupabaseClient } from '../lib/supabase';
import { incidentRepository } from '../services/incidents';
import type { Incident, IncidentInput, IncidentStatus } from '../types';
import { useAuth } from './AuthContext';

type Context = {
  incidents: Incident[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: IncidentInput) => Promise<Incident>;
  updateStatus: (id: string, status: IncidentStatus) => Promise<Incident>;
};

const C = createContext<Context | null>(null);

export function IncidentsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creating = useRef(false);
  const updating = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    setError(null);
    try {
      setIncidents(await incidentRepository.list());
    } catch (cause) {
      setError(
        normalizeIntegrationError(cause, 'Não foi possível carregar as ocorrências.').message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const timer = window.setTimeout(() => {
      if (!user) {
        setIncidents([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, authLoading, refresh]);

  useEffect(() => {
    if (!isSupabaseEnabled || !user || import.meta.env.VITE_ENABLE_REALTIME !== 'true') return;

    const client = getSupabaseClient();
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 350);
    };
    const channel = client
      .channel('br-alerta-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, schedule)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incident_history' },
        schedule,
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      void client.removeChannel(channel);
    };
  }, [user, refresh]);

  const create = useCallback(
    async (input: IncidentInput) => {
      if (!user) {
        throw normalizeIntegrationError(
          new Error('Entre na plataforma para registrar uma ocorrência.'),
        );
      }
      if (creating.current) throw new Error('A ocorrência já está sendo publicada.');

      creating.current = true;
      try {
        const incident = await incidentRepository.create(input);
        setIncidents((current) => [
          incident,
          ...current.filter((item) => item.id !== incident.id),
        ]);
        return incident;
      } catch (cause) {
        throw normalizeIntegrationError(cause, 'Não foi possível publicar a ocorrência.');
      } finally {
        creating.current = false;
      }
    },
    [user],
  );

  const updateStatus = useCallback(
    async (id: string, status: IncidentStatus) => {
      if (!user || !isAdmin) {
        throw normalizeIntegrationError(
          new Error('Somente administradores podem atualizar o status.'),
        );
      }
      if (updating.current.has(id)) {
        throw new Error('Esta ocorrência já está sendo atualizada.');
      }

      updating.current.add(id);
      try {
        const incident = await incidentRepository.updateStatus(id, status, user.id);
        setIncidents((current) =>
          current.map((item) => (item.id === id ? incident : item)),
        );
        return incident;
      } catch (cause) {
        throw normalizeIntegrationError(cause, 'Não foi possível atualizar o status.');
      } finally {
        updating.current.delete(id);
      }
    },
    [user, isAdmin],
  );

  const value = useMemo(
    () => ({ incidents, loading, refreshing, error, refresh, create, updateStatus }),
    [incidents, loading, refreshing, error, refresh, create, updateStatus],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useIncidents() {
  const value = useContext(C);
  if (!value) throw new Error('IncidentsProvider ausente');
  return value;
}
