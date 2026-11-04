-- 24/24 ONE WORLD — SOCLE COMPLET DE LA BASE (schémas public et private + règles temps réel).
-- © 2026 Sébastien Chevrier. Tous droits réservés.
--
-- Source : relevé en LECTURE SEULE de la base de TEST (projet 24-24-talk-test, tbynnefrrxzxufcptijc) le 4 nov. 2026,
-- par pg_get_functiondef / pg_get_constraintdef / pg_get_indexdef / pg_get_triggerdef / pg_policies / droits.
-- Seule l'indentation des corps de fonctions a été nettoyée (aucun mot changé).
-- Corrige le constat F-30 de l'audit du 3 nov. : private.session_active(), private.is_suspended() et private.is_admin()
-- (et toutes les autres fonctions) ont maintenant une source versionnée.
--
-- ATTENTION
-- - C'est l'état du TEST. La PROD n'a pas pu être relue d'ici : elle peut différer (ex. abonnement B7, origines des stats).
-- - Ne PAS coller sur une base qui contient déjà ces objets : ce fichier sert à RECONSTRUIRE une base vide.
-- - Reconstruction prouvée en local par supabase/base/reconstruire.sh (PostgreSQL 16 + bouchons Supabase).
-- - Données de réglage à remettre après (pas du schéma) : private.billing_settings (1 ligne), private.stats_origins,
--   private.push_config (clés push : jamais dans le dépôt), public.admins.

set check_function_bodies = on;
-- gen_random_uuid() est natif depuis PostgreSQL 13 : aucune extension nécessaire ici.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ───────────────────────── 1. Tables ─────────────────────────
create table private.avatars (
  user_id uuid not null,
  img text not null,
  updated_at timestamp with time zone default now() not null
);
create table private.billing_settings (
  id boolean default true not null,
  free_until timestamp with time zone not null
);
create table private.comptes_anciens (
  user_id uuid not null,
  depuis timestamp with time zone default now() not null
);
create table private.guests (
  user_id uuid not null,
  business uuid not null,
  created_at timestamp with time zone default now() not null
);
create table private.moderation_log (
  id bigint generated always as identity not null,
  admin_id uuid not null,
  target_id uuid,
  target_pseudo text,
  action text not null,
  at timestamp with time zone default now() not null
);
create table private.presence (
  user_id uuid not null,
  last_seen timestamp with time zone default now() not null,
  hidden boolean default false not null
);
create table private.pseudo_history (
  pseudo text not null,
  user_id uuid not null,
  released_at timestamp with time zone default now() not null
);
create table private.push_config (
  id integer default 1 not null,
  public_key text not null,
  private_jwk jsonb not null,
  created_at timestamp with time zone default now() not null
);
create table private.push_log (
  caller uuid not null,
  at timestamp with time zone default now() not null
);
create table private.push_selftest (
  token text not null,
  expires timestamp with time zone not null
);
create table private.push_subs (
  endpoint text not null,
  user_id uuid not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now() not null,
  session_id uuid
);
create table private.rate_log (
  user_id uuid not null,
  action text not null,
  at timestamp with time zone default now() not null
);
create table private.stats_origins (
  origin text not null
);
create table private.subscriptions (
  user_id uuid not null,
  status text not null,
  current_period_end timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamp with time zone default now() not null
);
create table private.suspensions (
  user_id uuid not null,
  suspended_at timestamp with time zone default now() not null,
  suspended_by uuid,
  reason text
);
create table public.admins (
  uid uuid not null
);
create table public.blocks (
  blocker uuid default auth.uid() not null,
  blocked uuid not null,
  created_at timestamp with time zone default now() not null
);
create table public.conversations (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone default now() not null,
  last_at timestamp with time zone default now() not null
);
create table public.hidden_messages (
  user_id uuid default auth.uid() not null,
  message_id bigint not null,
  created_at timestamp with time zone default now() not null
);
create table public.language_profiles (
  user_id uuid not null,
  display_name text default ''::text not null,
  native_lang text not null,
  spoken jsonb default '[]'::jsonb not null,
  ui_lang text default 'auto'::text not null,
  favorites text[] default '{}'::text[] not null,
  prefs jsonb default '{}'::jsonb not null,
  visibility text default 'private'::text not null,
  updated_at timestamp with time zone default now() not null
);
create table public.members (
  conversation_id uuid not null,
  user_id uuid not null,
  last_read timestamp with time zone default now() not null,
  cleared_at timestamp with time zone
);
create table public.messages (
  id bigint generated always as identity not null,
  conversation_id uuid not null,
  sender_id uuid default auth.uid() not null,
  body text not null,
  lang text not null,
  kind text default 'text'::text not null,
  created_at timestamp with time zone default now() not null
);
create table public.ow_listings (
  id uuid default gen_random_uuid() not null,
  seller_id uuid default auth.uid() not null,
  seller_name text default ''::text not null,
  seller_pseudo text default ''::text not null,
  kind text default 'sell'::text not null,
  title text not null,
  body text default ''::text not null,
  lang text default 'fr'::text not null,
  price numeric(12,2),
  currency text default 'EUR'::text not null,
  place text default ''::text not null,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null
);
create table public.ow_reports (
  id bigint generated always as identity not null,
  reporter uuid default auth.uid() not null,
  target_kind text not null,
  target_id text not null,
  target_user uuid,
  body_copy text default ''::text not null,
  reason text default ''::text not null,
  created_at timestamp with time zone default now() not null
);
create table public.ow_room_members (
  room_id uuid not null,
  user_id uuid default auth.uid() not null,
  joined_at timestamp with time zone default now() not null
);
create table public.ow_room_msgs (
  id bigint generated always as identity not null,
  room_id uuid not null,
  sender_id uuid default auth.uid() not null,
  sender_name text default ''::text not null,
  body text not null,
  lang text default 'fr'::text not null,
  kind text default 'text'::text not null,
  created_at timestamp with time zone default now() not null
);
create table public.ow_rooms (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  title text not null,
  about text default ''::text not null,
  lang text default 'fr'::text not null,
  owner_id uuid default auth.uid() not null,
  owner_name text default ''::text not null,
  members integer default 0 not null,
  live_on boolean default false not null,
  created_at timestamp with time zone default now() not null,
  last_at timestamp with time zone default now() not null,
  topic text default 'other'::text not null
);
create table public.profiles (
  id uuid not null,
  pseudo text not null,
  lang text default 'fr'::text not null,
  created_at timestamp with time zone default now() not null,
  nom text
);
create table public.reports (
  id bigint generated always as identity not null,
  reporter uuid default auth.uid(),
  reported uuid,
  message_id bigint,
  body_copy text,
  reason text,
  created_at timestamp with time zone default now() not null
);
create table public.stat_days (
  day date not null,
  kind text not null,
  n bigint default 0 not null
);
create table public.stat_devices (
  day date not null,
  sid uuid not null
);
create table public.stat_presence (
  sid uuid not null,
  last_seen timestamp with time zone default now() not null,
  net boolean default false not null
);

-- ───────────────────────── 2. Fonctions private ─────────────────────────
-- F-30 : les 3 fonctions de sécurité utilisées par toutes les règles.
CREATE OR REPLACE FUNCTION private.session_active()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from auth.sessions s
    where s.id = nullif(auth.jwt()->>'session_id', '')::uuid and s.user_id = auth.uid()
  )
$function$;

