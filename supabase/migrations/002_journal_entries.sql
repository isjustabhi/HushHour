create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  feeling text,
  theme_summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);

alter table public.journal_entries enable row level security;

drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own"
on public.journal_entries
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own"
on public.journal_entries
for insert
to authenticated
with check (user_id = auth.uid());
