import type { NotificationReadRepository } from './NotificationReadRepository';

const KEY = 'br-alerta-notification-reads-v1';

function storageKey(userId: string) {
  return `${KEY}:${encodeURIComponent(userId)}`;
}

function read(userId: string): string[] {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];

  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Não foi possível ler o estado local das notificações.');
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error('O estado local das notificações está inválido.');
  }
  return value;
}

function write(userId: string, notificationIds: string[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(notificationIds));
}

export class MockNotificationReadRepository implements NotificationReadRepository {
  async listReadIds(userId: string) {
    return read(userId);
  }

  async markRead(userId: string, notificationIds: string[]) {
    const existing = read(userId);
    write(userId, [...new Set([...existing, ...notificationIds])]);
  }
}
