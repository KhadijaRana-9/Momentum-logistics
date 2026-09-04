import { api } from '@/lib/apiClient';
import type {
  AnalyticsSummary,
  Lead,
  LeadDetailResponse,
  LeadListResponse,
  Followup,
  TeamMember,
} from './types';

export interface LeadQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  temperature?: string;
  product?: string;
  source?: string;
  industry?: string;
  tag?: string;
  assignedTo?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  archived?: string;
}

export const crmApi = {
  listLeads: (query: LeadQuery, signal?: AbortSignal) =>
    api.get<LeadListResponse>('/leads', query as Record<string, string | number | undefined>, signal),

  getLead: (id: string, signal?: AbortSignal) => api.get<LeadDetailResponse>(`/leads/${id}`, undefined, signal),

  createLead: (body: Record<string, unknown>) => api.post<{ lead: Lead; deduplicated: boolean }>('/leads', body),

  updateLead: (id: string, body: Record<string, unknown>) => api.patch<{ lead: Lead }>(`/leads/${id}`, body),

  archiveLead: (id: string) => api.del<{ ok: boolean }>(`/leads/${id}`),

  assignLead: (id: string, userId: string | null) => api.post<{ lead: Lead }>(`/leads/${id}?action=assign`, { userId }),

  setStatus: (id: string, status: string, reason?: string) =>
    api.post<{ lead: Lead }>(`/leads/${id}?action=status`, { status, reason }),

  addNote: (id: string, note: string) => api.post<{ notesCount: number }>(`/leads/${id}?action=notes`, { note }),

  listFollowups: (query: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    api.get<{ items: Followup[]; total: number }>('/followups', query, signal),

  createFollowup: (body: Record<string, unknown>) => api.post<{ followup: Followup }>('/followups', body),

  updateFollowup: (id: string, body: Record<string, unknown>) =>
    api.patch<{ followup: Partial<Followup> }>(`/followups/${id}`, body),

  analytics: (days: number, signal?: AbortSignal) =>
    api.get<AnalyticsSummary>('/analytics', { days }, signal),

  team: (signal?: AbortSignal) => api.get<{ items: TeamMember[] }>('/users', undefined, signal),
};
