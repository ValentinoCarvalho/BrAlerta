import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import type { NotificationReadRepository } from './NotificationReadRepository';

export class SupabaseNotificationReadRepository implements NotificationReadRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = getSupabaseClient()) {
    this.client = client;
  }

  async listReadIds(userId: string) {
    const { data, error } = await this.client
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Não foi possível carregar as notificações lidas: ${error.message}`);
    }
    return (data ?? []).map((row) => row.notification_id);
  }

  async markRead(userId: string, notificationIds: string[]) {
    if (notificationIds.length === 0) return;

    const { error } = await this.client
      .from('notification_reads')
      .upsert(
        notificationIds.map((notificationId) => ({
          user_id: userId,
          notification_id: notificationId,
        })),
        { onConflict: 'user_id,notification_id', ignoreDuplicates: true },
      );

    if (error) {
      throw new Error(`Não foi possível marcar as notificações como lidas: ${error.message}`);
    }
  }
}
