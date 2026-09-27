-- =====================================================================
-- SCMS — 0026 High-Scale Performance Indexes (1500+ Athletes Capacity)
-- Memastikan query ribuan entri, live scoreboard, dan heat assignments
-- berjalan sub-milidetik (<5ms) tanpa table scan penuh.
-- =====================================================================

-- 1. Optimasi Registrasi & Nomor Perlombaan
CREATE INDEX IF NOT EXISTS idx_registrations_event_athlete_comp
  ON public.registrations(event_id, athlete_id, competition_event_id);

CREATE INDEX IF NOT EXISTS idx_registrations_athlete_id
  ON public.registrations(athlete_id);

CREATE INDEX IF NOT EXISTS idx_competition_events_event_order
  ON public.competition_events(event_id, order_no ASC);

-- 2. Optimasi Seeding, Heats & Lane Assignments
CREATE INDEX IF NOT EXISTS idx_heats_comp_event_heat_num
  ON public.heats(competition_event_id, heat_number ASC);

CREATE INDEX IF NOT EXISTS idx_heat_assignments_heat_lane
  ON public.heat_assignments(heat_id, lane_number ASC);

CREATE INDEX IF NOT EXISTS idx_heat_assignments_reg_id
  ON public.heat_assignments(registration_id);

-- 3. Optimasi Hasil Waktu Tempuh & Scoreboard
CREATE INDEX IF NOT EXISTS idx_results_assignment_status_time
  ON public.results(heat_assignment_id, status, time_ms ASC)
  WHERE status = 'finished';

CREATE INDEX IF NOT EXISTS idx_results_time_ms_asc
  ON public.results(time_ms ASC)
  WHERE time_ms IS NOT NULL;

-- 4. Optimasi Master Atlet & Kontingen Klub
CREATE INDEX IF NOT EXISTS idx_athletes_owner_id
  ON public.athletes(owner_id)
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_school_id
  ON public.athletes(school_id)
  WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_gender_birth_date
  ON public.athletes(gender, birth_date);

-- 5. Optimasi Verifikasi Pembayaran & Tagihan
CREATE INDEX IF NOT EXISTS idx_payment_verifications_reg_status
  ON public.payment_verifications(registration_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_pending
  ON public.payment_verifications(status)
  WHERE status = 'pending';
