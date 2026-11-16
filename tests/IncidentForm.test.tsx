import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IncidentForm } from '../src/components/incidents/IncidentForm';

describe('fluxo do formulário de ocorrência', () => {
  it('envia coordenadas e impede reenvio durante o salvamento', async () => {
    let finish: (() => void) | undefined;
    const onSubmit = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const user = userEvent.setup();
    render(<IncidentForm coords={{ lat: -23.025, lng: -43.465 }} onCancel={vi.fn()} onSubmit={onSubmit}/>);
    await user.type(screen.getByPlaceholderText(/Poste apagado/), 'Poste sem luz');
    await user.type(screen.getByPlaceholderText(/Descreva o problema/), 'O trecho está escuro há vários dias.');
    await user.click(screen.getByRole('button', { name: /Publicar ocorrência/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ latitude: -23.025, longitude: -43.465, category: 'STREETLIGHT' });
    expect(screen.getByRole('button', { name: /Publicando/ })).toBeDisabled();
    finish?.();
  });
});
