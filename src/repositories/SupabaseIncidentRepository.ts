import type { SupabaseClient } from '@supabase/supabase-js';
import type { IncidentHistoryRow, IncidentWithHistoryRow } from '../lib/database.types';
import { getSupabaseClient } from '../lib/supabase';
import type { Incident, IncidentHistory, IncidentInput, IncidentStatus } from '../types';
import type { IncidentRepository } from './IncidentRepository';

export function mapHistory(row: IncidentHistoryRow): IncidentHistory {
  return {
    id: row.id,
    incidentId: row.incident_id,
    previousStatus: row.previous_status ?? undefined,
    newStatus: row.new_status,
    changedBy: row.changed_by ?? 'Sistema',
    changedAt: row.changed_at,
  };
}

export function mapIncident(row: IncidentWithHistoryRow, signedPhotoUrl?: string): Incident {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? undefined,
    status: row.status,
    photoUrl: signedPhotoUrl ?? row.photo_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.incident_history ?? [])
      .map(mapHistory)
      .sort((a, b) => a.changedAt.localeCompare(b.changedAt)),
  };
}

function errorMessage(operation: string, message: string): Error {
  return new Error(`Não foi possível ${operation}: ${message}`);
}

export class SupabaseIncidentRepository implements IncidentRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = getSupabaseClient()) {
    this.client = client;
  }

  async list(): Promise<Incident[]> {
    const { data, error } = await this.client
      .from('incidents')
      .select('*, incident_history(*)')
      .order('created_at', { ascending: false });

    if (error) throw errorMessage('carregar as ocorrências', error.message);
    return this.mapRowsWithSignedPhotos((data ?? []) as IncidentWithHistoryRow[]);
  }

  async create(input: IncidentInput): Promise<Incident> {
    const user = await this.requireUser();
    let photoPath: string | null = null;
    let transactionCommitted = false;
    try {
      if (input.photoFile) photoPath = await this.uploadPhoto(user.id, input.photoFile);
      const { data, error } = await this.client.rpc('create_incident_with_scene', {
        p_category: input.category,
        p_title: input.title,
        p_description: input.description,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
        p_address: input.address ?? null,
        p_photo_path: photoPath,
      });
      if (error) throw errorMessage('registrar a ocorrência', error.message);
      transactionCommitted = true;
      return this.getById(data as string);
    } catch (error) {
      if (photoPath && !transactionCommitted) await this.removeAbandonedPhoto(photoPath);
      throw error;
    }
  }

  async updateStatus(id: string, status: IncidentStatus, changedBy: string): Promise<Incident> {
    void changedBy; // A RPC identifica o responsável por meio de auth.uid().
    await this.requireUser();
    const { error } = await this.client.rpc('update_incident_status', {
      p_incident_id: id,
      p_new_status: status,
    });
    if (error) throw errorMessage('atualizar o status', error.message);
    return this.getById(id);
  }

  private async getById(id: string): Promise<Incident> {
    const { data, error } = await this.client
      .from('incidents')
      .select('*, incident_history(*)')
      .eq('id', id)
      .single();

    if (error) throw errorMessage('carregar a ocorrência', error.message);
    const [incident] = await this.mapRowsWithSignedPhotos([data as IncidentWithHistoryRow]);
    return incident;
  }

  private async mapRowsWithSignedPhotos(rows: IncidentWithHistoryRow[]): Promise<Incident[]> {
    const paths = rows.map(row => row.photo_path).filter((path): path is string => Boolean(path));
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data, error } = await this.client.storage.from('incident-photos').createSignedUrls(paths, 3600);
      if (!error) {
        data?.forEach((item) => {
          if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
        });
      }
    }
    return rows.map(row => mapIncident(row, row.photo_path ? urls.get(row.photo_path) : undefined));
  }

  private async uploadPhoto(userId: string, file: File): Promise<string> {
    const allowed = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
    const extension = allowed.get(file.type);
    if (!extension) throw new Error('A foto deve estar em formato JPG, PNG ou WebP.');
    if (file.size > 5 * 1024 * 1024) throw new Error('A foto deve ter no máximo 5 MB.');
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await this.client.storage.from('incident-photos').upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw errorMessage('enviar a foto', error.message);
    return path;
  }

  private async removeAbandonedPhoto(path: string): Promise<void> {
    const { error } = await this.client.storage.from('incident-photos').remove([path]);
    if (error) console.error('Falha ao remover foto abandonada:', error.message);
  }

  private async requireUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw new Error('É necessário entrar na plataforma antes de salvar dados no Supabase.');
    }
    return data.user;
  }
}
