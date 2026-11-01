-- 24/24 ONE WORLD — OW-012-A1 (lot 1) : compteur de membres des salons. © 2026 Sébastien Chevrier.
-- PROPOSITION. NON APPLIQUÉ. À coller d'abord sur TEST, puis sur PROD seulement après le « oui » de Sébastien.
--
-- Défaut (supabase/20-espaces-community-live-business.sql) :
--   ow_count_members (après rejoindre / quitter) fait UPDATE ow_rooms SET members = <nombre réel>,
--   mais le déclencheur ow_before_room (avant chaque UPDATE) remet aussitôt new.members := old.members.
--   Résultat : le compteur reste à 0 pour toujours (le créateur lui-même n'est jamais compté).
--
-- Correctif minimal : le déclencheur garde sa protection contre un téléphone qui voudrait écrire un faux nombre
-- (UPDATE direct = profondeur 1 → members remis à l'ancienne valeur), mais laisse passer le recomptage
-- fait par le serveur lui-même (UPDATE lancé depuis un autre déclencheur = profondeur 2 ou plus).
-- Aucune table, colonne ou règle d'accès n'est ajoutée ni modifiée. Aucune donnée n'est supprimée.

create or replace function private.ow_before_room() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    if (select count(*) from public.ow_rooms r where r.owner_id = new.owner_id and r.created_at > now() - interval '1 day') >= 5 then
      raise exception 'OW_RATE' using errcode = 'P0001';
    end if;
    new.members := 0; new.created_at := now(); new.last_at := now();
  else
    new.owner_id := old.owner_id; new.created_at := old.created_at; new.kind := old.kind;
    -- OW-012-A1 : seul le recomptage du serveur (ow_count_members, déclencheur imbriqué) peut changer le compteur.
    if pg_trigger_depth() <= 1 then new.members := old.members; end if;
  end if;
  new.owner_name := coalesce(private.ow_name(new.owner_id), '');
  return new;
end $$;

-- ÉTAPE 2 (FACULTATIVE, change des données : uniquement avec un « oui » séparé de Sébastien) :
-- remettre les compteurs existants au nombre réel de membres. Ne supprime rien, ne touche qu'à la colonne members.
-- update public.ow_rooms r set members = (select count(*) from public.ow_room_members m where m.room_id = r.id)
--  where r.members is distinct from (select count(*) from public.ow_room_members m where m.room_id = r.id);

-- VÉRIFICATION (lecture seule) : doit répondre true / true.
-- select position('pg_trigger_depth' in pg_get_functiondef('private.ow_before_room'::regproc)) > 0 as correctif_present,
--        not exists (select 1 from public.ow_rooms r where r.members <> (select count(*) from public.ow_room_members m where m.room_id = r.id)) as compteurs_justes;

-- RETOUR ARRIÈRE : recoller la fonction d'origine (supabase/20-espaces-community-live-business.sql, lignes 63-76).
