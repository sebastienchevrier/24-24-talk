-- 24/24 ONE WORLD — statistiques anonymes plus difficiles à gonfler (audit F-31 du 3 nov. 2026).
-- © 2026 Sébastien Chevrier. Tous droits réservés.
--
-- Le problème : public.track et public.ping sont appelables par n'importe qui avec la clé publique, et l'identifiant
-- d'appareil (sid) est fourni par le navigateur. Un script peut donc gonfler ouvertures, traductions, appels, minutes et
-- « personnes ». Une statistique anonyme ne peut pas être rendue infalsifiable. On peut en revanche borner la triche :
--   1. par appareil et par jour : un même sid ne compte que jusqu'à un plafond réaliste par type ;
--   2. par adresse réseau et par jour : au plus 10 nouveaux appareils comptés par adresse. L'adresse n'est jamais
--      gardée en clair : seulement une empreinte sha256 salée avec le jour, effacée après 2 jours ;
--   3. minutes d'appel : au plus 12 h par appareil et par jour (au lieu de 2 h par appel, sans limite de nombre).
-- Les compteurs restent INDICATIFS. Ils ne doivent pas servir de preuve commerciale sans source indépendante.
--
-- Ce qui ne change pas : mêmes noms, mêmes paramètres, mêmes droits. L'appli n'a rien à modifier.
-- Retour arrière : 24-stats-anti-triche-retour.sql
-- Essayé en local sur le socle reconstruit (supabase/base/essais-stats.sql). À appliquer d'abord sur le TEST, puis la
-- PROD seulement sur le « oui » de Sébastien.

create table if not exists private.stat_quota (
  day date not null,
  cle text not null,
  n bigint not null default 0,
  primary key (day, cle)
);
revoke all on private.stat_quota from public, anon, authenticated;

-- Ajoute « combien » au compteur « p_cle » du jour. Renvoie ce qui reste réellement accordé (0 si le plafond est atteint).
create or replace function private.stat_accorder(p_cle text, combien bigint, plafond bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Indian/Reunion')::date; deja bigint;
begin
  if combien <= 0 then return 0; end if;
  insert into private.stat_quota as q (day, cle, n) values (d, p_cle, 0) on conflict (day, cle) do nothing;
  select q.n into deja from private.stat_quota q where q.day = d and q.cle = p_cle for update;
  if deja >= plafond then return 0; end if;
  combien := least(combien, plafond - deja);
  update private.stat_quota q set n = q.n + combien where q.day = d and q.cle = p_cle;
  if random() < 0.01 then delete from private.stat_quota where day < d - 2; end if;
  return combien;
end $$;

-- Empreinte de l'adresse réseau de l'appelant (jamais l'adresse en clair), salée avec le jour.
-- null si aucune en-tête (appel interne) : pas de limite par adresse dans ce cas.
create or replace function private.stat_reseau()
returns text language plpgsql stable security definer set search_path = '' as $$
declare h json; ip text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::json; exception when others then return 'illisible'; end;
  if h is null then return null; end if;
  ip := coalesce(nullif(btrim(h->>'cf-connecting-ip'), ''), nullif(btrim(split_part(h->>'x-forwarded-for', ',', 1)), ''), nullif(btrim(h->>'x-real-ip'), ''));
  if ip is null then return 'inconnue'; end if;
  return encode(extensions.digest(ip || '|' || ((now() at time zone 'Indian/Reunion')::date)::text, 'sha256'), 'hex');
exception when undefined_function or invalid_schema_name then
  return md5(ip || '|' || ((now() at time zone 'Indian/Reunion')::date)::text);
end $$;

-- Un appareil inconnu aujourd'hui ne compte que si son adresse réseau n'a pas déjà amené 10 appareils.
create or replace function private.stat_nouvel_appareil_ok(s_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r text := private.stat_reseau();
begin
  if exists (select 1 from private.stat_quota q where q.day = (now() at time zone 'Indian/Reunion')::date and q.cle = 'vu:' || s_id::text) then
    return true;
  end if;
  if r is not null and private.stat_accorder('res:' || r, 1, 10) = 0 then return false; end if;
  perform private.stat_accorder('vu:' || s_id::text, 1, 1);
  return true;
end $$;

create or replace function public.track(sid uuid, kind text, amount integer default 1)
returns void language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  d date := (now() at time zone 'Indian/Reunion')::date;
  k text := track.kind;
  a bigint;
  s_id uuid := track.sid;
  plafond bigint;
begin
  if k is null or k not in ('ouverture', 'traduction', 'appel', 'appel_sec', 'voix_ok', 'voix_echec', 'voix_relais') then
    return;
  end if;
  if not private.stats_origin_ok() then return; end if;
  -- F-31 : sans identifiant d'appareil, rien n'est compté (avant : compté sans limite).
  if s_id is null then return; end if;
  if not private.stat_nouvel_appareil_ok(s_id) then return; end if;
  a := case when k = 'appel_sec' then greatest(1, least(coalesce(track.amount, 1), 7200)) else 1 end;
  -- Plafonds réalistes par appareil et par jour.
  plafond := case k when 'ouverture' then 50 when 'traduction' then 3000 when 'appel_sec' then 43200 else 300 end;
  a := private.stat_accorder('sid:' || s_id::text || ':' || k, a, plafond);
  if a = 0 then return; end if;
  if exists (select 1 from public.stat_days where day = d and kind = k and n >= 1000000) then return; end if;
  insert into public.stat_days as s (day, kind, n) values (d, k, a)
    on conflict (day, kind) do update set n = s.n + excluded.n;
  if k = 'ouverture'
     and (select count(*) from public.stat_devices where day = d) < 20000 then
    insert into public.stat_devices (day, sid) values (d, s_id) on conflict do nothing;
  end if;
end $$;

create or replace function public.ping(sid uuid, net boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  s_id uuid := ping.sid;
  on_net boolean := coalesce(ping.net, false);
begin
  if s_id is null then return; end if;
  if not private.stats_origin_ok() then return; end if;
  if exists (select 1 from public.stat_presence where sid = s_id) then
    -- au plus une mise à jour toutes les 20 s par appareil
    update public.stat_presence set last_seen = now(), net = on_net where sid = s_id and last_seen < now() - interval '20 seconds';
  elsif (select count(*) from public.stat_presence) < 5000 and private.stat_nouvel_appareil_ok(s_id) then
    insert into public.stat_presence (sid, last_seen, net) values (s_id, now(), on_net)
      on conflict (sid) do update set last_seen = now(), net = excluded.net;
  end if;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end $$;

-- Mêmes droits qu'avant : seules ping et track sont appelables (y compris anonymement) ; les nouvelles fonctions non.
revoke all on function private.stat_accorder(text, bigint, bigint), private.stat_reseau(), private.stat_nouvel_appareil_ok(uuid) from public, anon, authenticated;
grant execute on function public.ping(uuid, boolean), public.track(uuid, text, integer) to anon, authenticated, service_role;
