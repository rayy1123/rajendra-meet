/**
 * Tipe domain SCMS — selaras dengan supabase/migrations/0001_init.sql.
 * Jika skema DB berubah, perbarui file ini.
 */

export type UserRole = 'super_admin' | 'event_admin' | 'operator' | 'viewer';
export type GenderType = 'male' | 'female';
export type ResultStatus = 'finished' | 'dns' | 'dnf' | 'dq' | 'scr';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface Series {
  id: string;
  name: string;
  year: number;
  created_at?: string;
}

export interface Event {
  id: string;
  series_id?: string | null;
  name: string;
  logo_url?: string | null;
  organizer: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  pool_type: string;
  pool_length_meters: number;
  lane_count: number;
  pool_count: number;
  is_published: boolean;
  created_at?: string;
}

export interface EventAdmin {
  event_id: string;
  user_id: string;
  created_at?: string;
}

/**
 * Aturan Kelompok Umur — dapat diubah panitia lewat Settings.
 * Rentang tanggal lahir bersifat inklusif; null berarti tanpa batas.
 * Contoh "KU 1 = kelahiran 2008 ke atas":
 *   birth_date_from = null, birth_date_to = '2008-12-31'
 */
export interface AgeGroupRuleRow {
  id: string;
  event_id: string;
  code: string;
  label: string;
  birth_date_from: string | null;
  birth_date_to: string | null;
  gender: GenderType | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  province: string;
  coach_name?: string | null;
  created_at?: string;
}

export interface Athlete {
  id: string;
  event_id?: string | null;
  athlete_number: string;
  full_name: string;
  gender: GenderType;
  birth_date: string;
  grade_level: string;
  class_name: string;
  /** Diisi otomatis dari birth_date via age_group_rules. */
  age_group: string;
  school_id?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface CompetitionEvent {
  id: string;
  event_id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: GenderType;
  grade_level: string;
  class_name: string;
  age_group: string;
  session_no: number;
  order_no: number;
  created_at?: string;
}

export interface Registration {
  id: string;
  event_id: string;
  athlete_id: string;
  competition_event_id: string;
  seed_time_ms: number;
  created_at?: string;
}

export interface Heat {
  id: string;
  competition_event_id: string;
  heat_number: number;
  created_at?: string;
}

export interface HeatAssignment {
  id: string;
  heat_id: string;
  registration_id: string;
  lane_number: number;
  created_at?: string;
}

export interface Result {
  id: string;
  heat_assignment_id: string;
  /** null untuk status selain 'finished'. */
  time_ms: number | null;
  status: ResultStatus;
  is_new_record: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PointRule {
  id: string;
  event_id: string;
  rank: number;
  points: number;
  created_at?: string;
}

export interface TieBreakRule {
  event_id: string;
  ordered: string[];
  updated_at?: string;
}

export interface RajendraRecord {
  id: string;
  competition_event_id?: string | null;
  record_key: string;
  athlete_id?: string | null;
  school_id?: string | null;
  time_ms: number;
  event_year: number;
  is_active: boolean;
  created_at?: string;
}

export interface SystemConfig {
  id: string;
  event_id?: string | null;
  key: string;
  value: Record<string, unknown>;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload: Record<string, unknown>;
  created_at?: string;
}
