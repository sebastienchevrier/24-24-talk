-- 24/24 ONE WORLD — bouchons LOCAUX imitant le strict nécessaire de Supabase (auth, realtime, rôles),
-- pour prouver que supabase/base/00-socle-schema.sql reconstruit une base VIDE. Jamais sur TEST ni PROD.
-- © 2026 Sébastien Chevrier.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, is_anonymous boolean default false,
  last_sign_in_at timestamptz, created_at timestamptz default now());
create table auth.sessions (id uuid primary key, user_id uuid references auth.users on delete cascade, user_agent text,
  created_at timestamptz default now(), updated_at timestamptz default now(), refreshed_at timestamp);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub', '')::uuid $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema realtime;
grant usage on schema realtime to authenticated;
create table realtime.messages (id bigserial primary key, topic text, extension text, payload jsonb, event text, private boolean);
alter table realtime.messages enable row level security;
create table realtime.subscription (id bigserial primary key, claims jsonb);
create function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic', true) $$;
create function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
  language sql as $$ insert into realtime.messages (topic, extension, payload, event, private) values (topic, 'broadcast', payload, event, private) $$;
grant execute on all functions in schema realtime to authenticated;
create publication supabase_realtime;
