-- OW-012 lot 2 : retour arrière exact de 23-email-obligatoire.sql (ne supprime aucun compte ni aucun message).
do $$
declare t text; d text := pg_get_functiondef('public.start_conversation(text)'::regprocedure);
begin
  foreach t in array array['profiles', 'messages', 'ow_rooms', 'ow_room_members', 'ow_room_msgs', 'ow_listings'] loop
    execute format('drop policy if exists "e-mail confirme" on public.%I', t);
  end loop;
  execute replace(d, ' if not private.compte_verifie() then raise exception ''EMAIL_REQUIRED''; end if;', '');
end $$;
drop function if exists private.compte_verifie();
drop table if exists private.comptes_anciens;