CREATE OR REPLACE FUNCTION private.is_suspended(who uuid DEFAULT NULL::uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (select 1 from private.suspensions where user_id = coalesce(who, auth.uid()));
$function$;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select private.session_active() and exists (select 1 from public.admins where uid = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION private.after_profile_gone()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into private.pseudo_history (pseudo, user_id) values (old.pseudo, old.id);
  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION private.before_message()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  new.created_at := now();
  -- compte suspendu : erreur explicite pour que l'appli affiche « compte suspendu »
  -- (la règle « compte non suspendu » reste en place comme seconde barrière)
  if new.sender_id is not null and private.is_suspended(new.sender_id) then
    raise exception 'SUSPENDED' using errcode = 'P0001';
  end if;
  if new.sender_id is null or exists (select 1 from public.admins where uid = new.sender_id) then
    return new;
  end if;
  if (select count(*) from public.messages
       where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30
  or (select count(*) from public.messages
       where sender_id = new.sender_id and created_at > now() - interval '24 hours') >= 1000 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'messages';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.before_profile()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
    new.id := old.id;
  end if;

  if tg_op = 'UPDATE' and new.pseudo is not distinct from old.pseudo then
    return new;
  end if;

  if exists (select 1 from private.pseudo_history h
              where h.pseudo = new.pseudo and h.user_id <> new.id
                and h.released_at > now() - interval '30 days') then
    raise exception 'duplicate key value violates unique constraint "profiles_pseudo_key"'
      using errcode = '23505', hint = 'pseudo_reserve';
  end if;

  if tg_op = 'UPDATE' then
    if not exists (select 1 from public.admins a where a.uid = new.id)
       and exists (select 1 from private.pseudo_history h
                    where h.user_id = new.id and h.released_at > now() - interval '30 days') then
      raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'pseudo';
    end if;
    insert into private.pseudo_history (pseudo, user_id) values (old.pseudo, old.id);
  end if;

  if random() < 0.05 then
    delete from private.pseudo_history where released_at < now() - interval '30 days';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.before_report()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if new.reporter is not null
     and not exists (select 1 from public.admins where uid = new.reporter)
     and (select count(*) from public.reports
           where reporter = new.reporter and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'reports';
  end if;
  new.created_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.blocked_in(conv uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.members m join public.blocks b on b.blocker = m.user_id and b.blocked = auth.uid()
     where m.conversation_id = conv
  );
$function$;

CREATE OR REPLACE FUNCTION private.shares_conversation(other uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = other
  );
$function$;

CREATE OR REPLACE FUNCTION private.can(p_action text, p_target uuid, p_context text DEFAULT 'personal'::text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
begin
  if me is null or not private.session_active() then return false; end if;
  if p_context is distinct from 'personal' then return false; end if;
  if p_target is null or not exists (select 1 from public.profiles p where p.id = p_target) then return false; end if;

  case p_action
    when 'read_profile' then
      return p_target = me or private.shares_conversation(p_target);

    when 'message', 'call' then
      if p_target = me then return false; end if;
      if exists (select 1 from public.blocks b where (b.blocker = p_target and b.blocked = me) or (b.blocker = me and b.blocked = p_target)) then return false; end if;
      return private.shares_conversation(p_target);

    when 'start_conversation' then
      if p_target = me or private.is_suspended(me) or private.is_suspended(p_target) then return false; end if;
      return not exists (select 1 from public.blocks b
                          where (b.blocker = me and b.blocked = p_target) or (b.blocker = p_target and b.blocked = me));

    when 'block', 'report' then
      return p_target <> me;

    else
      return false;
  end case;
end;
$function$;

CREATE OR REPLACE FUNCTION private.can_signal(topic text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.can('call', substr(topic, 6)::uuid, 'personal');
end;
$function$;

CREATE OR REPLACE FUNCTION private.compte_verifie()
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
declare ok boolean := false;
begin
  if exists (select 1 from auth.users u where u.id = auth.uid() and not coalesce(u.is_anonymous, false))
     or exists (select 1 from private.comptes_anciens a where a.user_id = auth.uid()) then
    return true;
  end if;
  if to_regclass('private.guests') is not null then
    execute 'select exists (select 1 from private.guests g where g.user_id = $1)' into ok using auth.uid();
  end if;
  return coalesce(ok, false);
end $function$;

CREATE OR REPLACE FUNCTION private.has_access(uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select uid is not null and (
       now() < (select free_until from private.billing_settings)
    or exists (select 1 from public.admins where admins.uid = has_access.uid)
    or exists (select 1 from private.subscriptions s
                where s.user_id = has_access.uid
                  and s.status in ('active', 'trialing', 'past_due')
                  and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_guest(who uuid DEFAULT NULL::uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$ select exists (select 1 from private.guests where user_id = coalesce(who, auth.uid())) $function$;

CREATE OR REPLACE FUNCTION private.is_member(conv uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (select 1 from public.members where conversation_id = conv and user_id = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION private.lp_code_ok(c text)
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $function$
  select c is not null and c ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'
$function$;

CREATE OR REPLACE FUNCTION private.lp_codes_ok(a text[])
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $function$
  select a is not null and coalesce(cardinality(a), 0) <= 8 and not exists (select 1 from unnest(a) x where not private.lp_code_ok(x))
$function$;

CREATE OR REPLACE FUNCTION private.lp_spoken_ok(j jsonb)
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $function$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 12 and not exists (
    select 1 from jsonb_array_elements(j) e
    where jsonb_typeof(e) <> 'object'
       or not private.lp_code_ok(e->>'code')
       or coalesce(e->>'level', '') not in ('A1','A2','B1','B2','C1','C2')
       or coalesce(e->>'source', 'declare') not in ('declare','estime')
       or (select count(*) from jsonb_object_keys(e)) > 3
  )
$function$;

CREATE OR REPLACE FUNCTION private.lp_touch()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $function$
begin new.updated_at := now(); return new; end $function$;

CREATE OR REPLACE FUNCTION private.ow_name(uid uuid)
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select coalesce(nullif(btrim(to_jsonb(p)->>'nom'), ''), p.pseudo, '') from public.profiles p where p.id = uid
$function$;

CREATE OR REPLACE FUNCTION private.ow_after_room()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into public.ow_room_members (room_id, user_id) values (new.id, new.owner_id) on conflict do nothing;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION private.ow_before_listing()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    new.seller_id := auth.uid();
    if (select count(*) from public.ow_listings l where l.seller_id = new.seller_id and l.created_at > now() - interval '1 day') >= 10 then
      raise exception 'OW_RATE' using errcode = 'P0001';
    end if;
    new.created_at := now();
  else
    new.seller_id := old.seller_id; new.created_at := old.created_at;
  end if;
  new.seller_name := coalesce(private.ow_name(new.seller_id), '');
  new.seller_pseudo := coalesce((select p.pseudo from public.profiles p where p.id = new.seller_id), '');
  new.currency := upper(new.currency);
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.ow_before_msg()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  new.sender_id := auth.uid();
  if (select count(*) from public.ow_room_msgs m where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'OW_RATE' using errcode = 'P0001';
  end if;
  if new.kind = 'caption' and not exists (select 1 from public.ow_rooms r where r.id = new.room_id and r.owner_id = new.sender_id) then
    new.kind := 'text';
  end if;
  new.sender_name := coalesce(private.ow_name(new.sender_id), '');
  new.created_at := now();
  update public.ow_rooms set last_at = now() where id = new.room_id;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.ow_before_report()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  new.reporter := auth.uid();
  if (select count(*) from public.ow_reports r where r.reporter = new.reporter and r.created_at > now() - interval '1 day') >= 30 then
    raise exception 'OW_RATE' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.ow_before_room()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION private.ow_count_members()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  update public.ow_rooms set members = (select count(*) from public.ow_room_members m where m.room_id = coalesce(new.room_id, old.room_id))
   where id = coalesce(new.room_id, old.room_id);
  return null;
end $function$;

CREATE OR REPLACE FUNCTION private.ow_is_room_member(rid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (select 1 from public.ow_room_members m where m.room_id = rid and m.user_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.ow_is_room_owner(rid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (select 1 from public.ow_rooms r where r.id = rid and r.owner_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.ow_topic_member(topic text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select topic ~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and private.session_active()
     and not private.is_suspended(auth.uid())
     and exists (select 1 from public.ow_room_members m where m.room_id = substr(topic, 6)::uuid and m.user_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.photo_visible(target uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select (select auth.uid()) is not null
    and (
      target = (select auth.uid())
      or (
        exists (select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
                 where a.user_id = (select auth.uid()) and b.user_id = target)
        and not exists (select 1 from public.blocks bl
                         where (bl.blocker = target and bl.blocked = (select auth.uid()))
                            or (bl.blocker = (select auth.uid()) and bl.blocked = target))
        and not private.is_suspended(target)
      )
    )
$function$;

CREATE OR REPLACE FUNCTION private.stats_origin_ok()
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  h text := current_setting('request.headers', true);
  o text;
begin
  if h is null or h = '' then return true; end if;
  begin o := h::json ->> 'origin'; exception when others then return false; end;
  return o is not null and exists (select 1 from private.stats_origins where origin = o);
end;
$function$;

CREATE OR REPLACE FUNCTION private.welcome_new_profile()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  admin_id uuid;
  conv uuid;
begin
  if exists (select 1 from private.guests where user_id = new.id) then return new; end if;
  select uid into admin_id from public.admins limit 1;
  if admin_id is null or new.id = admin_id then return new; end if;
  begin
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id, last_read)
      values (conv, admin_id, now()), (conv, new.id, now() - interval '1 second');
    insert into public.messages (conversation_id, sender_id, body, lang, kind)
      values (conv, admin_id, 'Bienvenue @' || new.pseudo || ' dans l''aventure 24/24', 'fr', 'text');
  exception when others then
    raise warning 'welcome_new_profile: %', sqlerrm;
  end;
  return new;
end;
$function$;

-- ───────────────────────── 3. Fonctions public (appelées par l'appli) ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_ban(target_pseudo text, suspendre boolean)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
  target uuid;
  clean text := lower(trim(coalesce(target_pseudo, '')));
begin
  if me is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select id into target from public.profiles where pseudo = clean;
  if target is null then raise exception 'NOT_FOUND'; end if;
  if target = me or exists (select 1 from public.admins where uid = target) then
    raise exception 'ADMIN_PROTEGE';
  end if;
  if coalesce(suspendre, false) then
    insert into private.suspensions (user_id, suspended_by) values (target, me)
      on conflict (user_id) do nothing;
    insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'suspendre');
  else
    delete from private.suspensions where user_id = target;
    insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'retablir');
  end if;
  return json_build_object('ok', true, 'pseudo', clean, 'suspendu', coalesce(suspendre, false));
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_moderation()
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  res json;
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  select json_build_object(
    'reports', coalesce((
      select json_agg(r order by r.cree desc) from (
        select pc.pseudo as cible,
               pr.pseudo as par,
               rep.created_at as cree,
               (rep.reported is not null and private.is_suspended(rep.reported)) as suspendu,
               rep.reason as motif,
               rep.body_copy as message
          from public.reports rep
          left join public.profiles pc on pc.id = rep.reported
          left join public.profiles pr on pr.id = rep.reporter
         order by rep.created_at desc
         limit 200
      ) r), '[]'::json),
    'bannis', coalesce((
      select json_agg(p.pseudo order by p.pseudo)
        from private.suspensions s join public.profiles p on p.id = s.user_id), '[]'::json)
  ) into res;
  return res;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_photo(target_pseudo text)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return (select a.img from private.avatars a join public.profiles p on p.id = a.user_id
           where p.pseudo = lower(trim(coalesce(target_pseudo, ''))));
end $function$;

CREATE OR REPLACE FUNCTION public.admin_retirer_photo(target_pseudo text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare me uuid := auth.uid(); target uuid; clean text := lower(trim(coalesce(target_pseudo, '')));
begin
  if me is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select id into target from public.profiles where pseudo = clean;
  if target is null then raise exception 'NOT_FOUND'; end if;
  delete from private.avatars where user_id = target;
  insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'retirer_photo');
  return json_build_object('ok', true, 'pseudo', clean);
end $function$;

CREATE OR REPLACE FUNCTION public.admin_stats()
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  today date := (now() at time zone 'Indian/Reunion')::date;
  res json;
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  select json_build_object(
    'now', now(),
    'online', (select count(*) from public.stat_presence where last_seen > now() - interval '2 minutes'),
    'online_net', (select count(*) from public.stat_presence where last_seen > now() - interval '2 minutes' and net),
    'today', json_build_object(
      'personnes', (select count(*) from public.stat_devices where day = today),
      'ouvertures', coalesce((select n from public.stat_days where day = today and kind = 'ouverture'), 0),
      'traductions', coalesce((select n from public.stat_days where day = today and kind = 'traduction'), 0),
      'messages', (select count(*) from public.messages where (created_at at time zone 'Indian/Reunion')::date = today),
      'appels', coalesce((select n from public.stat_days where day = today and kind = 'appel'), 0),
      'minutes', round(coalesce((select n from public.stat_days where day = today and kind = 'appel_sec'), 0) / 60.0, 1),
      'inscrits', (select count(*) from public.profiles where (created_at at time zone 'Indian/Reunion')::date = today)
    ),
    'days', (
      select json_agg(json_build_object(
        'day', g.d,
        'personnes', (select count(*) from public.stat_devices v where v.day = g.d),
        'ouvertures', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'ouverture'), 0),
        'traductions', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'traduction'), 0),
        'messages', (select count(*) from public.messages m where (m.created_at at time zone 'Indian/Reunion')::date = g.d),
        'appels', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'appel'), 0),
        'minutes', round(coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'appel_sec'), 0) / 60.0, 1),
        'inscrits', (select count(*) from public.profiles p where (p.created_at at time zone 'Indian/Reunion')::date = g.d)
      ) order by g.d)
      from (select gs::date as d from generate_series(today - 29, today, interval '1 day') as gs) g
    ),
    'totals', json_build_object(
      'inscrits', (select count(*) from public.profiles),
      'discussions', (select count(*) from public.conversations),
      'messages', (select count(*) from public.messages),
      'traductions', coalesce((select sum(n) from public.stat_days where kind = 'traduction'), 0),
      'appels', coalesce((select sum(n) from public.stat_days where kind = 'appel'), 0),
      'minutes', round(coalesce((select sum(n) from public.stat_days where kind = 'appel_sec'), 0) / 60.0, 1),
      'personnes_30j', (select count(distinct sid) from public.stat_devices where day > today - 30)
    ),
    'users', (
      select coalesce(json_agg(u order by u.cree desc), '[]'::json) from (
        select p.pseudo, p.lang, p.created_at as cree,
          (select max(m.created_at) from public.messages m where m.sender_id = p.id) as dernier_message,
          (select count(*) from public.messages m where m.sender_id = p.id) as messages
        from public.profiles p order by p.created_at desc limit 300
      ) u
    ),
    'quota', json_build_object(
      'db_mo', round(pg_database_size(current_database()) / 1048576.0, 1),
      'actifs_mois', (select count(*) from auth.users where last_sign_in_at >= date_trunc('month', now())),
      'temps_reel', (select count(distinct (claims ->> 'sub')) from realtime.subscription)
    )
  ) into res;
  return res;
end;
$function$;

CREATE OR REPLACE FUNCTION public.deconnecter_appareil(sid uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare me uuid := auth.uid(); cur uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  if sid is null or sid = cur then raise exception 'CURRENT'; end if;
  delete from private.push_subs where session_id = sid and user_id = me;
  delete from auth.sessions where id = sid and user_id = me;
  return found;
end $function$;

CREATE OR REPLACE FUNCTION public.je_suis_la(cacher boolean DEFAULT NULL::boolean)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
  h boolean;
begin
  if me is null or not private.session_active() then return null; end if;
  if not exists (select 1 from public.profiles where id = me) then return null; end if;
  insert into private.presence as p (user_id, last_seen, hidden)
    values (me, now(), coalesce(cacher, false))
  on conflict (user_id) do update
    set last_seen = now(), hidden = coalesce(cacher, p.hidden)
  returning p.hidden into h;
  return h;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_business(pro_pseudo text, guest_name text, guest_lang text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
  biz uuid;
  conv uuid;
  base text;
  ps text;
  nm text;
  tries int := 0;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not private.session_active() then raise exception 'AUTH'; end if;
  select id into biz from public.profiles where pseudo = lower(trim(pro_pseudo));
  if biz is null or private.is_suspended(biz) or private.is_guest(biz) then raise exception 'NOT_FOUND'; end if;
  if biz = me then raise exception 'SELF'; end if;
  if exists (select 1 from public.profiles where id = me) then
    if not exists (select 1 from private.guests where user_id = me and business = biz) then raise exception 'HAS_PROFILE'; end if;
  else
    if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) is not true then raise exception 'NOT_GUEST'; end if;
    insert into private.guests (user_id, business) values (me, biz);
    nm := left(trim(regexp_replace(coalesce(guest_name, ''), '[[:cntrl:]<>@]', '', 'g')), 40);
    if char_length(nm) < 2 then nm := null; end if;
    base := trim(both '-' from left(regexp_replace(translate(lower(coalesce(nm, '')), 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy'), '[^a-z0-9]+', '-', 'g'), 12));
    if char_length(base) < 2 then base := 'client'; end if;
    loop
      ps := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
      exit when not exists (select 1 from public.profiles where pseudo = ps);
      tries := tries + 1;
      if tries > 5 then raise exception 'PSEUDO'; end if;
    end loop;
    insert into public.profiles (id, pseudo, lang, nom) values (me, ps, left(coalesce(nullif(trim(guest_lang), ''), 'en'), 12), nm);
  end if;
  select m1.conversation_id into conv
    from public.members m1
    join public.members m2 on m2.conversation_id = m1.conversation_id and m2.user_id = biz
   where m1.user_id = me
   limit 1;
  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, biz);
  end if;
  return json_build_object('conv', conv, 'pseudo', (select pseudo from public.profiles where id = me));
end;
$function$;

CREATE OR REPLACE FUNCTION public.langues_de_mes_contacts()
 RETURNS TABLE(user_id uuid, display_name text, native_lang text, spoken jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select lp.user_id, lp.display_name, lp.native_lang, lp.spoken
  from public.language_profiles lp
  where (select auth.uid()) is not null
    and (select private.session_active())
    and lp.visibility = 'contacts'
    and lp.user_id <> (select auth.uid())
    and exists (
      select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
      where a.user_id = (select auth.uid()) and b.user_id = lp.user_id)
    and not exists (select 1 from public.blocks bl where bl.blocker = lp.user_id and bl.blocked = (select auth.uid()))
$function$;

CREATE OR REPLACE FUNCTION public.mes_appareils()
 RETURNS TABLE(id uuid, appareil text, depuis timestamp with time zone, vu timestamp with time zone, actuel boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select s.id, coalesce(s.user_agent, ''), s.created_at,
         greatest(s.created_at, s.updated_at, (s.refreshed_at at time zone 'UTC')),
         s.id = nullif(auth.jwt()->>'session_id', '')::uuid
  from auth.sessions s
  where s.user_id = auth.uid() and (select private.session_active())
  order by 4 desc
$function$;

CREATE OR REPLACE FUNCTION public.mettre_ma_photo(img text)
 RETURNS timestamp with time zone LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare me uuid := auth.uid(); t timestamptz := now();
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  if img is null or length(img) > 60000 or img !~ '^data:image/(jpeg|webp);base64,[A-Za-z0-9+/]+=*$' then
    raise exception 'BAD_IMAGE';
  end if;
  if (select count(*) from private.rate_log where user_id = me and action = 'photo' and at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT' using hint = 'photo';
  end if;
  insert into private.rate_log (user_id, action, at) values (me, 'photo', t);
  insert into private.avatars as a (user_id, img, updated_at) values (me, mettre_ma_photo.img, t)
    on conflict (user_id) do update set img = excluded.img, updated_at = excluded.updated_at;
  return t;
end $function$;

CREATE OR REPLACE FUNCTION public.mon_acces()
 RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select json_build_object(
    'acces', private.has_access(auth.uid()),
    'gratuit_jusqu_au', (select free_until from private.billing_settings),
    'abonne', exists (select 1 from private.subscriptions s where s.user_id = auth.uid()
                        and s.status in ('active', 'trialing', 'past_due')),
    'fin_periode', (select current_period_end from private.subscriptions s where s.user_id = auth.uid())
  )
  where (select private.session_active());
$function$;

CREATE OR REPLACE FUNCTION public.on_new_message()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  delete from public.messages where conversation_id = new.conversation_id and created_at < now() - interval '90 days';
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ow_live_signal(p_room uuid, p_msg jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
  host uuid;
  t text;
  dest uuid;
  sdp jsonb;
  ice jsonb;
  out jsonb;
begin
  if me is null or not private.session_active() then raise exception 'AUTH' using errcode = 'P0001'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED' using errcode = 'P0001'; end if;
  if p_msg is null or jsonb_typeof(p_msg) <> 'object' then raise exception 'OW_SIG_FORMAT' using errcode = 'P0001'; end if;
  if octet_length(p_msg::text) > 16384 then raise exception 'OW_SIG_SIZE' using errcode = 'P0001'; end if;
  select r.owner_id into host from public.ow_rooms r where r.id = p_room and r.kind = 'live';
  if host is null or not exists (select 1 from public.ow_room_members m where m.room_id = p_room and m.user_id = me) then
    raise exception 'OW_SIG_ROOM' using errcode = 'P0001';
  end if;
  t := p_msg->>'t';
  if t is null or t not in ('hello', 'live', 'cam', 'camoff', 'end', 'offer', 'answer', 'ice', 'bye') then
    raise exception 'OW_SIG_TYPE' using errcode = 'P0001';
  end if;
  if me = host then
    if t in ('hello', 'answer', 'bye') then raise exception 'OW_SIG_ROLE' using errcode = 'P0001'; end if;
    if t in ('offer', 'ice') then
      if coalesce(p_msg->>'to', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'OW_SIG_TO' using errcode = 'P0001';
      end if;
      dest := (p_msg->>'to')::uuid;
      if dest = me or not exists (select 1 from public.ow_room_members m where m.room_id = p_room and m.user_id = dest) then
        raise exception 'OW_SIG_TO' using errcode = 'P0001';
      end if;
    end if;
  else
    if t in ('live', 'cam', 'camoff', 'end', 'offer') then raise exception 'OW_SIG_ROLE' using errcode = 'P0001'; end if;
    dest := host;
  end if;
  out := jsonb_build_object('t', t, 'from', me);
  if dest is not null then out := out || jsonb_build_object('to', dest); end if;
  if t in ('offer', 'answer') then
    sdp := p_msg->'sdp';
    if jsonb_typeof(sdp) <> 'object' or sdp->>'type' is distinct from t
       or jsonb_typeof(sdp->'sdp') <> 'string' or octet_length(sdp->>'sdp') > 12000 then
      raise exception 'OW_SIG_SDP' using errcode = 'P0001';
    end if;
    out := out || jsonb_build_object('sdp', jsonb_build_object('type', t, 'sdp', sdp->>'sdp'));
  elsif t = 'ice' then
    ice := p_msg->'ice';
    if jsonb_typeof(ice) <> 'object' or jsonb_typeof(ice->'candidate') <> 'string' or octet_length(ice->>'candidate') > 1024 then
      raise exception 'OW_SIG_ICE' using errcode = 'P0001';
    end if;
    out := out || jsonb_build_object('ice', jsonb_strip_nulls(jsonb_build_object(
      'candidate', ice->>'candidate',
      'sdpMid', left(ice->>'sdpMid', 32),
      'sdpMLineIndex', case when jsonb_typeof(ice->'sdpMLineIndex') = 'number' then (ice->>'sdpMLineIndex')::int end,
      'usernameFragment', left(ice->>'usernameFragment', 64))));
  end if;
  perform realtime.send(out, 'sig', 'room:' || p_room::text, true);
end $function$;

CREATE OR REPLACE FUNCTION public.ow_permissions(p_other uuid, p_context text DEFAULT 'personal'::text)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'context',            coalesce(p_context, 'personal'),
    'read_profile',       private.can('read_profile', p_other, p_context),
    'message',            private.can('message', p_other, p_context),
    'call',               private.can('call', p_other, p_context),
    'start_conversation', private.can('start_conversation', p_other, p_context),
    'block',              private.can('block', p_other, p_context),
    'report',             private.can('report', p_other, p_context)
  );
$function$;

CREATE OR REPLACE FUNCTION public.photos(ids uuid[])
 RETURNS TABLE(user_id uuid, img text, updated_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select a.user_id, a.img, a.updated_at from private.avatars a
   where (select private.session_active())
     and a.user_id = any((ids)[1:50])
     and private.photo_visible(a.user_id)
$function$;

CREATE OR REPLACE FUNCTION public.photos_de_mes_contacts()
 RETURNS TABLE(user_id uuid, updated_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select a.user_id, a.updated_at from private.avatars a
   where (select private.session_active()) and private.photo_visible(a.user_id)
$function$;

CREATE OR REPLACE FUNCTION public.ping(sid uuid, net boolean DEFAULT false)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  s_id uuid := ping.sid;
  on_net boolean := coalesce(ping.net, false);
begin
  if s_id is null then return; end if;
  if not private.stats_origin_ok() then return; end if;
  if exists (select 1 from public.stat_presence where sid = s_id) then
    update public.stat_presence set last_seen = now(), net = on_net where sid = s_id;
  elsif (select count(*) from public.stat_presence) < 5000 then
    insert into public.stat_presence (sid, last_seen, net) values (s_id, now(), on_net)
      on conflict (sid) do update set last_seen = now(), net = excluded.net;
  end if;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.presence_de_mes_contacts()
 RETURNS TABLE(user_id uuid, last_seen timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select p.user_id, p.last_seen
  from private.presence p
  where (select auth.uid()) is not null
    and (select private.session_active())
    and p.user_id <> (select auth.uid())
    and not p.hidden
    -- réciprocité : qui cache sa présence ne voit pas celle des autres
    and not exists (select 1 from private.presence m where m.user_id = (select auth.uid()) and m.hidden)
    and exists (
      select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
      where a.user_id = (select auth.uid()) and b.user_id = p.user_id)
    and not exists (
      select 1 from public.blocks bl
      where (bl.blocker = p.user_id and bl.blocked = (select auth.uid()))
         or (bl.blocker = (select auth.uid()) and bl.blocked = p.user_id))
$function$;

CREATE OR REPLACE FUNCTION public.retirer_ma_photo()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.session_active() then raise exception 'AUTH'; end if;
  delete from private.avatars where user_id = auth.uid();
end $function$;

CREATE OR REPLACE FUNCTION public.start_conversation(other_pseudo text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not private.session_active() then raise exception 'AUTH'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if; if not private.compte_verifie() then raise exception 'EMAIL_REQUIRED'; end if;
  select id into other from public.profiles where pseudo = lower(trim(other_pseudo));
  if other is null or private.is_suspended(other) then raise exception 'NOT_FOUND'; end if;
  if other = me then raise exception 'SELF'; end if;
  if private.is_guest(me) and not exists (select 1 from private.guests where user_id = me and business = other) then raise exception 'GUEST'; end if;
  if private.is_guest(other) and not exists (select 1 from private.guests where user_id = other and business = me) then raise exception 'NOT_FOUND'; end if;
  if exists (select 1 from public.blocks where (blocker = me and blocked = other) or (blocker = other and blocked = me)) then
    raise exception 'BLOCKED';
  end if;
  select m1.conversation_id into conv
    from public.members m1
    join public.members m2 on m2.conversation_id = m1.conversation_id and m2.user_id = other
   where m1.user_id = me
     and (select count(*) from public.members m3 where m3.conversation_id = m1.conversation_id) = 2
   limit 1;
  if conv is null then
    if not exists (select 1 from public.admins where uid = me)
       and (select count(*) from private.rate_log
             where user_id = me and action = 'nouvelle_discussion'
               and at > now() - interval '24 hours') >= 20 then
      raise exception 'RATE_LIMIT' using hint = 'discussions';
    end if;
    insert into private.rate_log (user_id, action) values (me, 'nouvelle_discussion');
    if random() < 0.02 then delete from private.rate_log where at < now() - interval '2 days'; end if;
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end;
$function$;

CREATE OR REPLACE FUNCTION public.supprimer_mon_compte()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare me uuid := auth.uid();
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  delete from auth.users where id = me;
end $function$;

CREATE OR REPLACE FUNCTION public.track(sid uuid, kind text, amount integer DEFAULT 1)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  d date := (now() at time zone 'Indian/Reunion')::date;
  k text := track.kind;
  a integer;
  s_id uuid := track.sid;
begin
  if k is null or k not in ('ouverture', 'traduction', 'appel', 'appel_sec', 'voix_ok', 'voix_echec', 'voix_relais') then
    return;
  end if;
  if not private.stats_origin_ok() then return; end if;
  a := case when k = 'appel_sec' then greatest(1, least(coalesce(track.amount, 1), 7200)) else 1 end;
  if exists (select 1 from public.stat_days where day = d and kind = k and n >= 1000000) then return; end if;
  insert into public.stat_days as s (day, kind, n) values (d, k, a)
    on conflict (day, kind) do update set n = s.n + excluded.n;
  if k = 'ouverture' and s_id is not null
     and (select count(*) from public.stat_devices where day = d) < 20000 then
    insert into public.stat_devices (day, sid) values (d, s_id) on conflict do nothing;
  end if;
end;
$function$;

-- ───────────────────────── 4. Contraintes ─────────────────────────
set search_path = public;
alter table private.avatars add constraint avatars_pkey PRIMARY KEY (user_id);
alter table private.billing_settings add constraint billing_settings_pkey PRIMARY KEY (id);
alter table private.comptes_anciens add constraint comptes_anciens_pkey PRIMARY KEY (user_id);
alter table private.guests add constraint guests_pkey PRIMARY KEY (user_id);
alter table private.moderation_log add constraint moderation_log_pkey PRIMARY KEY (id);
alter table private.presence add constraint presence_pkey PRIMARY KEY (user_id);
alter table private.push_config add constraint push_config_pkey PRIMARY KEY (id);
alter table private.push_selftest add constraint push_selftest_pkey PRIMARY KEY (token);
alter table private.push_subs add constraint push_subs_pkey PRIMARY KEY (endpoint);
alter table private.stats_origins add constraint stats_origins_pkey PRIMARY KEY (origin);
alter table private.subscriptions add constraint subscriptions_pkey PRIMARY KEY (user_id);
alter table private.suspensions add constraint suspensions_pkey PRIMARY KEY (user_id);
alter table public.admins add constraint admins_pkey PRIMARY KEY (uid);
alter table public.blocks add constraint blocks_pkey PRIMARY KEY (blocker, blocked);
alter table public.conversations add constraint conversations_pkey PRIMARY KEY (id);
alter table public.hidden_messages add constraint hidden_messages_pkey PRIMARY KEY (user_id, message_id);
alter table public.language_profiles add constraint language_profiles_pkey PRIMARY KEY (user_id);
alter table public.members add constraint members_pkey PRIMARY KEY (conversation_id, user_id);
alter table public.messages add constraint messages_pkey PRIMARY KEY (id);
alter table public.ow_listings add constraint ow_listings_pkey PRIMARY KEY (id);
alter table public.ow_reports add constraint ow_reports_pkey PRIMARY KEY (id);
alter table public.ow_room_members add constraint ow_room_members_pkey PRIMARY KEY (room_id, user_id);
alter table public.ow_room_msgs add constraint ow_room_msgs_pkey PRIMARY KEY (id);
alter table public.ow_rooms add constraint ow_rooms_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.reports add constraint reports_pkey PRIMARY KEY (id);
alter table public.stat_days add constraint stat_days_pkey PRIMARY KEY (day, kind);
alter table public.stat_devices add constraint stat_devices_pkey PRIMARY KEY (day, sid);
alter table public.stat_presence add constraint stat_presence_pkey PRIMARY KEY (sid);
alter table private.subscriptions add constraint subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
alter table public.profiles add constraint profiles_pseudo_key UNIQUE (pseudo);
alter table private.avatars add constraint avatars_img_check CHECK (((length(img) <= 60000) AND (img ~ '^data:image/(jpeg|webp);base64,[A-Za-z0-9+/]+=*$'::text)));
alter table private.billing_settings add constraint billing_settings_id_check CHECK (id);
alter table private.moderation_log add constraint moderation_log_action_check CHECK ((action = ANY (ARRAY['suspendre'::text, 'retablir'::text, 'retirer_photo'::text])));
alter table private.push_config add constraint push_config_id_check CHECK ((id = 1));
alter table private.push_subs add constraint push_subs_auth_check CHECK (((char_length(auth) >= 16) AND (char_length(auth) <= 30)));
alter table private.push_subs add constraint push_subs_endpoint_check CHECK (((char_length(endpoint) >= 20) AND (char_length(endpoint) <= 1000)));
alter table private.push_subs add constraint push_subs_p256dh_check CHECK (((char_length(p256dh) >= 80) AND (char_length(p256dh) <= 100)));
alter table private.subscriptions add constraint subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text, 'unpaid'::text, 'incomplete'::text])));
alter table private.suspensions add constraint suspensions_reason_check CHECK ((char_length(reason) <= 500));
alter table public.language_profiles add constraint language_profiles_display_name_check CHECK (((char_length(display_name) <= 40) AND (display_name !~ '[[:cntrl:]<>]'::text)));
alter table public.language_profiles add constraint language_profiles_favorites_check CHECK (private.lp_codes_ok(favorites));
alter table public.language_profiles add constraint language_profiles_native_lang_check CHECK (private.lp_code_ok(native_lang));
alter table public.language_profiles add constraint language_profiles_prefs_check CHECK (((jsonb_typeof(prefs) = 'object'::text) AND (pg_column_size(prefs) <= 2048)));
alter table public.language_profiles add constraint language_profiles_spoken_check CHECK (private.lp_spoken_ok(spoken));
alter table public.language_profiles add constraint language_profiles_ui_lang_check CHECK (((ui_lang = 'auto'::text) OR private.lp_code_ok(ui_lang)));
alter table public.language_profiles add constraint language_profiles_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'contacts'::text])));
alter table public.messages add constraint messages_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 2000)));
alter table public.messages add constraint messages_kind_check CHECK ((kind = ANY (ARRAY['text'::text, 'voice'::text, 'call'::text])));
alter table public.messages add constraint messages_lang_check CHECK (((char_length(lang) >= 2) AND (char_length(lang) <= 12)));
alter table public.ow_listings add constraint ow_listings_body_check CHECK ((char_length(body) <= 1500));
alter table public.ow_listings add constraint ow_listings_currency_check CHECK (((char_length(currency) >= 3) AND (char_length(currency) <= 3)));
alter table public.ow_listings add constraint ow_listings_kind_check CHECK ((kind = ANY (ARRAY['sell'::text, 'buy'::text, 'wholesale'::text, 'sourcing'::text, 'service'::text, 'logistics'::text, 'customs'::text, 'job'::text, 'mission'::text, 'partner'::text, 'help_need'::text, 'help_offer'::text, 'give'::text])));
alter table public.ow_listings add constraint ow_listings_lang_check CHECK (((char_length(lang) >= 2) AND (char_length(lang) <= 12)));
alter table public.ow_listings add constraint ow_listings_place_check CHECK ((char_length(place) <= 80));
alter table public.ow_listings add constraint ow_listings_price_check CHECK (((price IS NULL) OR (price >= (0)::numeric)));
alter table public.ow_listings add constraint ow_listings_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));
alter table public.ow_listings add constraint ow_listings_title_check CHECK (((char_length(btrim(title)) >= 3) AND (char_length(btrim(title)) <= 90)));
alter table public.ow_reports add constraint ow_reports_body_copy_check CHECK ((char_length(body_copy) <= 1500));
alter table public.ow_reports add constraint ow_reports_reason_check CHECK ((char_length(reason) <= 200));
alter table public.ow_reports add constraint ow_reports_target_id_check CHECK ((char_length(target_id) <= 64));
alter table public.ow_reports add constraint ow_reports_target_kind_check CHECK ((target_kind = ANY (ARRAY['room'::text, 'msg'::text, 'listing'::text])));
alter table public.ow_room_msgs add constraint ow_room_msgs_body_check CHECK (((char_length(btrim(body)) >= 1) AND (char_length(btrim(body)) <= 1000)));
alter table public.ow_room_msgs add constraint ow_room_msgs_kind_check CHECK ((kind = ANY (ARRAY['text'::text, 'caption'::text])));
alter table public.ow_room_msgs add constraint ow_room_msgs_lang_check CHECK (((char_length(lang) >= 2) AND (char_length(lang) <= 12)));
alter table public.ow_rooms add constraint ow_rooms_about_check CHECK ((char_length(about) <= 500));
alter table public.ow_rooms add constraint ow_rooms_kind_check CHECK ((kind = ANY (ARRAY['community'::text, 'live'::text])));
alter table public.ow_rooms add constraint ow_rooms_lang_check CHECK (((char_length(lang) >= 2) AND (char_length(lang) <= 12)));
alter table public.ow_rooms add constraint ow_rooms_title_check CHECK (((char_length(btrim(title)) >= 3) AND (char_length(btrim(title)) <= 80)));
alter table public.ow_rooms add constraint ow_rooms_topic_check CHECK ((topic = ANY (ARRAY['friends'::text, 'women'::text, 'support'::text, 'family'::text, 'culture'::text, 'languages'::text, 'faith'::text, 'work'::text, 'school'::text, 'markets'::text, 'travel'::text, 'other'::text])));
alter table public.profiles add constraint profiles_lang_check CHECK (((char_length(lang) >= 2) AND (char_length(lang) <= 12)));
alter table public.profiles add constraint profiles_nom_ok CHECK (((nom IS NULL) OR (((char_length(nom) >= 2) AND (char_length(nom) <= 40)) AND (nom !~ '[[:cntrl:]<>@]'::text))));
alter table public.profiles add constraint profiles_pseudo_check CHECK ((pseudo ~ '^[a-z0-9_.-]{3,20}$'::text));
alter table public.reports add constraint reports_body_copy_check CHECK ((char_length(body_copy) <= 2000));
alter table public.reports add constraint reports_reason_check CHECK ((char_length(reason) <= 500));
alter table private.avatars add constraint avatars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table private.guests add constraint guests_business_fkey FOREIGN KEY (business) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table private.guests add constraint guests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table private.presence add constraint presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table private.push_subs add constraint push_subs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table private.subscriptions add constraint subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table private.suspensions add constraint suspensions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.blocks add constraint blocks_blocked_fkey FOREIGN KEY (blocked) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.blocks add constraint blocks_blocker_fkey FOREIGN KEY (blocker) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.hidden_messages add constraint hidden_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
alter table public.hidden_messages add constraint hidden_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.language_profiles add constraint language_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.members add constraint members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
alter table public.members add constraint members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.ow_listings add constraint ow_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.ow_reports add constraint ow_reports_reporter_fkey FOREIGN KEY (reporter) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.ow_room_members add constraint ow_room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.ow_rooms(id) ON DELETE CASCADE;
alter table public.ow_room_members add constraint ow_room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.ow_room_msgs add constraint ow_room_msgs_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.ow_rooms(id) ON DELETE CASCADE;
alter table public.ow_room_msgs add constraint ow_room_msgs_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.ow_rooms add constraint ow_rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.reports add constraint reports_reporter_fkey FOREIGN KEY (reporter) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ───────────────────────── 5. Index ─────────────────────────
CREATE INDEX messages_sender_time_idx ON public.messages USING btree (sender_id, created_at DESC);
CREATE INDEX messages_sender_idx ON public.messages USING btree (sender_id);
CREATE INDEX ow_room_members_user ON public.ow_room_members USING btree (user_id);
CREATE INDEX members_user_idx ON public.members USING btree (user_id);
CREATE INDEX ow_rooms_kind_last ON public.ow_rooms USING btree (kind, last_at DESC);
CREATE INDEX push_subs_user_idx ON private.push_subs USING btree (user_id);
CREATE INDEX pseudo_history_user ON private.pseudo_history USING btree (user_id, released_at);
CREATE INDEX ow_listings_open ON public.ow_listings USING btree (status, created_at DESC);
CREATE INDEX messages_conv_idx ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX pseudo_history_pseudo ON private.pseudo_history USING btree (pseudo, released_at);
CREATE INDEX ow_room_msgs_room ON public.ow_room_msgs USING btree (room_id, id DESC);
CREATE INDEX reports_reporter_idx ON public.reports USING btree (reporter);
CREATE INDEX blocks_blocked_idx ON public.blocks USING btree (blocked);
CREATE INDEX push_log_caller_idx ON private.push_log USING btree (caller, at);
CREATE INDEX hidden_messages_message_idx ON public.hidden_messages USING btree (message_id);
CREATE INDEX rate_log_idx ON private.rate_log USING btree (user_id, action, at);

-- ───────────────────────── 6. Déclencheurs ─────────────────────────
CREATE TRIGGER profiles_welcome AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.welcome_new_profile();
CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_new_message();
CREATE TRIGGER messages_before_insert BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION private.before_message();
CREATE TRIGGER reports_before_insert BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION private.before_report();
CREATE TRIGGER lp_touch BEFORE INSERT OR UPDATE ON public.language_profiles FOR EACH ROW EXECUTE FUNCTION private.lp_touch();
CREATE TRIGGER profiles_before_write BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.before_profile();
CREATE TRIGGER profiles_after_delete AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.after_profile_gone();
CREATE TRIGGER ow_before_room BEFORE INSERT OR UPDATE ON public.ow_rooms FOR EACH ROW EXECUTE FUNCTION private.ow_before_room();
CREATE TRIGGER ow_after_room AFTER INSERT ON public.ow_rooms FOR EACH ROW EXECUTE FUNCTION private.ow_after_room();
CREATE TRIGGER ow_count_members AFTER INSERT OR DELETE ON public.ow_room_members FOR EACH ROW EXECUTE FUNCTION private.ow_count_members();
CREATE TRIGGER ow_before_msg BEFORE INSERT ON public.ow_room_msgs FOR EACH ROW EXECUTE FUNCTION private.ow_before_msg();
CREATE TRIGGER ow_before_listing BEFORE INSERT OR UPDATE ON public.ow_listings FOR EACH ROW EXECUTE FUNCTION private.ow_before_listing();
CREATE TRIGGER ow_before_report BEFORE INSERT ON public.ow_reports FOR EACH ROW EXECUTE FUNCTION private.ow_before_report();

-- ───────────────────────── 7. Protection ligne par ligne (RLS) et règles ─────────────────────────
alter table private.presence enable row level security;
alter table private.pseudo_history enable row level security;
alter table private.avatars enable row level security;
alter table public.admins enable row level security;
alter table public.stat_days enable row level security;
alter table public.stat_devices enable row level security;
alter table public.stat_presence enable row level security;
alter table public.language_profiles enable row level security;
alter table public.members enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.hidden_messages enable row level security;
alter table public.profiles enable row level security;
alter table public.ow_rooms enable row level security;
alter table public.ow_room_members enable row level security;
alter table public.ow_room_msgs enable row level security;
alter table public.ow_listings enable row level security;
alter table public.ow_reports enable row level security;

create policy bloquer on public.blocks as PERMISSIVE for INSERT to authenticated with check ((blocker = ( SELECT auth.uid() AS uid)));
create policy debloquer on public.blocks as PERMISSIVE for DELETE to authenticated using ((blocker = ( SELECT auth.uid() AS uid)));
create policy "mes blocages" on public.blocks as PERMISSIVE for SELECT to authenticated using ((blocker = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.blocks as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "mes discussions" on public.conversations as PERMISSIVE for SELECT to authenticated using (private.is_member(id));
create policy "session active" on public.conversations as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "masquer un message" on public.hidden_messages as PERMISSIVE for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "mes messages masqués" on public.hidden_messages as PERMISSIVE for SELECT to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.hidden_messages as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "mon profil linguistique" on public.language_profiles as PERMISSIVE for ALL to authenticated using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.language_profiles as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "marquer comme lu" on public.members as PERMISSIVE for UPDATE to authenticated using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "participants de mes discussions" on public.members as PERMISSIVE for SELECT to authenticated using (private.is_member(conversation_id));
create policy "quitter une discussion" on public.members as PERMISSIVE for DELETE to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.members as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "acces abonnement" on public.messages as RESTRICTIVE for INSERT to authenticated with check (private.has_access(( SELECT auth.uid() AS uid)));
create policy "compte non suspendu" on public.messages as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_suspended()));
create policy "e-mail confirme" on public.messages as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "envoyer un message" on public.messages as PERMISSIVE for INSERT to authenticated with check (((sender_id = ( SELECT auth.uid() AS uid)) AND private.is_member(conversation_id) AND (NOT private.blocked_in(conversation_id)) AND (NOT (EXISTS ( SELECT 1
   FROM (members m
     JOIN blocks b ON ((b.blocked = m.user_id)))
  WHERE ((m.conversation_id = messages.conversation_id) AND (b.blocker = ( SELECT auth.uid() AS uid))))))));
create policy "lire les messages" on public.messages as PERMISSIVE for SELECT to authenticated using ((private.is_member(conversation_id) AND (NOT (EXISTS ( SELECT 1
   FROM blocks b
  WHERE ((b.blocker = ( SELECT auth.uid() AS uid)) AND (b.blocked = messages.sender_id)))))));
create policy "session active" on public.messages as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "supprimer mes messages" on public.messages as PERMISSIVE for DELETE to authenticated using ((sender_id = ( SELECT auth.uid() AS uid)));
create policy "e-mail confirme" on public.ow_listings as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "modifier mon annonce" on public.ow_listings as PERMISSIVE for UPDATE to authenticated using ((seller_id = ( SELECT auth.uid() AS uid))) with check ((seller_id = ( SELECT auth.uid() AS uid)));
create policy "pas pour les invites" on public.ow_listings as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_guest()));
create policy "publier une annonce" on public.ow_listings as PERMISSIVE for INSERT to authenticated with check (((seller_id = ( SELECT auth.uid() AS uid)) AND (NOT private.is_suspended(( SELECT auth.uid() AS uid)))));
create policy "session active" on public.ow_listings as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "supprimer mon annonce" on public.ow_listings as PERMISSIVE for DELETE to authenticated using (((seller_id = ( SELECT auth.uid() AS uid)) OR private.is_admin()));
create policy "voir les annonces" on public.ow_listings as PERMISSIVE for SELECT to authenticated using ((((status = 'open'::text) OR (seller_id = ( SELECT auth.uid() AS uid))) AND (NOT (EXISTS ( SELECT 1
   FROM blocks b
  WHERE ((b.blocker = ( SELECT auth.uid() AS uid)) AND (b.blocked = ow_listings.seller_id)))))));
create policy moderation on public.ow_reports as PERMISSIVE for SELECT to authenticated using (private.is_admin());
create policy "moderation effacer" on public.ow_reports as PERMISSIVE for DELETE to authenticated using (private.is_admin());
create policy "session active" on public.ow_reports as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy signaler on public.ow_reports as PERMISSIVE for INSERT to authenticated with check ((reporter = ( SELECT auth.uid() AS uid)));
create policy "compte non suspendu" on public.ow_room_members as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_suspended(( SELECT auth.uid() AS uid))));
create policy "e-mail confirme" on public.ow_room_members as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "mes salons" on public.ow_room_members as PERMISSIVE for SELECT to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "pas pour les invites" on public.ow_room_members as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_guest()));
create policy quitter on public.ow_room_members as PERMISSIVE for DELETE to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));
create policy rejoindre on public.ow_room_members as PERMISSIVE for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.ow_room_members as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "e-mail confirme" on public.ow_room_msgs as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "ecrire dans un salon" on public.ow_room_msgs as PERMISSIVE for INSERT to authenticated with check (((sender_id = ( SELECT auth.uid() AS uid)) AND private.ow_is_room_member(room_id) AND (NOT private.is_suspended(( SELECT auth.uid() AS uid)))));
create policy "effacer un message" on public.ow_room_msgs as PERMISSIVE for DELETE to authenticated using (((sender_id = ( SELECT auth.uid() AS uid)) OR private.ow_is_room_owner(room_id) OR private.is_admin()));
create policy "lire un salon" on public.ow_room_msgs as PERMISSIVE for SELECT to authenticated using ((NOT (EXISTS ( SELECT 1
   FROM blocks b
  WHERE ((b.blocker = ( SELECT auth.uid() AS uid)) AND (b.blocked = ow_room_msgs.sender_id))))));
create policy "pas pour les invites" on public.ow_room_msgs as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_guest()));
create policy "session active" on public.ow_room_msgs as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "creer un salon" on public.ow_rooms as PERMISSIVE for INSERT to authenticated with check (((owner_id = ( SELECT auth.uid() AS uid)) AND (NOT private.is_suspended(( SELECT auth.uid() AS uid)))));
create policy "e-mail confirme" on public.ow_rooms as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "modifier mon salon" on public.ow_rooms as PERMISSIVE for UPDATE to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));
create policy "pas pour les invites" on public.ow_rooms as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_guest()));
create policy "session active" on public.ow_rooms as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "supprimer mon salon" on public.ow_rooms as PERMISSIVE for DELETE to authenticated using (((owner_id = ( SELECT auth.uid() AS uid)) OR private.is_admin()));
create policy "voir les salons" on public.ow_rooms as PERMISSIVE for SELECT to authenticated using (true);
create policy "creer mon profil" on public.profiles as PERMISSIVE for INSERT to authenticated with check ((id = ( SELECT auth.uid() AS uid)));
create policy "e-mail confirme" on public.profiles as RESTRICTIVE for INSERT to authenticated with check (( SELECT private.compte_verifie() AS compte_verifie));
create policy "modifier mon profil" on public.profiles as PERMISSIVE for UPDATE to authenticated using ((id = ( SELECT auth.uid() AS uid))) with check ((id = ( SELECT auth.uid() AS uid)));
create policy "mon profil et mes contacts" on public.profiles as PERMISSIVE for SELECT to authenticated using (((id = ( SELECT auth.uid() AS uid)) OR private.shares_conversation(id)));
create policy "session active" on public.profiles as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "supprimer mon profil" on public.profiles as PERMISSIVE for DELETE to authenticated using ((id = ( SELECT auth.uid() AS uid)));
create policy "session active" on public.reports as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy signaler on public.reports as PERMISSIVE for INSERT to authenticated with check ((reporter = ( SELECT auth.uid() AS uid)));

