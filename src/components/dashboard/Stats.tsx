import { Ban, CheckCircle2, Clock3, LoaderCircle, MapPin } from 'lucide-react';
import type { Incident } from '../../types';

export function Stats({ items }: { items: Incident[] }) {
  const stats = [
    ['Total', items.length, MapPin, 'all'],
    ['Pendentes', items.filter((item) => item.status === 'PENDING').length, Clock3, 'pending'],
    ['Em andamento', items.filter((item) => item.status === 'IN_PROGRESS').length, LoaderCircle, 'progress'],
    ['Resolvidas', items.filter((item) => item.status === 'RESOLVED').length, CheckCircle2, 'resolved'],
    ['Canceladas', items.filter((item) => item.status === 'CANCELLED').length, Ban, 'cancelled'],
  ] as const;

  return (
    <div className="stats">
      {stats.map(([label, value, Icon, kind]) => (
        <div className="stat" key={label}>
          <div className={`stat-icon ${kind}`}><Icon /></div>
          <div><span>{label}</span><strong>{value}</strong></div>
        </div>
      ))}
    </div>
  );
}
