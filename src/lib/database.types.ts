import type { IncidentCategory, IncidentStatus } from '../types';

export interface IncidentRow {
  id: string;
  user_id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  status: IncidentStatus;
  photo_url: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentHistoryRow {
  id: string;
  incident_id: string;
  previous_status: IncidentStatus | null;
  new_status: IncidentStatus;
  changed_by: string | null;
  changed_at: string;
}

export type IncidentWithHistoryRow = IncidentRow & {
  incident_history: IncidentHistoryRow[] | null;
};
