import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { IncidentWithHistoryRow } from '../src/lib/database.types';
import { SupabaseIncidentRepository } from '../src/repositories/SupabaseIncidentRepository';

function makeIncidentRow(
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' = 'PENDING',
): IncidentWithHistoryRow {
  const id = '8c33861a-4f06-4df0-98bd-4d7ea4a509ed';
  const createdAt = '2026-01-01T00:00:00.000Z';
  const history: NonNullable<IncidentWithHistoryRow['incident_history']> = [{
    id: 'history-1',
    incident_id: id,
    previous_status: null,
    new_status: 'PENDING',
    changed_by: 'user-1',
    changed_at: createdAt,
    event_type: 'CREATED',
  }];
  if (status !== 'PENDING') {
    history.push({
      id: 'history-2',
      incident_id: id,
      previous_status: 'PENDING',
      new_status: status,
      changed_by: 'admin-1',
      changed_at: '2026-01-02T00:00:00.000Z',
      event_type: status === 'CANCELLED' ? 'CANCELLED' : 'STATUS_UPDATED',
    });
  }
  return {
    id,
    user_id: 'user-1',
    category: 'POTHOLE',
    title: 'Buraco na rua',
    description: 'Asfalto danificado.',
    latitude: -23.025,
    longitude: -43.465,
    address: null,
    status,
    photo_url: null,
    photo_path: null,
    created_at: createdAt,
    updated_at: status === 'PENDING' ? createdAt : '2026-01-02T00:00:00.000Z',
    incident_history: history,
  };
}

describe('SupabaseIncidentRepository', () => {
  it('cadastra pela RPC transacional e consulta o registro criado', async () => {
    const row = makeIncidentRow();
    const rpc = vi.fn(async () => ({ data: row.id, error: null }));
    const single = vi.fn(async () => ({ data: row, error: null }));
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      })),
    }));
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
      from,
      rpc,
    } as unknown as SupabaseClient;

    const incident = await new SupabaseIncidentRepository(client).create({
      category: 'POTHOLE',
      title: 'Buraco na rua',
      description: 'Asfalto danificado.',
      latitude: -23.025,
      longitude: -43.465,
    });

    expect(rpc).toHaveBeenCalledWith('create_incident_with_scene', {
      p_category: 'POTHOLE',
      p_title: 'Buraco na rua',
      p_description: 'Asfalto danificado.',
      p_latitude: -23.025,
      p_longitude: -43.465,
      p_address: null,
      p_photo_path: null,
    });
    expect(from).toHaveBeenCalledWith('incidents');
    expect(single).toHaveBeenCalledOnce();
    expect(incident).toMatchObject({
      id: row.id,
      category: 'POTHOLE',
      status: 'PENDING',
      latitude: -23.025,
      longitude: -43.465,
    });
  });

  it('consulta ocorrências e atualiza o status pelo RPC', async () => {
    const pendingRow = makeIncidentRow();
    const updatedRow = makeIncidentRow('IN_PROGRESS');
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [pendingRow], error: null })),
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: updatedRow, error: null })),
          })),
        })),
      })),
      rpc,
    } as unknown as SupabaseClient;
    const repository = new SupabaseIncidentRepository(client);

    const listed = await repository.list();
    const updated = await repository.updateStatus(pendingRow.id, 'IN_PROGRESS', 'admin-1');

    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ id: pendingRow.id, status: 'PENDING' });
    expect(rpc).toHaveBeenCalledWith('update_incident_status', {
      p_incident_id: pendingRow.id,
      p_new_status: 'IN_PROGRESS',
    });
    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.history).toHaveLength(2);
  });

  it('edita apenas os detalhes autorizados pela RPC de cidadão', async () => {
    const updatedRow = makeIncidentRow();
    updatedRow.title = 'Poste atualizado';
    updatedRow.category = 'STREETLIGHT';
    updatedRow.incident_history?.push({
      id: 'history-edit',
      incident_id: updatedRow.id,
      previous_status: 'PENDING',
      new_status: 'PENDING',
      changed_by: 'user-1',
      changed_at: '2026-01-03T00:00:00.000Z',
      event_type: 'DETAILS_UPDATED',
    });
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: updatedRow, error: null })),
          })),
        })),
      })),
      rpc,
    } as unknown as SupabaseClient;

    const updated = await new SupabaseIncidentRepository(client).updateOwnPending(
      updatedRow.id,
      { category: 'STREETLIGHT', title: 'Poste atualizado', description: 'Nova descrição.' },
      'user-1',
    );

    expect(rpc).toHaveBeenCalledWith('update_own_pending_incident', {
      p_incident_id: updatedRow.id,
      p_category: 'STREETLIGHT',
      p_title: 'Poste atualizado',
      p_description: 'Nova descrição.',
    });
    expect(updated).toMatchObject({
      title: 'Poste atualizado',
      category: 'STREETLIGHT',
      history: [{ eventType: 'CREATED' }, { eventType: 'DETAILS_UPDATED' }],
    });
  });

  it('cancela ocorrência pendente pela RPC protegida', async () => {
    const cancelledRow = makeIncidentRow('CANCELLED');
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: cancelledRow, error: null })),
          })),
        })),
      })),
      rpc,
    } as unknown as SupabaseClient;

    const cancelled = await new SupabaseIncidentRepository(client).cancelOwnPending(
      cancelledRow.id,
      'user-1',
    );

    expect(rpc).toHaveBeenCalledWith('cancel_own_pending_incident', {
      p_incident_id: cancelledRow.id,
    });
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('expõe erro ao gerar URLs assinadas para fotos privadas', async () => {
    const row = makeIncidentRow();
    row.photo_path = 'user-1/photo.jpg';
    const client = {
      from: () => ({
        select: () => ({
          order: async () => ({ data: [row], error: null }),
        }),
      }),
      storage: {
        from: () => ({
          createSignedUrls: async () => ({
            data: null,
            error: { message: 'Access denied' },
          }),
        }),
      },
    } as unknown as SupabaseClient;

    await expect(new SupabaseIncidentRepository(client).list())
      .rejects.toThrow('carregar as fotos das ocorrências');
  });

  it('propaga erro contextualizado de consulta', async () => {
    const client = {
      from: () => ({ select: () => ({ order: async () => ({ data: null, error: { message: 'Failed to fetch' } }) }) }),
    } as unknown as SupabaseClient;
    await expect(new SupabaseIncidentRepository(client).list()).rejects.toThrow('carregar as ocorrências');
  });

  it('remove a foto quando a RPC de cadastro falha', async () => {
    const remove = vi.fn(async () => ({ error: null }));
    const upload = vi.fn(async () => ({ error: null }));
    const client = {
      auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
      storage: { from: () => ({ upload, remove }) },
      rpc: async () => ({ data: null, error: { message: 'transaction failed' } }),
    } as unknown as SupabaseClient;
    const file = new File(['image'], 'foto.jpg', { type: 'image/jpeg' });
    await expect(new SupabaseIncidentRepository(client).create({
      category: 'POTHOLE', title: 'Teste', description: 'Descrição', latitude: -23, longitude: -43, photoFile: file,
    })).rejects.toThrow('registrar a ocorrência');
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });
});
