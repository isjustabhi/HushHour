-- NextAuth adapter: grants + expose next_auth to PostgREST (fixes PGRST106 on sign-in)
-- Run in Supabase SQL Editor after 004_nextauth_adapter.sql
-- Also: Dashboard → Project Settings → API → Exposed schemas → add "next_auth"

grant usage on schema next_auth to service_role;
grant all on schema next_auth to postgres;

grant all on all tables in schema next_auth to postgres;
grant all on all tables in schema next_auth to service_role;

alter default privileges in schema next_auth
  grant all on tables to postgres, service_role;

-- Tell PostgREST to serve the next_auth schema (hosted Supabase)
alter role authenticator set pgrst.db_schemas = 'public, storage, graphql_public, next_auth';
notify pgrst;
