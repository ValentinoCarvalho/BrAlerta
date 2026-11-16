import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Stats } from '../components/dashboard/Stats';
import { StatusBadge } from '../components/incidents/StatusBadge';
import { useIncidents } from '../context/IncidentsContext';
import type { Incident, IncidentStatus } from '../types';

export function AdminPage() {
  const { incidents, updateStatus } = useIncidents();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Incident | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const list = useMemo(() => incidents.filter(item => `${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())), [incidents, query]);

  async function change(status: IncidentStatus) {
    if (!selected || saving || selected.status === status) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateStatus(selected.id, status);
      setSelected(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar o status.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="page"><div className="page-heading"><div><span className="eyebrow">GESTÃO DE OCORRÊNCIAS</span><h1>Painel administrativo</h1><p>Área protegida para triagem e acompanhamento das ocorrências.</p></div><span className="role-pill">Perfil: Administrador</span></div><Stats items={incidents}/><section className="content-card"><div className="table-tools"><div><h2>Gestão de ocorrências</h2><span>Selecione um registro para atualizar o status</span></div><label className="admin-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por título ou ID"/></label></div><div className="admin-layout"><div className="table-scroll"><table><thead><tr><th>ID / Título</th><th>Categoria</th><th>Status</th><th>Localização</th></tr></thead><tbody>{list.map(item=><tr key={item.id} onClick={()=>setSelected(item)} className={selected?.id===item.id?'row-selected':''}><td><small>{item.id}</small><b>{item.title}</b></td><td>{item.category==='STREETLIGHT'?'💡 Iluminação':'⚠️ Pavimento'}</td><td><StatusBadge status={item.status}/></td><td>Recreio, RJ</td></tr>)}</tbody></table></div><aside className="admin-detail">{selected?<><span className="eyebrow">ATUALIZAR REGISTRO</span><h3>{selected.title}</h3><p>{selected.description}</p><label>Status<select value={selected.status} disabled={saving} onChange={e=>void change(e.target.value as IncidentStatus)}><option value="PENDING">Pendente</option><option value="IN_PROGRESS">Em andamento</option><option value="RESOLVED">Resolvido</option></select></label>{saving&&<div className="saving-state">Salvando alteração...</div>}{error&&<div className="auth-error">{error}</div>}<div className="admin-note">A mudança é registrada no histórico da ocorrência.</div></>:<div className="empty">Selecione uma ocorrência na tabela.</div>}</aside></div></section></div>;
}
