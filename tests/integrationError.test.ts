import { describe, expect, it } from 'vitest';
import { normalizeIntegrationError } from '../src/lib/integrationError';

describe('normalizeIntegrationError', () => {
  it('traduz falhas de rede e permite retry', () => {
    const result = normalizeIntegrationError(new TypeError('Failed to fetch'));
    expect(result.code).toBe('NETWORK');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('Sem conexão');
  });

  it('distingue falhas de autorização', () => {
    const result = normalizeIntegrationError(new Error('new row violates row-level security policy'));
    expect(result.code).toBe('FORBIDDEN');
    expect(result.message).toContain('permissão');
  });
});
