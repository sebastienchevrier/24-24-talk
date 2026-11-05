-- Rattrapage : éléments présents dans la base en production (constatés le 3 octobre 2026)
-- mais appliqués sans migration. Ce fichier ne change rien en production : il permet
-- seulement de reconstruire la même base à partir du dépôt (préproduction, secours).
-- Toutes les instructions sont rejouables sans effet si elles sont déjà en place.

-- 1. Les appels sont inscrits dans la discussion : type de message « call ».
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'voice', 'call'));

-- 2. Message de bienvenue envoyé par l'administrateur à chaque nouveau profil.
create or replace function private.welcome_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admin_id uuid;
  conv uuid;
begin
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
$$;
revoke all on function private.welcome_new_profile() from public, anon, authenticated, service_role;

drop trigger if exists profiles_welcome on public.profiles;
create trigger profiles_welcome after insert on public.profiles
  for each row execute function private.welcome_new_profile();

-- 3. Non repris ici : l'extension « http » est encore installée en production alors que les
--    migrations « remove_temp_http » la retirent. Aucun code du dépôt ne l'utilise ; sa
--    suppression éventuelle sera proposée à part, avec l'accord de Sébastien.