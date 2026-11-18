import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../src/context/AuthContext';
import { useIncidents } from '../src/context/IncidentsContext';
import { MyIncidentsPage } from '../src/pages/MyIncidentsPage';
import type { Incident, IncidentStatus } from '../src/types';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/context/IncidentsContext', () => ({
  useIncidents: vi.fn(),
}));

function makeIncident(
  id: string,
  title: string,
  userId: string,
  status: IncidentStatus,
): Incident {
  const createdAt = '2026-04-12T14:32:00.000Z';
  return {
    id,
    userId,
    category: 'POTHOLE',
    title,
    description: `Descrição de ${title}`,
    latitude: -23.025,
    longitude: -43.465,
    address: 'Rio de Janeiro - RJ',
    status,
    createdAt,
    updatedAt: createdAt,
    history: [{
      id: `${id}-created`,
      incidentId: id,
      newStatus: 'PENDING',
      changedBy: userId,
      changedAt: createdAt,
      eventType: 'CREATED',
    }],
  };
}

function setup() {
  const ownedPending = makeIncident('BRA-0001', 'Buraco pendente', 'citizen-1', 'PENDING');
  const ownedInProgress = makeIncident('BRA-0002', 'Buraco em análise', 'citizen-1', 'IN_PROGRESS');
  const otherPending = makeIncident('BRA-0003', 'Ocorrência alheia', 'citizen-2', 'PENDING');
  const incidents = [ownedPending, ownedInProgress, otherPending];
  const updateOwnPending = vi.fn().mockResolvedValue(ownedPending);
  const cancelOwnPending = vi.fn().mockResolvedValue({
    ...ownedPending,
    status: 'CANCELLED',
  });

  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'citizen-1', email: 'ana@example.com' },
    profile: {
      id: 'citizen-1',
      email: 'ana@example.com',
      fullName: 'Ana Silva',
      role: 'CITIZEN',
    },
    loading: false,
    error: null,
    isAdmin: false,
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue({ needsEmailConfirmation: false }),
    signOut: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
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
    create: vi.fn().mockResolvedValue(ownedPending),
    updateStatus: vi.fn(),
    updateOwnPending,
    cancelOwnPending,
  });

  render(
    <MemoryRouter>
      <MyIncidentsPage />
    </MemoryRouter>,
  );
  return { updateOwnPending, cancelOwnPending };
}

describe('minhas ocorrências', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite editar categoria, título e descrição apenas em ocorrência pendente própria', async () => {
    const { updateOwnPending } = setup();
    const user = userEvent.setup();

    expect(screen.queryByText('Ocorrência alheia')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar Buraco em análise' }))
      .not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar Buraco pendente' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar ocorrência' });
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'STREETLIGHT');
    await user.clear(within(dialog).getByLabelText('Título'));
    await user.type(within(dialog).getByLabelText('Título'), 'Poste apagado');
    await user.clear(within(dialog).getByLabelText('Descrição'));
    await user.type(within(dialog).getByLabelText('Descrição'), 'A luminária não funciona.');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(updateOwnPending).toHaveBeenCalledWith('BRA-0001', {
      category: 'STREETLIGHT',
      title: 'Poste apagado',
      description: 'A luminária não funciona.',
    });
    expect(await screen.findByRole('status'))
      .toHaveTextContent('Ocorrência atualizada com sucesso.');
  });

  it('solicita confirmação e cancela preservando a ocorrência', async () => {
    const { cancelOwnPending } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cancelar Buraco pendente' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Confirmar cancelamento?' });
    expect(within(dialog).getByText(/registro e o histórico serão preservados/))
      .toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(cancelOwnPending).toHaveBeenCalledWith('BRA-0001');
    expect(await screen.findByRole('status'))
      .toHaveTextContent('Ocorrência cancelada. O registro e o histórico foram preservados.');
  });
});
