import { api } from '@/lib/apiClient';

export const RRR_STATUSES = ['Draft', 'Submitted', 'Approved', 'Assigned', 'Job Created', 'Dispatched', 'Completed', 'Rejected'] as const;
export type RrrStatus = (typeof RRR_STATUSES)[number];

export const RRR_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type RrrPriority = (typeof RRR_PRIORITIES)[number];

export interface Rrr {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  department: string | null;
  vehicleType: string;
  driverRequired: boolean;
  numberOfVehicles: number;
  pickup: string;
  destination: string;
  route: string | null;
  loadingInfo: string | null;
  unloadingInfo: string | null;
  requiredDate: string;
  priority: RrrPriority;
  specialInstructions: string | null;
  contractRef: string | null;
  status: RrrStatus;
  assignedVehicleRef: string | null;
  assignedDriverRef: string | null;
  jobRef: string | null;
  requestedBy: string;
  requestedByName: string;
  approvedByName: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RrrCustomer {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  contactName: string | null;
  contractType: string | null;
}

export interface RrrListResponse {
  items: Rrr[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const rrrApi = {
  list: (query: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    api.get<RrrListResponse>('/rrr', query, signal),

  get: (id: string, signal?: AbortSignal) => api.get<{ rrr: Rrr }>(`/rrr/${id}`, undefined, signal),

  create: (body: Record<string, unknown>) => api.post<{ rrr: Rrr }>('/rrr', body),

  update: (id: string, body: Record<string, unknown>) => api.patch<{ rrr: Rrr }>(`/rrr/${id}`, body),

  setStatus: (id: string, status: RrrStatus, reason?: string) =>
    api.post<{ rrr: Rrr }>(`/rrr/${id}?action=status`, { status, reason }),

  customers: (signal?: AbortSignal) => api.get<{ items: RrrCustomer[] }>('/rrr', { resource: 'customers' }, signal),

  createCustomer: (body: Record<string, unknown>) =>
    api.post<{ customer: RrrCustomer }>('/rrr?resource=customer', body),
};
