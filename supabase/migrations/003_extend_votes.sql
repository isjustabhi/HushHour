create table if not exists public.extend_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  window_index integer not null check (window_index in (1, 2)),
  vote boolean not null,
  created_at timestamptz not null default now(),
  unique (session_id, user_id, window_index)
);

create index if not exists idx_extend_votes_session_window
  on public.extend_votes(session_id, window_index, created_at);

alter table public.extend_votes enable row level security;

drop policy if exists "extend_votes_select_participant" on public.extend_votes;
create policy "extend_votes_select_participant"
on public.extend_votes
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

drop policy if exists "extend_votes_insert_participant" on public.extend_votes;
create policy "extend_votes_insert_participant"
on public.extend_votes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.sessions s
    where s.id = session_id
      and (s.user_a_id = auth.uid() or s.user_b_id = auth.uid())
  )
);
