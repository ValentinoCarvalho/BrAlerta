import { seedIncidents, DEMO_USER_ID } from '../data/seed';
import type { Incident, IncidentInput, IncidentStatus } from '../types';
import type { IncidentRepository } from './IncidentRepository';
const KEY='br-alerta-incidents-v1';
const read=():Incident[]=>{ const raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw) as Incident[]; localStorage.setItem(KEY,JSON.stringify(seedIncidents)); return seedIncidents; };
const write=(v:Incident[])=>localStorage.setItem(KEY,JSON.stringify(v));
export class MockIncidentRepository implements IncidentRepository {
 async list(){ return read(); }
 async create(input:IncidentInput){ const now=new Date().toISOString(); const incident:Incident={...input,id:`BRA-${crypto.randomUUID().slice(0,8).toUpperCase()}`,userId:DEMO_USER_ID,status:'PENDING',createdAt:now,updatedAt:now,history:[]}; incident.history=[{id:crypto.randomUUID(),incidentId:incident.id,newStatus:'PENDING',changedBy:'Cidadão demonstrativo',changedAt:now}]; const items=[incident,...read()]; write(items); return incident; }
 async updateStatus(id:string,status:IncidentStatus,changedBy:string){ const items=read(); const index=items.findIndex(i=>i.id===id); if(index<0) throw new Error('Ocorrência não encontrada.'); const old=items[index]; const now=new Date().toISOString(); const updated:Incident={...old,status,updatedAt:now,history:[...old.history,{id:crypto.randomUUID(),incidentId:id,previousStatus:old.status,newStatus:status,changedBy,changedAt:now}]}; items[index]=updated; write(items); return updated; }
}
