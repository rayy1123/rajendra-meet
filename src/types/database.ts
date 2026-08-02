export type UserRole = 'super_admin' | 'event_admin' | 'operator' | 'viewer';
export type GenderType = 'male' | 'female';
export type ResultStatus = 'finished' | 'dns' | 'dnf' | 'dq' | 'scr';

export interface Event {
  id: string;
  name: string;
  logo_url?: string;
  organizer: string;
  location: string;
  start_date: string;
  end_date: string;
  description?: string;
  pool_type: string;
  pool_length_meters: number;
  lane_count: number;
  created_at?: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  province: string;
  coach_name?: string;
  created_at?: string;
}

export interface Athlete {
  id: string;
  athlete_number: string;
  full_name: string;
  gender: GenderType;
  birth_date: string;
  grade_level: string;
  class_name: string;
  age_group: string;
  school_id?: string;
  photo_url?: string;
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
  time_ms?: number;
  status: ResultStatus;
  created_at?: string;
  updated_at?: string;
}

export interface RajendraRecord {
  id: string;
  competition_event_id?: string;
  athlete_id?: string;
  school_id?: string;
  time_ms: number;
  event_year: number;
  is_active: boolean;
  created_at?: string;
}
