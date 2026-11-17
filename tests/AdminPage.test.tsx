import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from '../src/pages/AdminPage';
import { useIncidents } from '../src/context/IncidentsContext';
import type { Incident, IncidentCategory, IncidentStatus } from '../src/types';

vi.mock('../src/context/IncidentsContext', () => ({
  useIncidents: vi.fn(),
}));

const incidents: Incident[] = [
  makeIncident('BRA-0001', 'Poste da praça', 'STREETLIGHT', 'PENDING'),
  makeIncident('BRA-0002', 'Buraco avenida', 'POTHOLE', 'IN_PROGRESS'),
  makeIncident('BRA-0003', 'Buraco rua lateral', 'POTHOLE', 'PENDING'),
];

function makeIncident(
  id: string,
  title: string,
  category: IncidentCategory,
  status: IncidentStatus,
): Incident {
  const createdAt = '2025-04-12T14:32:00.000Z';
  return {
    id,
    title,
    category,
    status,
    userId: 'citizen-1',
    description: `Descrição de ${title}`,
    latitude: -23.025,
    longitude: -43.465,
    address: 'Rio de Janeiro - RJ',
    createdAt,
    updatedAt: createdAt,
    history: [{
      id: `${id}-history`,
      incidentId: id,
      newStatus: status,
      changedBy: 'Cidadão',
      changedAt: createdAt,
    }],
  };
}

function setupAdmin() {
  const updateStatus = vi.fn(async (id: string, status: IncidentStatus) => {
    const incident = incidents.find((item) => item.id === id);
    if (!incident) throw new Error('Ocorrência não encontrada.');
    return { ...incident, status };
  });

  vi.mocked(useIncidents).mockReturnValue({
    incidents,
    loading: false,
    refreshing: false,
    error: null,
    readNotificationIds: [],
    notificationReadsLoading: false,
    notificationReadError: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    refreshNotificationReads: vi.fn().mockResolvedValue(undefined),
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(incidents[0]),
    updateStatus,
    updateOwnPending: vi.fn(),
    cancelOwnPending: vi.fn(),
  });

  render(<AdminPage />);
  return { updateStatus };
}

describe('painel administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('combina filtros de categoria e status na listagem', async () => {
    setupAdmin();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'POTHOLE');
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'PENDING');

    expect(screen.getByText('Buraco rua lateral')).toBeInTheDocument();
    expect(screen.queryByText('Buraco avenida')).not.toBeInTheDocument();
    expect(screen.queryByText('Poste da praça')).not.toBeInTheDocument();
  });

  it('abre detalhes e solicita a atualização do status selecionado', async () => {
    const { updateStatus } = setupAdmin();
    const user = userEvent.setup();

    await user.click(screen.getByText('Buraco avenida'));
    expect(screen.getByText('Descrição de Buraco avenida')).toBeInTheDocument();
    expect(
      within(screen.getByRole('complementary')).getByText('Rio de Janeiro - RJ'),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Atualizar status da ocorrência' }),
      'RESOLVED',
    );

    expect(updateStatus).toHaveBeenCalledWith('BRA-0002', 'RESOLVED');
  });
});
