-- ============================================================
-- RLS v5.4 — ejecutar después de crear las tablas
-- ============================================================

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_risk_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_kit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_entries_all" ON public.mood_entries;
CREATE POLICY "mood_entries_all" ON public.mood_entries FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mood_medications_all" ON public.mood_medications;
CREATE POLICY "mood_medications_all" ON public.mood_medications FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mood_medication_logs_all" ON public.mood_medication_logs;
CREATE POLICY "mood_medication_logs_all" ON public.mood_medication_logs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_all" ON public.habits;
CREATE POLICY "habits_all" ON public.habits FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habit_daily_all" ON public.habit_daily;
CREATE POLICY "habit_daily_all" ON public.habit_daily FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_routines_all" ON public.daily_routines;
CREATE POLICY "daily_routines_all" ON public.daily_routines FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "personal_commitments_all" ON public.personal_commitments;
CREATE POLICY "personal_commitments_all" ON public.personal_commitments FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_risk_logs_all" ON public.daily_risk_logs;
CREATE POLICY "daily_risk_logs_all" ON public.daily_risk_logs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "emergency_kit_all" ON public.emergency_kit;
CREATE POLICY "emergency_kit_all" ON public.emergency_kit FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
