-- OW-012-A1 : essai local du correctif compteur (PostgreSQL 16, schéma réduit tiré de supabase/20). Lancer : psql -f ce_fichier sur une base VIDE locale, jamais sur TEST/PROD.
create schema auth; create schema private;
create table auth.cur(id uuid); create function auth.uid() returns uuid language sql as $$ select id from auth.cur limit 1 $$;
create table public.profiles(id uuid primary key, pseudo text, nom text);
create table public.ow_rooms(id bigint generated always as identity primary key, kind text default 'community', title text, owner_id uuid, owner_name text, members int default 0, created_at timestamptz, last_at timestamptz);
create table public.ow_room_members(room_id bigint references public.ow_rooms on delete cascade, user_id uuid, primary key(room_id,user_id));
create or replace function private.ow_name(uid uuid) returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(btrim(to_jsonb(p)->>'nom'), ''), p.pseudo, '') from public.profiles p where p.id = uid
$$;

create or replace function private.ow_before_room() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    if (select count(*) from public.ow_rooms r where r.owner_id = new.owner_id and r.created_at > now() - interval '1 day') >= 5 then
      raise exception 'OW_RATE' using errcode = 'P0001';
    end if;
    new.members := 0; new.created_at := now(); new.last_at := now();
  else
    new.owner_id := old.owner_id; new.members := old.members; new.created_at := old.created_at; new.kind := old.kind;
  end if;
  new.owner_name := coalesce(private.ow_name(new.owner_id), '');
  return new;
end $$;
drop trigger if exists ow_before_room on public.ow_rooms;
create trigger ow_before_room before insert or update on public.ow_rooms for each row execute function private.ow_before_room();

create or replace function private.ow_after_room() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.ow_room_members (room_id, user_id) values (new.id, new.owner_id) on conflict do nothing;
  return null;
end $$;
drop trigger if exists ow_after_room on public.ow_rooms;
create trigger ow_after_room after insert on public.ow_rooms for each row execute function private.ow_after_room();

create or replace function private.ow_count_members() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.ow_rooms set members = (select count(*) from public.ow_room_members m where m.room_id = coalesce(new.room_id, old.room_id))
   where id = coalesce(new.room_id, old.room_id);
  return null;
end $$;
drop trigger if exists ow_count_members on public.ow_room_members;
create trigger ow_count_members after insert or delete on public.ow_room_members for each row execute function private.ow_count_members();
insert into public.profiles values ('00000000-0000-0000-0000-00000000000a','a',null),('00000000-0000-0000-0000-00000000000b','b',null);
insert into auth.cur values ('00000000-0000-0000-0000-00000000000a');
insert into public.ow_rooms(title) values ('salon');
insert into public.ow_room_members values (1,'00000000-0000-0000-0000-00000000000b');
select 'AVANT correctif : members=' || members || ' réel=' || (select count(*) from public.ow_room_members) from public.ow_rooms;
-- 24/24 ONE WORLD — OW-012-A1 (lot 1) : compteur de membres des salons. © 2026 Sébastien Chevrier.
-- PROPOSITION. NON APPLIQUÉ. À coller d'abord sur TEST, puis sur PROD seulement après le « oui » de Sébastien.
--
-- Défaut (supabase/20-espaces-community-live-business.sql) :
--   ow_count_members (après rejoindre / quitter) fait UPDATE ow_rooms SET members = <nombre réel>,
--   mais le déclencheur ow_before_room (avant chaque UPDATE) remet aussitôt new.members := old.members.
--   Résultat : le compteur reste à 0 pour toujours (le créateur lui-même n'est jamais compté).
--
-- Correctif minimal : le déclencheur garde sa protection contre un téléphone qui voudrait écrire un faux nombre
-- (UPDATE direct = profondeur 1 → members remis à l'ancienne valeur), mais laisse passer le recomptage
-- fait par le serveur lui-même (UPDATE lancé depuis un autre déclencheur = profondeur 2 ou plus).
-- Aucune table, colonne ou règle d'accès n'est ajoutée ni modifiée. Aucune donnée n'est supprimée.

create or replace function private.ow_before_room() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    if (select count(*) from public.ow_rooms r where r.owner_id = new.owner_id and r.created_at > now() - interval '1 day') >= 5 then
      raise exception 'OW_RATE' using errcode = 'P0001';
    end if;
    new.members := 0; new.created_at := now(); new.last_at := now();
  else
    new.owner_id := old.owner_id; new.created_at := old.created_at; new.kind := old.kind;
    -- OW-012-A1 : seul le recomptage du serveur (ow_count_members, déclencheur imbriqué) peut changer le compteur.
    if pg_trigger_depth() <= 1 then new.members := old.members; end if;
  end if;
  new.owner_name := coalesce(private.ow_name(new.owner_id), '');
  return new;
end $$;

-- ÉTAPE 2 (FACULTATIVE, change des données : uniquement avec un « oui » séparé de Sébastien) :
-- remettre les compteurs existants au nombre réel de membres. Ne supprime rien, ne touche qu'à la colonne members.
-- update public.ow_rooms r set members = (select count(*) from public.ow_room_members m where m.room_id = r.id)
--  where r.members is distinct from (select count(*) from public.ow_room_members m where m.room_id = r.id);

-- VÉRIFICATION (lecture seule) : doit répondre true / true.
-- select position('pg_trigger_depth' in pg_get_functiondef('private.ow_before_room'::regproc)) > 0 as correctif_present,
--        not exists (select 1 from public.ow_rooms r where r.members <> (select count(*) from public.ow_room_members m where m.room_id = r.id)) as compteurs_justes;

-- RETOUR ARRIÈRE : recoller la fonction d'origine (supabase/20-espaces-community-live-business.sql, lignes 63-76).
update public.ow_rooms r set members = (select count(*) from public.ow_room_members m where m.room_id = r.id);
insert into public.profiles values ('00000000-0000-0000-0000-00000000000c','c',null);
insert into public.ow_room_members values (1,'00000000-0000-0000-0000-00000000000c');
select 'APRÈS rejoindre : members=' || members || ' réel=' || (select count(*) from public.ow_room_members) from public.ow_rooms;
delete from public.ow_room_members where user_id='00000000-0000-0000-0000-00000000000b';
select 'APRÈS quitter : members=' || members || ' réel=' || (select count(*) from public.ow_room_members) from public.ow_rooms;
update public.ow_rooms set members = 999, title='x';
select 'FAUX nombre envoyé par un téléphone (999) : members=' || members from public.ow_rooms;
insert into public.ow_rooms(title, members) values ('neuf', 50);
select 'NOUVEAU salon (50 demandé) : members=' || members from public.ow_rooms where id=2;
