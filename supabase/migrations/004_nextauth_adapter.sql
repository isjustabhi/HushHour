-- Tables for @next-auth/supabase-adapter. After this file, run 005_nextauth_expose_schema.sql
-- (or expose next_auth in Dashboard → API → Exposed schemas) to avoid PGRST106 on sign-in.

create schema if not exists next_auth;

create table if not exists next_auth.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text
);

create table if not exists next_auth.accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text
);

create unique index if not exists accounts_provider_provider_account_id_idx
  on next_auth.accounts (provider, "providerAccountId");
create index if not exists accounts_user_id_idx
  on next_auth.accounts ("userId");

create table if not exists next_auth.sessions (
  id uuid primary key default gen_random_uuid(),
  "sessionToken" text not null unique,
  "userId" uuid not null references next_auth.users(id) on delete cascade,
  expires timestamptz not null
);

create index if not exists sessions_user_id_idx
  on next_auth.sessions ("userId");

create table if not exists next_auth.verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamptz not null
);

create unique index if not exists verification_tokens_identifier_token_idx
  on next_auth.verification_tokens (identifier, token);
