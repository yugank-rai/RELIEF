const API_BASE = 'http://localhost:4000/api';

export type UserRole = 'citizen' | 'volunteer' | 'authority' | 'resource_manager';

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  skills: string[];
  latitude?: number;
  longitude?: number;
  status: string;
};

export type Incident = {
  id: number;
  code: string;
  title: string;
  reporterId?: number;
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status: 'reported' | 'verified' | 'assigned' | 'in_progress' | 'contained' | 'resolved';
  reportCount: number;
  priorityScore: number;
  priorityBreakdown?: {
    totalScore: number;
    components: {
      severityScore: number;
      timeWaitingScore: number;
      vulnerabilityScore: number;
      resourceUrgencyScore: number;
      reportCountScore: number;
    };
    weights: {
      severity: number;
      timeWaiting: number;
      vulnerability: number;
      resourceUrgency: number;
      reportCount: number;
    };
    normalizedFormula: string;
  };
  vulnerabilityScore?: number;
  resourceUrgencyScore?: number;
  trappedCount?: number;
  elderlyChildCount?: number;
  medicalEmergency?: boolean;
  assignedVolunteerId?: number;
  assignedTeamId?: number;
  unitsDeployed: number;
  icOfficer: string;
  evacuationZone?: string;
  estClearTime?: string;
  clientCreatedAt: string;
  serverReceivedAt: string;
  updatedAt: string;
  reports?: any[];
  assignedTeam?: any;
  assignedVolunteer?: any;
  activityLogs?: any[];
};

export type KPIStats = {
  activeIncidents: { count: number; subtitle: string };
  unitsDeployed: { count: number; subtitle: string };
  affectedPopulation: { count: string; subtitle: string };
  communityReports: { count: number; subtitle: string };
  systemStatus: {
    status: string;
    label: string;
    activeAlert: string;
    alertTotal: number;
    alertCurrent: number;
  };
};

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('relief_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: (body: any) => apiRequest<{ token: string; user: UserProfile }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    quickLogin: (role: string) => apiRequest<{ token: string; user: UserProfile }>('/auth/quick-login', { method: 'POST', body: JSON.stringify({ role }) }),
    register: (body: any) => apiRequest<{ token: string; user: UserProfile }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    googleLogin: (body: any) => apiRequest<{ token: string; user: UserProfile }>('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => apiRequest<{ user: UserProfile }>('/auth/me'),
  },

  // Incidents
  incidents: {
    getAll: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      return apiRequest<Incident[]>(`/incidents?${query.toString()}`);
    },
    getById: (id: string | number) => apiRequest<Incident>(`/incidents/${id}`),
    report: (data: any) => apiRequest<{ corroborated: boolean; incident?: Incident; canonicalIncident?: Incident; report: any; message: string }>('/incidents', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string | number, data: any) => apiRequest<{ success: boolean; incident: Incident }>(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    assign: (id: string | number, data: any) => apiRequest<{ success: boolean; incident: Incident }>(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
    getMatchingVolunteers: (id: string | number) => apiRequest<{ incident: any; candidates: any[] }>(`/incidents/${id}/matching-volunteers`),
  },

  // Resources
  resources: {
    getOverview: () => apiRequest<any>('/resources/overview'),
    updateStock: (id: number, data: any) => apiRequest<any>(`/resources/stock/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    allocate: (data: any) => apiRequest<any>('/resources/allocate', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Shelters
  shelters: {
    getAll: (lat?: number, lon?: number) => {
      const query = new URLSearchParams();
      if (lat !== undefined && lon !== undefined) {
        query.set('lat', String(lat));
        query.set('lon', String(lon));
      }
      return apiRequest<any[]>(`/shelters?${query.toString()}`);
    },
    update: (id: number, data: any) => apiRequest<any>(`/shelters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Volunteers
  volunteers: {
    getAll: (status?: string) => apiRequest<any[]>(`/volunteers${status ? `?status=${status}` : ''}`),
    getMyTasks: () => apiRequest<any>('/volunteers/my-tasks'),
    acceptTask: (incidentId: number | string) => apiRequest<any>(`/volunteers/accept-task/${incidentId}`, { method: 'POST' }),
    updateStatus: (data: any) => apiRequest<any>('/volunteers/status', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Analytics
  analytics: {
    getKPIs: () => apiRequest<KPIStats>('/analytics/kpis'),
    getCharts: () => apiRequest<any>('/analytics/charts'),
    getAuditLogs: () => apiRequest<any[]>('/analytics/audit-logs'),
  },
};
