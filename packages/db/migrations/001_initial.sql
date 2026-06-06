-- Always on Shelf — initial schema
-- Run this against your Supabase project before starting development.

create extension if not exists "uuid-ossp";

-- ============================================================
-- recordings: raw event streams from teach mode
-- ============================================================
create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  events jsonb not null default '[]',
  audio_transcript text,
  screenshots_path text,
  duration_ms int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- playbooks: learned process recipes (extracted from recordings)
-- ============================================================
create table if not exists playbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  intent text not null,
  target_url text not null,
  steps jsonb not null,
  parameters jsonb not null default '[]',
  recording_id uuid references recordings(id) on delete set null,
  version int not null default 1,
  created_at timestamptz not null default now()
);

-- ============================================================
-- executions: log of every playbook run
-- ============================================================
create table if not exists executions (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references playbooks(id) on delete cascade,
  parameters jsonb not null default '{}',
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed')),
  current_step_index int not null default 0,
  logs jsonb not null default '[]',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- ============================================================
-- indexes
-- ============================================================
create index if not exists idx_playbooks_created_at on playbooks (created_at desc);
create index if not exists idx_executions_playbook_id on executions (playbook_id);
create index if not exists idx_executions_status on executions (status);
create index if not exists idx_recordings_created_at on recordings (created_at desc);

-- ============================================================
-- storage buckets (run via Supabase dashboard if SQL is restricted)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false);
-- insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', false);
