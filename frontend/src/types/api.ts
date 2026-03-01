// ─── Auth ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  national_id: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight: number | null;
  height: number | null;
  allergies: string | null;
  emergency_contact: string | null;
  role: string;
  cmu_active: boolean;
  cmu_expiry_date: string | null;
  religion: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  blood_type: string;
  national_id?: string;
  role: 'PATIENT';
}

export interface UpdateProfilePayload {
  full_name?: string;
  national_id?: string;
  blood_type?: string;
  date_of_birth?: string;
  sex?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  emergency_contact?: string;
  religion?: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  record_count: number;
  calories_today: number;
  cmu_active: boolean;
  last_meal: string | null;
  nutrition_logs_today: number;
}

// ─── Nutrition ───────────────────────────────────────────────────────────────

export interface NutritionLog {
  id: string;
  meal_name: string;
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
  logged_at: string;
}

export interface NutritionLogPayload {
  meal_name: string;
  proteins: number;
  carbs: number;
  fats: number;
}

// ─── Vaccines ────────────────────────────────────────────────────────────────

export interface Vaccine {
  id: string;
  vaccine_name: string;
  dose: string;
  administered_at: string;
  facility_name: string | null;
  next_dose_at: string | null;
  created_at: string;
}

export interface VaccinePayload {
  vaccine_name: string;
  dose: string;
  administered_at: string;
  facility_name?: string | null;
  next_dose_at?: string | null;
}

// ─── Teleconsult ─────────────────────────────────────────────────────────────

export type TeleconsultStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';

export interface Teleconsult {
  id: string;
  doctor_id: string | null;
  scheduled_at: string;
  notes: string | null;
  status: TeleconsultStatus;
  created_at: string;
}

export interface TeleconsultPayload {
  doctor_id?: string | null;
  scheduled_at: string;
  notes?: string | null;
}

// ─── Health Records ───────────────────────────────────────────────────────────

export type RecordType =
  | 'ORDONNANCE'
  | 'RÉSULTATS_EXAMEN'
  | 'CONSULTATION'
  | 'VACCINATION'
  | 'AUTRE';

export interface HealthRecord {
  id: string;
  patient_id: string;
  record_type: RecordType;
  ipfs_cid: string;
  document_hash: string;
  created_at: string;
}

export interface RecordPayload {
  record_type: RecordType;
  ipfs_cid: string;
  document_hash: string;
}

// ─── Blockchain ───────────────────────────────────────────────────────────────

export interface MintPayload {
  wallet_address: string;
  nip: string;
}

export interface MintResponse {
  success: boolean;
  data?: {
    tx_hash: string;
    token_id: number;
    recipient: string;
  };
  error?: string;
}

export interface CheckPayload {
  wallet_address: string;
}

export interface CheckResponse {
  has_health_id: boolean;
  token_id?: number;
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface AiChatPayload {
  message: string;
  history: AiMessage[];
  context?: string;
}

export interface AiChatResponse {
  response: string;
}

// ─── Fasting ─────────────────────────────────────────────────────────────────

export type FastType = 'lent' | 'ramadan' | 'daniel' | 'intermittent' | 'custom';
export type LogStatus = 'success' | 'skipped';

export interface FastingPlan {
  id: string;
  fast_type: FastType;
  title: string | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
}

export interface FastingLog {
  id: string;
  plan_id: string;
  date: string;
  status: LogStatus;
  notes: string | null;
}

export interface FastingPlanPayload {
  fast_type: FastType;
  title?: string | null;
  start_date: string;
  end_date?: string | null;
}

export interface FastingLogPayload {
  date: string;
  status: LogStatus;
  notes?: string | null;
}
