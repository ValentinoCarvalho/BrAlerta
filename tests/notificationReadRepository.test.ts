import { describe, expect, it } from 'vitest';
import { MockNotificationReadRepository } from '../src/repositories/MockNotificationReadRepository';

describe('persistência local de notificações lidas', () => {
  it('mantém estado separado por usuário e não duplica leituras', async () => {
    const repository = new MockNotificationReadRepository();
    await repository.markRead('citizen-1', ['incident-created', 'status-updated']);
    await repository.markRead('citizen-1', ['incident-created']);
    await repository.markRead('citizen-2', ['incident-created']);

    await expect(repository.listReadIds('citizen-1'))
      .resolves.toEqual(['incident-created', 'status-updated']);
    await expect(repository.listReadIds('citizen-2'))
      .resolves.toEqual(['incident-created']);
  });

  it('informa erro quando o estado local salvo está inválido', async () => {
    localStorage.setItem('br-alerta-notification-reads-v1:citizen-1', '{');

    await expect(new MockNotificationReadRepository().listReadIds('citizen-1'))
      .rejects.toThrow('Não foi possível ler o estado local das notificações.');
  });
});
