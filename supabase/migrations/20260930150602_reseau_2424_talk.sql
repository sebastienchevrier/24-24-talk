-- 24/24 Talk Réseau — base de données. © 2026 Sébastien Chevrier. Tous droits réservés.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null unique check (pseudo ~ '^[a-z0-9_.]{3,20}$'),
  lang text not null default 'fr' check (char_length(lang) between 2 and 12),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create table if not exists public.members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists members_user_idx on public.members(user_id);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  lang text not null check (char_length(lang) between 2 and 12),
  kind text not null default 'text' check (kind in ('text', 'voice')),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at desc);

create table if not exists public.blocks (
  blocker uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid default auth.uid() references public.profiles(id) on delete set null,
  reported uuid,
  message_id bigint,
  body_copy text check (char_length(body_copy) <= 2000),
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create or replace function public.is_member(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where conversation_id = conv and user_id = auth.uid());
$$;

create or replace function public.blocked_in(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m join public.blocks b on b.blocker = m.user_id and b.blocked = auth.uid()
     where m.conversation_id = conv
  );
$$;

create or replace function public.start_conversation(other_pseudo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  select id into other from public.profiles where pseudo = lower(trim(other_pseudo));
  if other is null then raise exception 'NOT_FOUND'; end if;
  if other = me then raise exception 'SELF'; end if;
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
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end;
$$;

create or replace function public.on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  delete from public.messages where conversation_id = new.conversation_id and created_at < now() - interval '90 days';
  return new;
end;
$$;
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_new_message();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.members enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profils visibles" on public.profiles;
create policy "profils visibles" on public.profiles for select to authenticated using (true);
drop policy if exists "creer mon profil" on public.profiles;
create policy "creer mon profil" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "modifier mon profil" on public.profiles;
create policy "modifier mon profil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "supprimer mon profil" on public.profiles;
create policy "supprimer mon profil" on public.profiles for delete to authenticated using (id = auth.uid());

drop policy if exists "mes discussions" on public.conversations;
create policy "mes discussions" on public.conversations for select to authenticated using (public.is_member(id));

drop policy if exists "participants de mes discussions" on public.members;
create policy "participants de mes discussions" on public.members for select to authenticated using (public.is_member(conversation_id));
drop policy if exists "marquer comme lu" on public.members;
create policy "marquer comme lu" on public.members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "quitter une discussion" on public.members;
create policy "quitter une discussion" on public.members for delete to authenticated using (user_id = auth.uid());

drop policy if exists "lire les messages" on public.messages;
create policy "lire les messages" on public.messages for select to authenticated using (
  public.is_member(conversation_id)
  and not exists (select 1 from public.blocks b where b.blocker = auth.uid() and b.blocked = messages.sender_id)
);
drop policy if exists "envoyer un message" on public.messages;
create policy "envoyer un message" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and public.is_member(conversation_id)
  and not public.blocked_in(conversation_id)
);
drop policy if exists "supprimer mes messages" on public.messages;
create policy "supprimer mes messages" on public.messages for delete to authenticated using (sender_id = auth.uid());

drop policy if exists "mes blocages" on public.blocks;
create policy "mes blocages" on public.blocks for select to authenticated using (blocker = auth.uid());
drop policy if exists "bloquer" on public.blocks;
create policy "bloquer" on public.blocks for insert to authenticated with check (blocker = auth.uid());
drop policy if exists "debloquer" on public.blocks;
create policy "debloquer" on public.blocks for delete to authenticated using (blocker = auth.uid());

drop policy if exists "signaler" on public.reports;
create policy "signaler" on public.reports for insert to authenticated with check (reporter = auth.uid());

revoke all on public.profiles, public.conversations, public.members, public.messages, public.blocks, public.reports from anon, authenticated;
grant select, insert, delete on public.profiles to authenticated;
grant update (pseudo, lang) on public.profiles to authenticated;
grant select on public.conversations to authenticated;
grant select, delete on public.members to authenticated;
grant update (last_read) on public.members to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;
revoke execute on function public.start_conversation(text) from public, anon;
grant execute on function public.start_conversation(text) to authenticated;
revoke execute on function public.is_member(uuid), public.blocked_in(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.blocked_in(uuid) to authenticated;
revoke execute on function public.on_new_message() from public, anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;