-- Statistiques d'audience anonymes de 24/24 Talk + tableau de bord réservé à l'administrateur.
-- Aucune donnée personnelle : identifiant d'appareil tiré au hasard (pas d'IP, pas de nom, pas de lien
-- avec le compte réseau), comptes agrégés par jour.

create table if not exists public.stat_days (
  day date not null,
  kind text not null,
  n bigint not null default 0,
  primary key (day, kind)
);
create table if not exists public.stat_devices (
  day date not null,
  sid uuid not null,
  primary key (day, sid)
);
create table if not exists public.stat_presence (
  sid uuid primary key,
  last_seen timestamptz not null default now(),
  net boolean not null default false
);
create table if not exists public.admins (
  uid uuid primary key
);
alter table public.stat_days enable row level security;
alter table public.stat_devices enable row level security;
alter table public.stat_presence enable row level security;
alter table public.admins enable row level security;
revoke all on public.stat_days, public.stat_devices, public.stat_presence, public.admins from anon, authenticated;

create or replace function public.track(sid uuid, kind text, amount integer default 1)
returns void language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Indian/Reunion')::date;
begin
  if kind is null or kind not in ('ouverture', 'traduction', 'appel', 'appel_sec') then return; end if;
  amount := greatest(1, least(coalesce(amount, 1), 7200));
  insert into public.stat_days as s (day, kind, n) values (d, kind, amount)
    on conflict (day, kind) do update set n = s.n + excluded.n;
  if kind = 'ouverture' and sid is not null then
    insert into public.stat_devices (day, sid) values (d, sid) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.ping(sid uuid, net boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if sid is null then return; end if;
  insert into public.stat_presence as p (sid, last_seen, net) values (sid, now(), coalesce(net, false))
    on conflict (sid) do update set last_seen = now(), net = excluded.net;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end;
$$;

revoke all on function public.track(uuid, text, integer), public.ping(uuid, boolean) from public;
grant execute on function public.track(uuid, text, integer), public.ping(uuid, boolean) to anon, authenticated;

create or replace function public.admin_stats()
returns json language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Indian/Reunion')::date;
  res json;
begin
  if auth.uid() is null or not exists (select 1 from public.admins where uid = auth.uid()) then
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
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

insert into public.admins (uid) select id from public.profiles where pseudo = 'seb1975' on conflict do nothing;