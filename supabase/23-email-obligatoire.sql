-- 24/24 ONE WORLD — OW-012 lot 2 : e-mail confirmé obligatoire, exigé aussi par la base (pas seulement par l'appli). © 2026 Sébastien Chevrier.
-- PROPOSITION. À coller sur TEST, puis sur PROD après le « oui » de Sébastien. Retour arrière : 23-email-obligatoire-retour.sql.
-- Reprend 25-email-obligatoire.sql (essayé et appliqué sur TEST le 31 oct. 2026), avec une migration compatible :
--   au lieu d'une date fixe, un compte qui a DÉJÀ un profil au moment où ce fichier est collé garde tous ses droits
--   (comptes existants, dont celui de Sébastien). Un nouveau compte anonyme sans e-mail confirmé ne peut plus
--   créer de profil, écrire, ouvrir un salon, rejoindre un salon ni publier une annonce. Rien n'est effacé.
create table if not exists private.comptes_anciens (user_id uuid primary key, depuis timestamptz not null default now());
revoke all on private.comptes_anciens from public, anon, authenticated;
-- Migration compatible : on note une fois pour toutes les comptes qui existent déjà (ils ont un profil).
insert into private.comptes_anciens (user_id) select p.id from public.profiles p on conflict do nothing;
create or replace function private.compte_verifie() returns boolean language plpgsql stable security definer set search_path = '' as $$
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
end $$;
revoke all on function private.compte_verifie() from public, anon;
grant execute on function private.compte_verifie() to authenticated;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'messages', 'ow_rooms', 'ow_room_members', 'ow_room_msgs', 'ow_listings'] loop
    execute format('drop policy if exists "e-mail confirme" on public.%I', t);
    execute format('create policy "e-mail confirme" on public.%I as restrictive for insert to authenticated with check ((select private.compte_verifie()))', t);
  end loop;
end $$;
-- Démarrer une conversation passe par une fonction du serveur (qui contourne les règles) : même contrôle dedans.
do $$
declare d text := pg_get_functiondef('public.start_conversation(text)'::regprocedure);
  l text := 'if private.is_suspended(me) then raise exception ''SUSPENDED''; end if;';
begin
  if position(l in d) > 0 and position('EMAIL_REQUIRED' in d) = 0 then
    execute replace(d, l, l || ' if not private.compte_verifie() then raise exception ''EMAIL_REQUIRED''; end if;');
  end if;
end $$;

-- VÉRIFICATION (lecture seule) : 6 règles « e-mail confirme », contrôle présent dans start_conversation, comptes anciens notés.
-- select (select count(*) from pg_policies where policyname = 'e-mail confirme') as regles,
--        position('EMAIL_REQUIRED' in pg_get_functiondef('public.start_conversation(text)'::regprocedure)) > 0 as conversation,
--        (select count(*) from private.comptes_anciens) as comptes_anciens;
