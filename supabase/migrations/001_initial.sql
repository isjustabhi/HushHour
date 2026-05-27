-- HushHour initial schema
-- Safety-first, ephemeral-by-default data model

create extension if not exists "pgcrypto";

-- Core reference tables
create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  edu_domain text not null unique,
  counseling_url text,
  counseling_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  edu_hash text not null unique,
  campus_id uuid not null references public.campuses(id) on delete restrict,
  banned_until timestamptz,
  is_listener_certified boolean not null default false,
  has_seen_brief boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.matching_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('seeker', 'listener')),
  vibe_tag text,
  campus_id uuid not null references public.campuses(id) on delete restrict,
  enqueued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.users(id) on delete restrict,
  user_b_id uuid not null references public.users(id) on delete restrict,
  vibe_tag text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  extended_count integer not null default 0 check (extended_count between 0 and 2),
  ended_reason text check (
    ended_reason in ('completed', 'left_a', 'left_b', 'crisis_routed', 'abuse_blocked')
  )
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 1000),
  moderation_class text not null check (
    moderation_class in ('SAFE', 'CRISIS', 'ABUSE', 'PII', 'INAPPROPRIATE')
  ),
  redacted boolean not null default false,
  delivered boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  classification text not null check (
    classification in ('SAFE', 'CRISIS', 'ABUSE', 'PII', 'INAPPROPRIATE')
  ),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  action_taken text not null,
  redacted_snippet text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users(id) on delete restrict,
  session_id uuid not null references public.sessions(id) on delete cascade,
  reason text not null,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_users_campus_id on public.users(campus_id);
create index if not exists idx_users_edu_hash on public.users(edu_hash);
create index if not exists idx_queue_campus_role_time on public.matching_queue(campus_id, role, enqueued_at);
create index if not exists idx_queue_expires_at on public.matching_queue(expires_at);
create index if not exists idx_sessions_user_a_id on public.sessions(user_a_id);
create index if not exists idx_sessions_user_b_id on public.sessions(user_b_id);
create index if not exists idx_sessions_started_at on public.sessions(started_at);
create index if not exists idx_messages_session_created_at on public.messages(session_id, created_at);
create index if not exists idx_messages_expires_at on public.messages(expires_at);
create index if not exists idx_moderation_events_session_id on public.moderation_events(session_id);
create index if not exists idx_reports_session_id on public.reports(session_id);

-- Auto-set message expiration from session end
create or replace function public.set_message_expiry_from_session()
returns trigger
language plpgsql
as $$
begin
  if new.ended_at is not null then
    update public.messages
      set expires_at = new.ended_at + interval '5 minutes'
    where session_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_message_expiry_from_session on public.sessions;
create trigger trg_set_message_expiry_from_session
after update of ended_at on public.sessions
for each row
execute function public.set_message_expiry_from_session();

-- Ensure new message inserted after session end still gets an expiry
create or replace function public.set_message_expiry_on_insert()
returns trigger
language plpgsql
as $$
declare
  session_ended_at timestamptz;
begin
  select ended_at into session_ended_at
  from public.sessions
  where id = new.session_id;

  if session_ended_at is not null then
    new.expires_at := session_ended_at + interval '5 minutes';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_message_expiry_on_insert on public.messages;
create trigger trg_set_message_expiry_on_insert
before insert on public.messages
for each row
execute function public.set_message_expiry_on_insert();

-- TTL cleanup trigger helper:
-- deletes expired queue/message rows on relevant writes
create or replace function public.cleanup_expired_ephemeral_rows()
returns trigger
language plpgsql
as $$
begin
  delete from public.matching_queue
  where expires_at <= now();

  delete from public.messages
  where expires_at is not null
    and expires_at <= now();

  return null;
end;
$$;

drop trigger if exists trg_cleanup_expired_on_message on public.messages;
create trigger trg_cleanup_expired_on_message
after insert or update on public.messages
for each statement
execute function public.cleanup_expired_ephemeral_rows();

drop trigger if exists trg_cleanup_expired_on_session on public.sessions;
create trigger trg_cleanup_expired_on_session
after insert or update on public.sessions
for each statement
execute function public.cleanup_expired_ephemeral_rows();

drop trigger if exists trg_cleanup_expired_on_queue on public.matching_queue;
create trigger trg_cleanup_expired_on_queue
after insert or update on public.matching_queue
for each statement
execute function public.cleanup_expired_ephemeral_rows();

-- RLS
alter table public.users enable row level security;
alter table public.campuses enable row level security;
alter table public.matching_queue enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.moderation_events enable row level security;
alter table public.reports enable row level security;

-- Users can only read and update their own profile row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (id = auth.uid());

-- Campuses are readable by authenticated users
drop policy if exists "campuses_select_authenticated" on public.campuses;
create policy "campuses_select_authenticated"
on public.campuses
for select
to authenticated
using (true);

-- Queue access: own rows only
drop policy if exists "queue_select_own" on public.matching_queue;
create policy "queue_select_own"
on public.matching_queue
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "queue_insert_own" on public.matching_queue;
create policy "queue_insert_own"
on public.matching_queue
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "queue_delete_own" on public.matching_queue;
create policy "queue_delete_own"
on public.matching_queue
for delete
to authenticated
using (user_id = auth.uid());

-- Sessions: readable by participants only
drop policy if exists "sessions_select_participant" on public.sessions;
create policy "sessions_select_participant"
on public.sessions
for select
to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid());

drop policy if exists "sessions_insert_participant" on public.sessions;
create policy "sessions_insert_participant"
on public.sessions
for insert
to authenticated
with check (user_a_id = auth.uid() or user_b_id = auth.uid());

drop policy if exists "sessions_update_participant" on public.sessions;
create policy "sessions_update_participant"
on public.sessions
for update
to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid())
with check (user_a_id = auth.uid() or user_b_id = auth.uid());

-- Messages: users can only insert/read messages in their own sessions
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.user_a_id = auth.uid() or s.user_b_id = auth.uid())
  )
);

drop policy if exists "messages_insert_sender_in_session" on public.messages;
create policy "messages_insert_sender_in_session"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.user_a_id = auth.uid() or s.user_b_id = auth.uid())
  )
);

-- Moderation events and reports are visible to session participants
drop policy if exists "moderation_select_participant" on public.moderation_events;
create policy "moderation_select_participant"
on public.moderation_events
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.user_a_id = auth.uid() or s.user_b_id = auth.uid())
  )
);

drop policy if exists "reports_select_reporter_or_participant" on public.reports;
create policy "reports_select_reporter_or_participant"
on public.reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
  or exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.user_a_id = auth.uid() or s.user_b_id = auth.uid())
  )
);

drop policy if exists "reports_insert_reporter" on public.reports;
create policy "reports_insert_reporter"
on public.reports
for insert
to authenticated
with check (reporter_user_id = auth.uid());
