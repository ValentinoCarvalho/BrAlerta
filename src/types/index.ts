export type IncidentCategory = 'STREETLIGHT' | 'POTHOLE';
export type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
export interface IncidentHistory { id: string; incidentId: string; previousStatus?: IncidentStatus; newStatus: IncidentStatus; changedBy: string; changedAt: string; }
export interface Incident { id: string; userId: string; category: IncidentCategory; title: string; description: string; latitude: number; longitude: number; address?: string; status: IncidentStatus; photoUrl?: string; createdAt: string; updatedAt: string; history: IncidentHistory[]; }
export interface IncidentInput { category: IncidentCategory; title: string; description: string; latitude: number; longitude: number; address?: string; photoUrl?: string; photoFile?: File; }
