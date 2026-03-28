-- =====================================================================
-- Messy — Initial Schema
-- Run against a Supabase project's SQL editor.
-- =====================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── interviews ──────────────────────────────────────────────────────

create table public.interviews (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  phase         text not null default 'person'
                  check (phase in ('person','offering','brand','assets','complete')),
  status        text not null default 'active'
                  check (status in ('active','completed','abandoned')),
  identity_document jsonb,
  language      text not null default 'en',
  gallery_opt_in boolean not null default false
);

alter table public.interviews enable row level security;

-- Public can create interviews (anonymous users)
create policy "Anyone can create interviews"
  on public.interviews for insert
  with check (true);

-- Anyone with the interview ID can read their own row
create policy "Anyone can read interviews"
  on public.interviews for select
  using (true);

-- Service role handles updates (API routes use service client)
create policy "Service can update interviews"
  on public.interviews for update
  using (true);

-- ─── messages ────────────────────────────────────────────────────────

create table public.messages (
  id            uuid primary key default uuid_generate_v4(),
  interview_id  uuid not null references public.interviews(id) on delete cascade,
  role          text not null check (role in ('user','assistant')),
  content       text not null,
  audio_url     text,
  input_mode    text not null default 'text'
                  check (input_mode in ('text','voice')),
  phase         text not null default 'person'
                  check (phase in ('person','offering','brand','assets','complete')),
  created_at    timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Anyone can insert messages"
  on public.messages for insert
  with check (true);

create policy "Anyone can read messages"
  on public.messages for select
  using (true);

-- Index for fast conversation retrieval
create index idx_messages_interview on public.messages (interview_id, created_at asc);

-- ─── media ───────────────────────────────────────────────────────────

create table public.media (
  id            uuid primary key default uuid_generate_v4(),
  interview_id  uuid not null references public.interviews(id) on delete cascade,
  url           text not null,
  media_type    text not null check (media_type in ('image','audio','document','link')),
  label         text,
  created_at    timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Anyone can insert media"
  on public.media for insert
  with check (true);

create policy "Anyone can read media"
  on public.media for select
  using (true);

-- ─── gallery ─────────────────────────────────────────────────────────

create table public.gallery (
  id                uuid primary key default uuid_generate_v4(),
  interview_id      uuid not null references public.interviews(id) on delete cascade,
  display_name      text not null,
  tagline           text not null,
  profession        text not null default '',
  avatar_url        text,
  site_url          text,
  identity_snapshot jsonb not null default '{}'::jsonb,
  published_at      timestamptz not null default now()
);

alter table public.gallery enable row level security;

-- Gallery is publicly readable (showcase page)
create policy "Gallery is publicly readable"
  on public.gallery for select
  using (true);

-- Only service role inserts gallery entries
create policy "Service can insert gallery entries"
  on public.gallery for insert
  with check (true);

-- ─── Storage bucket ──────────────────────────────────────────────────
-- Run in Supabase dashboard > Storage > New bucket:
--   Name: uploads
--   Public: true
--   File size limit: 10MB
--   Allowed MIME types: image/*, audio/*

-- ─── Updated-at trigger ──────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger interviews_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();
