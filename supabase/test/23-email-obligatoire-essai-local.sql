-- OW-012 lot 2 : essai local de 23-email-obligatoire.sql et de son retour (PostgreSQL 16, schéma réduit). Base locale VIDE seulement, jamais TEST/PROD.
-- Remplacer /tmp/pgow/23.sql et 23r.sql par supabase/23-email-obligatoire.sql et supabase/23-email-obligatoire-retour.sql.
create role authenticated nologin; create role anon nologin;
create schema auth; create schema private; grant usage on schema auth, private, public to authenticated;
create table auth.users(id uuid primary key, is_anonymous boolean);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant execute on function auth.uid() to authenticated;
create function private.is_suspended(u uuid) returns boolean language sql as $$ select false $$;
create table public.profiles(id uuid primary key, pseudo text unique);
create table public.messages(id serial primary key, sender uuid);
create table public.ow_rooms(id serial primary key, owner uuid);
create table public.ow_room_members(room_id int, user_id uuid);
create table public.ow_room_msgs(id serial primary key, sender uuid);
create table public.ow_listings(id serial primary key, seller uuid);
do $$ declare t text; begin foreach t in array array['profiles','messages','ow_rooms','ow_room_members','ow_room_msgs','ow_listings'] loop
 execute format('alter table public.%I enable row level security', t);
 execute format('create policy tout on public.%I for all to authenticated using (true) with check (true)', t);
 execute format('grant all on public.%I to authenticated', t); end loop; end $$;
grant usage on all sequences in schema public to authenticated;
create function public.start_conversation(other_pseudo text) returns text language plpgsql security definer set search_path = '' as $f$
declare me uuid := auth.uid();
begin
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  return 'ok';
end $f$;
grant execute on function public.start_conversation(text) to authenticated;
-- Comptes : A ancien anonyme avec profil (comme Sébastien), N nouveau anonyme sans e-mail, C nouveau avec e-mail confirmé.
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', true), ('00000000-0000-0000-0000-00000000000b', true), ('00000000-0000-0000-0000-00000000000c', false);
insert into public.profiles values ('00000000-0000-0000-0000-00000000000a', 'ancien');
\i /tmp/pgow/23.sql
create function pg_temp.essai(u text, attendu boolean) returns text language plpgsql as $$
declare r text := ''; ok boolean; t text;
begin
  perform set_config('request.jwt.claim.sub', u, true);
  set local role authenticated;
  foreach t in array array['profiles','messages','ow_rooms','ow_room_msgs','ow_listings','start'] loop
    begin
      if t = 'profiles' then insert into public.profiles values (gen_random_uuid(), 'p' || left(md5(random()::text), 6));
      elsif t = 'start' then perform public.start_conversation('x');
      else execute format('insert into public.%I default values', t); end if;
      ok := true;
    exception when others then ok := false; end;
    r := r || t || '=' || case when ok = attendu then 'OK ' else 'FAUX ' end;
  end loop;
  reset role;
  return r;
end $$;
select 'ancien anonyme (garde ses droits) : ' || pg_temp.essai('00000000-0000-0000-0000-00000000000a', true);
select 'nouveau anonyme sans e-mail (refusé) : ' || pg_temp.essai('00000000-0000-0000-0000-00000000000b', false);
select 'nouveau avec e-mail confirmé (accepté) : ' || pg_temp.essai('00000000-0000-0000-0000-00000000000c', true);
\i /tmp/pgow/23r.sql
select 'après retour arrière, nouveau anonyme de nouveau accepté : ' || pg_temp.essai('00000000-0000-0000-0000-00000000000b', true);
select 'comptes et profils intacts : ' || (select count(*) from auth.users) || ' comptes, ' || (select count(*) from public.profiles where pseudo = 'ancien') || ' profil ancien';
