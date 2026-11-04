-- Retour arrière de 25-email-confirme-verifie.sql : compte_verifie() comme dans supabase/base/00-socle-schema.sql.
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
