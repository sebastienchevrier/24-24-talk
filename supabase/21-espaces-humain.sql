-- 24/24 ONE WORLD — pour chaque humain (26 oct. 2026). © 2026 Sébastien Chevrier.
-- Entraide et dons gratuits (dans les annonces), thèmes des communautés (Femmes, Soutien…), signalements.
alter table public.ow_listings drop constraint if exists ow_listings_kind_check;
alter table public.ow_listings add constraint ow_listings_kind_check
  check (kind in ('sell', 'buy', 'wholesale', 'sourcing', 'service', 'logistics', 'customs', 'job', 'mission', 'partner', 'help_need', 'help_offer', 'give'));

alter table public.ow_rooms add column if not exists topic text not null default 'other'
  check (topic in ('friends', 'women', 'support', 'family', 'culture', 'languages', 'faith', 'work', 'school', 'markets', 'travel', 'other'));

-- Signaler un salon, un message de salon ou une annonce : copie du texte gardée pour la modération (admins seulement).
create table if not exists public.ow_reports (
  id bigint generated always as identity primary key,
  reporter uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_kind text not null check (target_kind in ('room', 'msg', 'listing')),
  target_id text not null check (char_length(target_id) <= 64),
  target_user uuid,
  body_copy text not null default '' check (char_length(body_copy) <= 1500),
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
create or replace function private.ow_before_report() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.reporter := auth.uid();
  if (select count(*) from public.ow_reports r where r.reporter = new.reporter and r.created_at > now() - interval '1 day') >= 30 then
    raise exception 'OW_RATE' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end $$;
create trigger ow_before_report before insert on public.ow_reports for each row execute function private.ow_before_report();
alter table public.ow_reports enable row level security;
create policy "session active" on public.ow_reports as restrictive for all to authenticated using ((select private.session_active())) with check ((select private.session_active()));
create policy "signaler" on public.ow_reports for insert to authenticated with check (reporter = (select auth.uid()));
create policy "moderation" on public.ow_reports for select to authenticated using (private.is_admin());
create policy "moderation effacer" on public.ow_reports for delete to authenticated using (private.is_admin());
grant select, insert, delete on public.ow_reports to authenticated;
revoke all on public.ow_reports from anon;
