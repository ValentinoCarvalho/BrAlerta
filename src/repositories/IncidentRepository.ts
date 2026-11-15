import type { Incident, IncidentInput, IncidentStatus } from '../types';
export interface IncidentRepository { list(): Promise<Incident[]>; create(input: IncidentInput): Promise<Incident>; updateStatus(id: string,status: IncidentStatus,changedBy: string): Promise<Incident>; }
