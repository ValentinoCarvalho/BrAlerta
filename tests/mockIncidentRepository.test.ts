import { describe, expect, it } from 'vitest';
import { MockIncidentRepository } from '../src/repositories/MockIncidentRepository';

describe('fluxo integrado de ocorrências no repositório mock', () => {
  it('cria, consulta, atualiza status e registra histórico', async () => {
    const repository = new MockIncidentRepository();
    const created = await repository.create({
      category: 'POTHOLE', title: 'Buraco de teste', description: 'Descrição de integração',
      latitude: -23.025, longitude: -43.465,
    }, 'citizen-test');
    expect(created.status).toBe('PENDING');
    expect(created.userId).toBe('citizen-test');
    expect(created.history).toHaveLength(1);

    const listed = await repository.list();
    expect(listed.some(item => item.id === created.id)).toBe(true);

    const updated = await repository.updateStatus(created.id, 'IN_PROGRESS', 'admin-test');
    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.history).toHaveLength(2);
    expect(updated.history.at(-1)).toMatchObject({ previousStatus: 'PENDING', newStatus: 'IN_PROGRESS' });
  });

  it('retorna erro ao atualizar ocorrência inexistente', async () => {
    await expect(new MockIncidentRepository().updateStatus('inexistente', 'RESOLVED', 'admin')).rejects.toThrow('não encontrada');
  });

  it('permite editar e cancelar somente ocorrência pendente do próprio cidadão', async () => {
    const repository = new MockIncidentRepository();
    const created = await repository.create({
      category: 'POTHOLE',
      title: 'Buraco antes da edição',
      description: 'Descrição inicial.',
      latitude: -23.025,
      longitude: -43.465,
    }, 'citizen-test');

    const edited = await repository.updateOwnPending(created.id, {
      category: 'STREETLIGHT',
      title: 'Poste apagado',
      description: 'Descrição atualizada.',
    }, 'citizen-test');
    expect(edited).toMatchObject({
      category: 'STREETLIGHT',
      title: 'Poste apagado',
      description: 'Descrição atualizada.',
      latitude: -23.025,
      longitude: -43.465,
    });
    expect(edited.history.at(-1)).toMatchObject({ eventType: 'DETAILS_UPDATED' });

    const cancelled = await repository.cancelOwnPending(created.id, 'citizen-test');
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.history.at(-1)).toMatchObject({
      previousStatus: 'PENDING',
      newStatus: 'CANCELLED',
      eventType: 'CANCELLED',
    });
    await expect(repository.updateOwnPending(created.id, {
      category: 'POTHOLE',
      title: 'Não deve editar',
      description: 'Cancelada.',
    }, 'citizen-test')).rejects.toThrow('pendentes');
  });

  it('não permite que outro cidadão edite ou cancele o registro', async () => {
    const repository = new MockIncidentRepository();
    const created = await repository.create({
      category: 'POTHOLE',
      title: 'Registro próprio',
      description: 'Descrição',
      latitude: -23.025,
      longitude: -43.465,
    }, 'citizen-test');

    await expect(repository.updateOwnPending(created.id, {
      category: 'POTHOLE',
      title: 'Alteração alheia',
      description: 'Descrição',
    }, 'other-citizen')).rejects.toThrow('não encontrada');
    await expect(repository.cancelOwnPending(created.id, 'other-citizen'))
      .rejects.toThrow('não encontrada');
  });
});
