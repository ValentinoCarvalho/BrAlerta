import type {
  Incident,
  IncidentInput,
  IncidentStatus,
  IncidentUpdateInput,
} from '../types';

export interface IncidentRepository {
  list(): Promise<Incident[]>;
  create(input: IncidentInput, ownerId?: string): Promise<Incident>;
  updateStatus(id: string, status: IncidentStatus, changedBy: string): Promise<Incident>;
  updateOwnPending(
    id: string,
    input: IncidentUpdateInput,
    ownerId: string,
  ): Promise<Incident>;
  cancelOwnPending(id: string, ownerId: string): Promise<Incident>;
}
