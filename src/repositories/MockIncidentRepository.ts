import { seedIncidents, DEMO_USER_ID } from '../data/seed';
import type {
  Incident,
  IncidentInput,
  IncidentStatus,
  IncidentUpdateInput,
} from '../types';
import type { IncidentRepository } from './IncidentRepository';

const KEY = 'br-alerta-incidents-v1';
const LEGACY_DEMO_USER_ID = 'demo-cidadao';

const read = (): Incident[] => {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const incidents = JSON.parse(raw) as Incident[];
    let migrated = false;
    for (const incident of incidents) {
      if (incident.userId === LEGACY_DEMO_USER_ID) {
        incident.userId = DEMO_USER_ID;
        migrated = true;
      }
    }
    if (migrated) write(incidents);
    return incidents;
  }
  localStorage.setItem(KEY, JSON.stringify(seedIncidents));
  return seedIncidents;
};

const write = (incidents: Incident[]) =>
  localStorage.setItem(KEY, JSON.stringify(incidents));

function requireOwnedPendingIncident(
  incidents: Incident[],
  id: string,
  ownerId: string,
) {
  const incident = incidents.find((item) => item.id === id);
  if (!incident || incident.userId !== ownerId) {
    throw new Error('Ocorrência não encontrada nas suas solicitações.');
  }
  if (incident.status !== 'PENDING') {
    throw new Error('Somente ocorrências pendentes podem ser editadas ou canceladas.');
  }
  return incident;
}

export class MockIncidentRepository implements IncidentRepository {
  async list() {
    return read();
  }

  async create(input: IncidentInput, ownerId = DEMO_USER_ID) {
    const now = new Date().toISOString();
    const id = `BRA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const incident: Incident = {
      ...input,
      id,
      userId: ownerId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      history: [{
        id: crypto.randomUUID(),
        incidentId: id,
        newStatus: 'PENDING',
        changedBy: ownerId,
        changedAt: now,
        eventType: 'CREATED',
      }],
    };
    const items = [incident, ...read()];
    write(items);
    return incident;
  }

  async updateStatus(id: string, status: IncidentStatus, changedBy: string) {
    const items = read();
    const index = items.findIndex((incident) => incident.id === id);
    if (index < 0) throw new Error('Ocorrência não encontrada.');
    const old = items[index];
    const now = new Date().toISOString();
    const updated: Incident = {
      ...old,
      status,
      updatedAt: now,
      history: [...old.history, {
        id: crypto.randomUUID(),
        incidentId: id,
        previousStatus: old.status,
        newStatus: status,
        changedBy,
        changedAt: now,
        eventType: status === 'CANCELLED' ? 'CANCELLED' : 'STATUS_UPDATED',
      }],
    };
    items[index] = updated;
    write(items);
    return updated;
  }

  async updateOwnPending(id: string, input: IncidentUpdateInput, ownerId: string) {
    const items = read();
    const index = items.findIndex((incident) => incident.id === id);
    const old = requireOwnedPendingIncident(items, id, ownerId);
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || title.length > 80) {
      throw new Error('O título deve conter entre 1 e 80 caracteres.');
    }
    if (!description || description.length > 2000) {
      throw new Error('A descrição deve conter entre 1 e 2000 caracteres.');
    }
    if (old.category === input.category
      && old.title === title
      && old.description === description) {
      return old;
    }

    const now = new Date().toISOString();
    const updated: Incident = {
      ...old,
      ...input,
      title,
      description,
      updatedAt: now,
      history: [...old.history, {
        id: crypto.randomUUID(),
        incidentId: id,
        previousStatus: old.status,
        newStatus: old.status,
        changedBy: ownerId,
        changedAt: now,
        eventType: 'DETAILS_UPDATED',
      }],
    };
    items[index] = updated;
    write(items);
    return updated;
  }

  async cancelOwnPending(id: string, ownerId: string) {
    const items = read();
    const index = items.findIndex((incident) => incident.id === id);
    const old = requireOwnedPendingIncident(items, id, ownerId);
    const now = new Date().toISOString();
    const updated: Incident = {
      ...old,
      status: 'CANCELLED',
      updatedAt: now,
      history: [...old.history, {
        id: crypto.randomUUID(),
        incidentId: id,
        previousStatus: old.status,
        newStatus: 'CANCELLED',
        changedBy: ownerId,
        changedAt: now,
        eventType: 'CANCELLED',
      }],
    };
    items[index] = updated;
    write(items);
    return updated;
  }
}
