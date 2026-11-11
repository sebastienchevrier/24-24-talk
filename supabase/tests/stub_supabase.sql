-- Imitation minimale de Supabase pour rejouer les migrations sur un PostgreSQL local.
-- Sert uniquement aux tests : n'est jamais appliqué au projet Supabase.
-- Les rôles sont communs à tout le serveur : on ne les crée que s'ils manquent.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create schema extensions;
create schema realtime;
create table auth.users (id uuid primary key, last_sign_in_at timestamptz);
-- auth.uid() lit l'identifiant simulé de la personne connectée (set request.jwt.claim.sub = '…').
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create table realtime.messages (id bigserial primary key, extension text, topic text);
create function realtime.topic() returns text language sql stable as $$
  select nullif(current_setting('realtime.topic', true), '')
$$;
create table realtime.subscription (claims jsonb);
create publication supabase_realtime;
grant usage on schema auth, realtime, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select, insert on realtime.messages to authenticated;
