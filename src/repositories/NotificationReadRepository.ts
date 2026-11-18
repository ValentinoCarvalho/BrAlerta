export interface NotificationReadRepository {
  listReadIds(userId: string): Promise<string[]>;
  markRead(userId: string, notificationIds: string[]): Promise<void>;
}
