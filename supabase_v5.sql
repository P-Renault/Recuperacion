CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.habits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL, unit text NOT NULL DEFAULT 'check', target numeric(10,2),
 active boolean NOT NULL DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.habit_daily(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE, entry_date date NOT NULL,
 value numeric(10,2), completed boolean NOT NULL DEFAULT false, detail text,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE(habit_id,entry_date));

CREATE TABLE IF NOT EXISTS public.personal_commitments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 commitment_date date NOT NULL, commitment_time time, title text NOT NULL, category text NOT NULL DEFAULT 'Personal',
 location text, notes text, completed boolean NOT NULL DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.daily_risk_logs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 entry_date date NOT NULL, thought text, situation text, trigger text, intensity integer CHECK(intensity BETWEEN 0 AND 10),
 response text, support_contacted boolean NOT NULL DEFAULT false, consumption_status text NOT NULL DEFAULT 'No tuve consumo',
 consumption_detail text, immediate_risk boolean NOT NULL DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.emergency_kit(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 item_type text NOT NULL DEFAULT 'paso', title text NOT NULL, content text, sort_order integer DEFAULT 0,
 active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_daily_user_date ON public.habit_daily(user_id,entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_commitments_user_date ON public.personal_commitments(user_id,commitment_date,commitment_time);
CREATE INDEX IF NOT EXISTS idx_risk_user_date ON public.daily_risk_logs(user_id,entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_user ON public.emergency_kit(user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_risk_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_kit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS habits_all ON public.habits;
CREATE POLICY habits_all ON public.habits FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS habit_daily_all ON public.habit_daily;
CREATE POLICY habit_daily_all ON public.habit_daily FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS commitments_all ON public.personal_commitments;
CREATE POLICY commitments_all ON public.personal_commitments FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS risk_all ON public.daily_risk_logs;
CREATE POLICY risk_all ON public.daily_risk_logs FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS emergency_all ON public.emergency_kit;
CREATE POLICY emergency_all ON public.emergency_kit FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);

SELECT table_name FROM information_schema.tables WHERE table_schema='public'
AND table_name IN('habits','habit_daily','personal_commitments','daily_risk_logs','emergency_kit')
ORDER BY table_name;

-- ============================================================
-- MIGRACIÓN v5.1 — MEDICAMENTOS EN LA CARTA DEL ÁNIMO
-- ============================================================
-- Si la versión anterior de la base de datos tiene una tabla
-- para registros diarios de ánimo, agrega el campo sin borrar datos.
-- La sentencia es segura aunque la columna ya exista.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'mood_daily'
    ) THEN
        ALTER TABLE public.mood_daily
        ADD COLUMN IF NOT EXISTS medications TEXT;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.mood_medications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, daily_dose TEXT, daily_quantity NUMERIC(10,2) NOT NULL DEFAULT 1, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.mood_medication_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, medication_id UUID REFERENCES public.mood_medications(id) ON DELETE CASCADE, entry_date DATE NOT NULL, taken BOOLEAN NOT NULL DEFAULT FALSE, quantity_taken NUMERIC(10,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(medication_id,entry_date));
CREATE INDEX IF NOT EXISTS idx_mood_medications_user ON public.mood_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_medication_logs_user_date ON public.mood_medication_logs(user_id,entry_date DESC);
ALTER TABLE public.mood_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_medication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mood_medications_all ON public.mood_medications;
CREATE POLICY mood_medications_all ON public.mood_medications FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS mood_medication_logs_all ON public.mood_medication_logs;
CREATE POLICY mood_medication_logs_all ON public.mood_medication_logs FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);


-- HORARIO DIARIO: INICIO + FIN
CREATE TABLE IF NOT EXISTS public.daily_routines (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, activity_date DATE, start_time TIME NOT NULL, end_time TIME NOT NULL, title TEXT NOT NULL, notes TEXT, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_daily_routines_user_date ON public.daily_routines(user_id,activity_date,start_time);
ALTER TABLE public.daily_routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_routines_all ON public.daily_routines;
CREATE POLICY daily_routines_all ON public.daily_routines FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
