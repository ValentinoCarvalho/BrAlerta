import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { SupabaseIncidentRepository } from '../src/repositories/SupabaseIncidentRepository';

describe('SupabaseIncidentRepository', () => {
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
