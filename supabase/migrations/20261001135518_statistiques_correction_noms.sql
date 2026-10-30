create or replace function public.track(sid uuid, kind text, amount integer default 1)
returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  d date := (now() at time zone 'Indian/Reunion')::date;
  k text := track.kind;
  a integer := greatest(1, least(coalesce(track.amount, 1), 7200));
  s_id uuid := track.sid;
begin
  if k is null or k not in ('ouverture', 'traduction', 'appel', 'appel_sec') then return; end if;
  insert into public.stat_days as s (day, kind, n) values (d, k, a)
    on conflict (day, kind) do update set n = s.n + excluded.n;
  if k = 'ouverture' and s_id is not null then
    insert into public.stat_devices (day, sid) values (d, s_id) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.ping(sid uuid, net boolean default false)
returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  s_id uuid := ping.sid;
  on_net boolean := coalesce(ping.net, false);
begin
  if s_id is null then return; end if;
  insert into public.stat_presence as p (sid, last_seen, net) values (s_id, now(), on_net)
    on conflict (sid) do update set last_seen = now(), net = excluded.net;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end;
$$;

revoke all on function public.track(uuid, text, integer), public.ping(uuid, boolean) from public;
grant execute on function public.track(uuid, text, integer), public.ping(uuid, boolean) to anon, authenticated;