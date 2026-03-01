import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UpdatePasswordPayload,
  UserProfile,
  DashboardStats,
  NutritionLog,
  NutritionLogPayload,
  Vaccine,
  VaccinePayload,
  Teleconsult,
  TeleconsultPayload,
  TeleconsultStatus,
  HealthRecord,
  RecordPayload,
  MintPayload,
  MintResponse,
  CheckPayload,
  CheckResponse,
  AiChatPayload,
  AiChatResponse,
  FastingPlan,
  FastingPlanPayload,
  FastingLog,
  FastingLogPayload,
  DoctorSummary,
} from '@/types/api';

const BASE = (import.meta.env.VITE_API_URL as string) ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nutriid_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      try {
        errMsg = await res.text() || errMsg;
      } catch { /* ignore */ }
    }
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () =>
    request<UserProfile>('/api/auth/me'),

  updateMe: (payload: UpdateProfilePayload) =>
    request<UserProfile>('/api/auth/me/update', { method: 'PUT', body: JSON.stringify(payload) }),

  updatePassword: (payload: UpdatePasswordPayload) =>
    request<{ message: string }>('/api/auth/me/password', { method: 'PUT', body: JSON.stringify(payload) }),

  forgotPassword: (email: string) =>
    request<{ message: string; reset_token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  getDashboard: () =>
    request<DashboardStats>('/api/dashboard'),

  // ─── Nutrition ────────────────────────────────────────────────────────────
  getNutrition: () =>
    request<NutritionLog[]>('/api/nutrition'),

  postNutrition: (payload: NutritionLogPayload) =>
    request<NutritionLog>('/api/nutrition', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── Vaccines ─────────────────────────────────────────────────────────────
  getVaccines: () =>
    request<Vaccine[]>('/api/vaccines'),

  postVaccine: (payload: VaccinePayload) =>
    request<Vaccine>('/api/vaccines', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── Teleconsults ─────────────────────────────────────────────────────────
  getTeleconsults: () =>
    request<Teleconsult[]>('/api/teleconsults'),

  postTeleconsult: (payload: TeleconsultPayload) =>
    request<Teleconsult>('/api/teleconsults', { method: 'POST', body: JSON.stringify(payload) }),

  updateTeleconsultStatus: (id: string, status: TeleconsultStatus) =>
    request<Teleconsult>(`/api/teleconsults/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // ─── Records ──────────────────────────────────────────────────────────────
  getRecords: () =>
    request<HealthRecord[]>('/api/records'),

  postRecord: (payload: RecordPayload) =>
    request<HealthRecord>('/api/records', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── Blockchain ───────────────────────────────────────────────────────────
  mintSBT: (payload: MintPayload) =>
    request<MintResponse>('/api/blockchain/mint', { method: 'POST', body: JSON.stringify(payload) }),

  checkSBT: (payload: CheckPayload) =>
    request<CheckResponse>('/api/blockchain/check', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── AI Chat ──────────────────────────────────────────────────────────────
  chat: (payload: AiChatPayload) =>
    request<AiChatResponse>('/api/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── Doctor ───────────────────────────────────────────────────────────────
  getDoctors: () =>
    request<DoctorSummary[]>('/api/doctor/list'),

  getDoctorTeleconsults: () =>
    request<Teleconsult[]>('/api/doctor/teleconsults'),

  updateDoctorTeleconsultStatus: (id: string, payload: { status: TeleconsultStatus; meeting_link?: string | null; notes?: string | null }) =>
    request<Teleconsult>(`/api/doctor/teleconsults/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ─── Fasting ──────────────────────────────────────────────────────────────
  getFastingPlans: () =>
    request<FastingPlan[]>('/api/fasting/plans'),

  postFastingPlan: (payload: FastingPlanPayload) =>
    request<FastingPlan>('/api/fasting/plans', { method: 'POST', body: JSON.stringify(payload) }),

  getFastingLogs: (planId: string) =>
    request<FastingLog[]>(`/api/fasting/plans/${planId}/logs`),

  postFastingLog: (planId: string, payload: FastingLogPayload) =>
    request<FastingLog>(`/api/fasting/plans/${planId}/logs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
