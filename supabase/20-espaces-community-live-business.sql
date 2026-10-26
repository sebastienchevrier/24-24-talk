-- 24/24 ONE WORLD — espaces COMMUNITY, LIVE et BUSINESS (26 oct. 2026). © 2026 Sébastien Chevrier.
-- Communautés et directs : un salon (ow_rooms) et ses messages (ow_room_msgs), chacun lit dans sa langue (traduction côté téléphone).
-- BUSINESS : petites annonces (ow_listings) ; le contact passe par la messagerie habituelle (lien d'ajout du vendeur).
-- Mêmes garde-fous que la messagerie : session active, compte suspendu bloqué, blocages respectés, limites anti-spam.

create table if not exists public.ow_rooms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('community', 'live')),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  about text not null default '' check (char_length(about) <= 500),
  lang text not null default 'fr' check (char_length(lang) between 2 and 12),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  owner_name text not null default '',
  members int not null default 0,
  live_on boolean not null default false,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create index if not exists ow_rooms_kind_last on public.ow_rooms (kind, last_at desc);

create table if not exists public.ow_room_members (
  room_id uuid not null references public.ow_rooms(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists ow_room_members_user on public.ow_room_members (user_id);

create table if not exists public.ow_room_msgs (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.ow_rooms(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  sender_name text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  lang text not null default 'fr' check (char_length(lang) between 2 and 12),
  kind text not null default 'text' check (kind in ('text', 'caption')),
  created_at timestamptz not null default now()
);
create index if not exists ow_room_msgs_room on public.ow_room_msgs (room_id, id desc);

create table if not exists public.ow_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  seller_name text not null default '',
  seller_pseudo text not null default '',
  kind text not null default 'sell' check (kind in ('sell', 'buy', 'wholesale', 'sourcing', 'service', 'partner')),
  title text not null check (char_length(btrim(title)) between 3 and 90),
  body text not null default '' check (char_length(body) <= 1500),
  lang text not null default 'fr' check (char_length(lang) between 2 and 12),
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'EUR' check (char_length(currency) between 3 and 3),
  place text not null default '' check (char_length(place) <= 80),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists ow_listings_open on public.ow_listings (status, created_at desc);

-- Nom affiché, propriétaire, compteurs et limites : remplis par le serveur, jamais par le téléphone.
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

create or replace function private.ow_before_msg() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.sender_id := auth.uid();
  if (select count(*) from public.ow_room_msgs m where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'OW_RATE' using errcode = 'P0001';
  end if;
  -- Sous-titres d'un direct : seul l'animateur du salon en écrit.
  if new.kind = 'caption' and not exists (select 1 from public.ow_rooms r where r.id = new.room_id and r.owner_id = new.sender_id) then
    new.kind := 'text';
  end if;
  new.sender_name := coalesce(private.ow_name(new.sender_id), '');
  new.created_at := now();
  update public.ow_rooms set last_at = now() where id = new.room_id;
  return new;
end $$;
drop trigger if exists ow_before_msg on public.ow_room_msgs;
create trigger ow_before_msg before insert on public.ow_room_msgs for each row execute function private.ow_before_msg();

create or replace function private.ow_before_listing() returns trigger language plpgsql security definer set search_path = '' as $$
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
end $$;
drop trigger if exists ow_before_listing on public.ow_listings;
create trigger ow_before_listing before insert or update on public.ow_listings for each row execute function private.ow_before_listing();

create or replace function private.ow_is_room_member(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ow_room_members m where m.room_id = rid and m.user_id = auth.uid())
$$;
create or replace function private.ow_topic_member(topic text) returns boolean language sql stable security definer set search_path = '' as $$
  select topic ~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and exists (select 1 from public.ow_room_members m where m.room_id = substr(topic, 6)::uuid and m.user_id = auth.uid())
$$;
create or replace function private.ow_is_room_owner(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ow_rooms r where r.id = rid and r.owner_id = auth.uid())
$$;

alter table public.ow_rooms enable row level security;
alter table public.ow_room_members enable row level security;
alter table public.ow_room_msgs enable row level security;
alter table public.ow_listings enable row level security;

-- Session active obligatoire partout (comme la messagerie).
create policy "session active" on public.ow_rooms as restrictive for all to authenticated using ((select private.session_active())) with check ((select private.session_active()));
create policy "session active" on public.ow_room_members as restrictive for all to authenticated using ((select private.session_active())) with check ((select private.session_active()));
create policy "session active" on public.ow_room_msgs as restrictive for all to authenticated using ((select private.session_active())) with check ((select private.session_active()));
create policy "session active" on public.ow_listings as restrictive for all to authenticated using ((select private.session_active())) with check ((select private.session_active()));

-- Salons : publics (tout compte les voit), créés par un compte non suspendu, modifiés ou supprimés par leur créateur ou un admin.
create policy "voir les salons" on public.ow_rooms for select to authenticated using (true);
create policy "creer un salon" on public.ow_rooms for insert to authenticated with check (owner_id = (select auth.uid()) and not private.is_suspended((select auth.uid())));
create policy "modifier mon salon" on public.ow_rooms for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "supprimer mon salon" on public.ow_rooms for delete to authenticated using (owner_id = (select auth.uid()) or private.is_admin());

create policy "mes salons" on public.ow_room_members for select to authenticated using (user_id = (select auth.uid()));
create policy "rejoindre" on public.ow_room_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "quitter" on public.ow_room_members for delete to authenticated using (user_id = (select auth.uid()));

create policy "lire un salon" on public.ow_room_msgs for select to authenticated using (
  not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = ow_room_msgs.sender_id));
create policy "ecrire dans un salon" on public.ow_room_msgs for insert to authenticated with check (
  sender_id = (select auth.uid()) and private.ow_is_room_member(room_id) and not private.is_suspended((select auth.uid())));
create policy "effacer un message" on public.ow_room_msgs for delete to authenticated using (
  sender_id = (select auth.uid()) or private.ow_is_room_owner(room_id) or private.is_admin());

create policy "voir les annonces" on public.ow_listings for select to authenticated using (
  (status = 'open' or seller_id = (select auth.uid()))
  and not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = ow_listings.seller_id));
create policy "publier une annonce" on public.ow_listings for insert to authenticated with check (seller_id = (select auth.uid()) and not private.is_suspended((select auth.uid())));
create policy "modifier mon annonce" on public.ow_listings for update to authenticated using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));
create policy "supprimer mon annonce" on public.ow_listings for delete to authenticated using (seller_id = (select auth.uid()) or private.is_admin());

grant select, insert, update, delete on public.ow_rooms, public.ow_room_members, public.ow_room_msgs, public.ow_listings to authenticated;
revoke all on public.ow_rooms, public.ow_room_members, public.ow_room_msgs, public.ow_listings from anon;

-- Messages des salons en direct sur les téléphones.
alter publication supabase_realtime add table public.ow_room_msgs;

-- LIVE en vidéo : canal « room:<id> » (signalisation d'un téléphone à l'autre), réservé aux membres du salon.
create policy "salon envoyer" on realtime.messages for insert to authenticated with check (
  extension = 'broadcast' and private.ow_topic_member((select realtime.topic())));
create policy "salon recevoir" on realtime.messages for select to authenticated using (
  extension = 'broadcast' and private.ow_topic_member((select realtime.topic())));