-- Temps réel (appels et salons en direct) : règles sur realtime.messages.
create policy "signal compte non suspendu" on realtime.messages as RESTRICTIVE for INSERT to authenticated with check ((NOT private.is_suspended()));
create policy "reseau recevoir dans ma boite" on realtime.messages as PERMISSIVE for SELECT to authenticated using (((extension = 'broadcast'::text) AND (( SELECT realtime.topic() AS topic) = ('user:'::text || (( SELECT auth.uid() AS uid))::text))));
create policy "reseau envoyer a un contact" on realtime.messages as PERMISSIVE for INSERT to authenticated with check (((extension = 'broadcast'::text) AND private.can_signal(( SELECT realtime.topic() AS topic))));
create policy "session active" on realtime.messages as RESTRICTIVE for ALL to authenticated using (( SELECT private.session_active() AS session_active)) with check (( SELECT private.session_active() AS session_active));
create policy "salon recevoir" on realtime.messages as PERMISSIVE for SELECT to authenticated using (((extension = 'broadcast'::text) AND private.ow_topic_member(( SELECT realtime.topic() AS topic))));
create policy "recevoir compte non suspendu" on realtime.messages as RESTRICTIVE for SELECT to authenticated using ((NOT private.is_suspended()));

-- ───────────────────────── 8. Droits ─────────────────────────
-- Un projet Supabase neuf donne tout à anon/authenticated par défaut : on retire tout, puis on rend exactement les droits du TEST.
revoke all on all tables in schema public, private from anon, authenticated;
revoke all on all functions in schema public, private from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.admins, public.blocks, public.conversations, public.hidden_messages,
  public.language_profiles, public.members, public.messages, public.ow_listings, public.ow_reports, public.ow_room_members, public.ow_room_msgs,
  public.ow_rooms, public.profiles, public.reports, public.stat_days, public.stat_devices, public.stat_presence to service_role;
