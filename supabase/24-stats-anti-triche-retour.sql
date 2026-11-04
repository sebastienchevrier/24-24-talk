-- Retour arrière de 24-stats-anti-triche.sql : remet track et ping comme dans supabase/base/00-socle-schema.sql.
create or replace function public.track(sid uuid, kind text, amount integer default 1)
returns void language plpgsql security definer set search_path = '' as $$
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
    update public.stat_presence set last_seen = now(), net = on_net where sid = s_id;
  elsif (select count(*) from public.stat_presence) < 5000 then
    insert into public.stat_presence (sid, last_seen, net) values (s_id, now(), on_net)
      on conflict (sid) do update set last_seen = now(), net = excluded.net;
  end if;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end $$;
drop function if exists private.stat_nouvel_appareil_ok(uuid);
drop function if exists private.stat_reseau();
drop function if exists private.stat_accorder(text, bigint, bigint);
drop table if exists private.stat_quota;
