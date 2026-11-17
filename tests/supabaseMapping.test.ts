import { describe, expect, it } from 'vitest';
import { mapIncident } from '../src/repositories/SupabaseIncidentRepository';

describe('conversão banco para domínio', () => {
  it('converte snake_case em camelCase e ordena o histórico', () => {
    const incident = mapIncident({
      id: '8c33861a-4f06-4df0-98bd-4d7ea4a509ed', user_id: '9c33861a-4f06-4df0-98bd-4d7ea4a509ed',
      category: 'STREETLIGHT', title: 'Poste', description: 'Sem luz', latitude: -23, longitude: -43,
      address: null, status: 'IN_PROGRESS', photo_url: null, photo_path: 'user/photo.jpg',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
      incident_history: [
        { id: '2', incident_id: '8c33861a-4f06-4df0-98bd-4d7ea4a509ed', previous_status: 'PENDING', new_status: 'IN_PROGRESS', changed_by: null, changed_at: '2026-01-02T00:00:00Z', event_type: 'STATUS_UPDATED' },
        { id: '1', incident_id: '8c33861a-4f06-4df0-98bd-4d7ea4a509ed', previous_status: null, new_status: 'PENDING', changed_by: null, changed_at: '2026-01-01T00:00:00Z', event_type: 'CREATED' },
      ],
    }, 'https://signed.example/photo');
    expect(incident.userId).toBe('9c33861a-4f06-4df0-98bd-4d7ea4a509ed');
    expect(incident.photoUrl).toBe('https://signed.example/photo');
    expect(incident.history.map(item => item.id)).toEqual(['1', '2']);
    expect(incident.history[0].incidentId).toBe(incident.id);
  });
});
