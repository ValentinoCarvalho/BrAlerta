import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { SupabaseNotificationReadRepository } from '../src/repositories/SupabaseNotificationReadRepository';

describe('SupabaseNotificationReadRepository', () => {
  it('consulta e persiste leituras vinculadas ao usuário autenticado', async () => {
    const filter = vi.fn(async () => ({
      data: [{ notification_id: 'incident-created' }],
      error: null,
    }));
    const select = vi.fn(() => ({ eq: filter }));
    const upsert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ select, upsert }));
    const client = { from } as unknown as SupabaseClient;
    const repository = new SupabaseNotificationReadRepository(client);

    await expect(repository.listReadIds('user-1')).resolves.toEqual(['incident-created']);
    await repository.markRead('user-1', ['incident-created', 'status-updated']);

    expect(from).toHaveBeenNthCalledWith(1, 'notification_reads');
    expect(filter).toHaveBeenCalledWith('user_id', 'user-1');
    expect(upsert).toHaveBeenCalledWith([
      { user_id: 'user-1', notification_id: 'incident-created' },
      { user_id: 'user-1', notification_id: 'status-updated' },
    ], { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
  });

  it('não envia uma escrita vazia', async () => {
    const upsert = vi.fn();
    const client = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as SupabaseClient;

    await new SupabaseNotificationReadRepository(client).markRead('user-1', []);

    expect(upsert).not.toHaveBeenCalled();
  });
});
