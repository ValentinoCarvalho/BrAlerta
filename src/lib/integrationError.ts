export type IntegrationErrorCode = 'NETWORK' | 'AUTH' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION' | 'UNKNOWN';

export class IntegrationError extends Error {
  constructor(message: string, public readonly code: IntegrationErrorCode, public readonly retryable = false) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export function normalizeIntegrationError(error: unknown, fallback = 'Não foi possível concluir a operação.'): IntegrationError {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const text = raw.toLowerCase();
  if (text.includes('failed to fetch') || text.includes('network') || text.includes('timeout') || text.includes('load failed')) {
    return new IntegrationError('Sem conexão com o servidor. Verifique sua internet e tente novamente.', 'NETWORK', true);
  }
  if (text.includes('jwt') || text.includes('authentication') || text.includes('sessão') || text.includes('entrar')) {
    return new IntegrationError('Sua sessão expirou. Entre novamente para continuar.', 'AUTH');
  }
  if (text.includes('permission') || text.includes('policy') || text.includes('row-level security') || text.includes('administrador')) {
    return new IntegrationError('Você não possui permissão para realizar esta ação.', 'FORBIDDEN');
  }
  if (text.includes('duplicate') || text.includes('already exists') || text.includes('unique')) {
    return new IntegrationError('Este registro já existe ou foi enviado anteriormente.', 'CONFLICT');
  }
  if (text.includes('invalid') || text.includes('check constraint') || text.includes('formato')) {
    return new IntegrationError('Os dados enviados são inválidos. Revise as informações e tente novamente.', 'VALIDATION');
  }
  return new IntegrationError(raw || fallback, 'UNKNOWN');
}
