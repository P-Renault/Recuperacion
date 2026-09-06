-- ============================================================
-- MI RECUPERACIÓN v2 - SUPABASE
-- Ejecutar completo en Supabase > SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mood smallint not null check (mood between 1 and 5),
  anxiety smallint not null default 0 check (anxiety between 0 and 10),
  craving smallint not null default 0 check (craving between 0 and 10),
  thoughts text,
  trigger text,
  healthy_action text,
  created_at timestamptz not null default now()
);

create unique index if not exists mood_entries_date_uidx
on public.mood_entries(date);

alter table public.mood_entries enable row level security;

-- Para una aplicación personal sin autenticación, estas políticas permiten
-- guardar/consultar las fichas desde el navegador usando la clave anon.
-- Si después agregas login, reemplázalas por políticas basadas en auth.uid().
drop policy if exists "mood public insert" on public.mood_entries;
drop policy if exists "mood public select" on public.mood_entries;
drop policy if exists "mood public update" on public.mood_entries;

create policy "mood public insert"
on public.mood_entries for insert
to anon
with check (true);

create policy "mood public select"
on public.mood_entries for select
to anon
using (true);

create policy "mood public update"
on public.mood_entries for update
to anon
using (true)
with check (true);

-- Verificación
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='mood_entries'
order by ordinal_position;
