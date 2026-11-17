import type { IncidentStatus } from '../../types';
export const statusLabel:Record<IncidentStatus,string>={PENDING:'Pendente',IN_PROGRESS:'Em andamento',RESOLVED:'Resolvido',CANCELLED:'Cancelada'};
export function StatusBadge({status}:{status:IncidentStatus}){return <span className={`badge status-${status.toLowerCase()}`}><i/>{statusLabel[status]}</span>}
