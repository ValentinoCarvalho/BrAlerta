import { MockIncidentRepository } from '../repositories/MockIncidentRepository';
import { SupabaseIncidentRepository } from '../repositories/SupabaseIncidentRepository';
import { isSupabaseConfigured } from '../lib/supabase';
import type { IncidentRepository } from '../repositories/IncidentRepository';
import { isSupabaseEnabled } from '../lib/runtime';

if (isSupabaseEnabled && !isSupabaseConfigured) {
  throw new Error('VITE_USE_SUPABASE está ativo, mas as credenciais públicas não foram configuradas.');
}

export const incidentRepository: IncidentRepository = isSupabaseEnabled
  ? new SupabaseIncidentRepository()
  : new MockIncidentRepository();
