-- 24/24 ONE WORLD — l'e-mail doit être CONFIRMÉ, pas seulement présent (audit F-32 du 3 nov. 2026).
-- © 2026 Sébastien Chevrier. Tous droits réservés.
--
-- Le problème : private.compte_verifie() acceptait tout compte NON anonyme, sans regarder auth.users.email_confirmed_at.
-- Un compte avec une adresse jamais confirmée pouvait donc créer un profil, écrire, ouvrir ou rejoindre un salon et
-- publier une annonce, si la confirmation d'e-mail était un jour désactivée ou contournée dans Supabase.
-- Le correctif : un compte non anonyme ne passe que si email_confirmed_at est renseigné. Les autres cas sont inchangés :
-- comptes anciens notés par 23-email-obligatoire.sql, et invités d'une entreprise (private.guests).
-- Mêmes nom, droits et règles : seule la fonction change. Retour arrière : 25-email-confirme-verifie-retour.sql.
-- Essayé en local sur le socle reconstruit (supabase/base/essais-email-confirme-verifie.sql). TEST d'abord, PROD sur « oui ».
create or replace function private.compte_verifie() returns boolean language plpgsql stable security definer set search_path = '' as $$
declare ok boolean := false;
begin
  if exists (select 1 from auth.users u
              where u.id = auth.uid() and not coalesce(u.is_anonymous, false) and u.email_confirmed_at is not null)
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
