import { describe, expect, it } from 'vitest';
import { MockIncidentRepository } from '../src/repositories/MockIncidentRepository';

describe('fluxo integrado de ocorrências no repositório mock', () => {
  it('cria, consulta, atualiza status e registra histórico', async () => {
    const repository = new MockIncidentRepository();
    const created = await repository.create({
      category: 'POTHOLE', title: 'Buraco de teste', description: 'Descrição de integração',
      latitude: -23.025, longitude: -43.465,
    });
    expect(created.status).toBe('PENDING');
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
});