grant DELETE, INSERT, SELECT on table public.blocks to authenticated;
grant SELECT on table public.conversations to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.hidden_messages to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.language_profiles to authenticated;
grant DELETE, SELECT on table public.members to authenticated;
grant DELETE, INSERT, SELECT on table public.messages to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.ow_listings to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.ow_reports to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.ow_room_members to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.ow_room_msgs to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on table public.ow_rooms to authenticated;
grant DELETE, INSERT, SELECT on table public.profiles to authenticated;
grant INSERT on table public.reports to authenticated;

-- Fonctions utilisées dans les règles : exécutables par authenticated.
grant execute on function private.session_active(), private.is_admin(), private.is_suspended(uuid), private.is_member(uuid),
  private.blocked_in(uuid), private.is_guest(uuid), private.shares_conversation(uuid), private.lp_code_ok(text),
  private.lp_spoken_ok(jsonb), private.lp_codes_ok(text[]), private.photo_visible(uuid), private.ow_name(uuid),
  private.ow_is_room_member(uuid), private.ow_is_room_owner(uuid), private.ow_topic_member(text), private.can_signal(text),
  private.has_access(uuid), private.compte_verifie() to authenticated;
-- Fonctions appelées par l'appli (connecté).
grant execute on function public.admin_moderation(), public.supprimer_mon_compte(), public.je_suis_la(boolean),
  public.langues_de_mes_contacts(), public.start_conversation(text), public.deconnecter_appareil(uuid), public.mes_appareils(),
  public.admin_ban(text, boolean), public.ow_permissions(uuid, text), public.mon_acces(), public.presence_de_mes_contacts(),
  public.mettre_ma_photo(text), public.retirer_ma_photo(), public.photos_de_mes_contacts(), public.photos(uuid[]),
  public.admin_photo(text), public.admin_retirer_photo(text), public.join_business(text, text, text), public.admin_stats(),
  public.ow_live_signal(uuid, jsonb), public.ping(uuid, boolean), public.track(uuid, text, integer) to authenticated, service_role;
grant execute on function public.on_new_message() to service_role;
-- Statistiques anonymes (constat F-31 de l'audit : à durcir, voir lot suivant).
grant execute on function public.ping(uuid, boolean), public.track(uuid, text, integer) to anon;

-- ───────────────────────── 9. Temps réel ─────────────────────────
alter publication supabase_realtime add table public.messages, public.ow_room_msgs;
