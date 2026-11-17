import { isSupabaseEnabled } from '../lib/runtime';
import { MockNotificationReadRepository } from '../repositories/MockNotificationReadRepository';
import { SupabaseNotificationReadRepository } from '../repositories/SupabaseNotificationReadRepository';
import type { NotificationReadRepository } from '../repositories/NotificationReadRepository';

export const notificationReadRepository: NotificationReadRepository = isSupabaseEnabled
  ? new SupabaseNotificationReadRepository()
  : new MockNotificationReadRepository();
