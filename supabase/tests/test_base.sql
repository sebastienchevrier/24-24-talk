-- Tests de base des règles d'accès (RLS). Chaque bloc échoue bruyamment si une règle est cassée.
-- Trois personnes : l'administrateur, Ana et Ben. Carl n'est dans aucune de leurs discussions.
\set adm '00000000-0000-0000-0000-00000000000a'
\set ana '00000000-0000-0000-0000-0000000000a1'
\set ben '00000000-0000-0000-0000-0000000000b1'
\set carl '00000000-0000-0000-0000-0000000000c1'
insert into auth.users (id) values (:'adm'), (:'ana'), (:'ben'), (:'carl');
insert into public.profiles (id, pseudo, lang) values (:'adm', 'admin_test', 'fr');
insert into public.admins (uid) values (:'adm');
insert into public.profiles (id, pseudo, lang) values (:'ana', 'ana', 'fr'), (:'ben', 'ben', 'mg'), (:'carl', 'carl', 'en');

do $$ begin
  -- Message de bienvenue : une discussion avec l'administrateur pour chaque nouveau profil.
  if (select count(*) from public.messages where body like 'Bienvenue @%') <> 3 then
    raise exception 'ECHEC bienvenue : 3 messages attendus';
  end if;
end $$;

-- Ana ouvre une discussion avec Ben et écrit.
set role authenticated;
set "request.jwt.claim.sub" = :'ana';
select public.start_conversation('ben') as conv \gset

insert into public.messages (conversation_id, body, lang) values (:'conv', 'Bonjour', 'fr');

-- Carl ne voit ni la discussion ni le message.
set "request.jwt.claim.sub" = :'carl';
do $$ begin
  if exists (select 1 from public.messages where body = 'Bonjour') then
    raise exception 'ECHEC : un tiers lit un message privé';
  end if;
end $$;

-- Ben voit le message ; après avoir bloqué Ana, il ne le voit plus et Ana ne peut plus écrire.
set "request.jwt.claim.sub" = :'ben';
do $$ begin
  if not exists (select 1 from public.messages where body = 'Bonjour') then
    raise exception 'ECHEC : le destinataire ne lit pas le message';
  end if;
end $$;
insert into public.blocks (blocked) values (:'ana');
do $$ begin
  if exists (select 1 from public.messages where body = 'Bonjour') then
    raise exception 'ECHEC : message visible malgré le blocage';
  end if;
end $$;
set "request.jwt.claim.sub" = :'ana';
do $$ begin
  begin
    insert into public.messages (conversation_id, body, lang)
      select a.conversation_id, 'Encore moi', 'fr'
        from public.members a join public.members b on b.conversation_id = a.conversation_id
        join public.profiles p on p.id = b.user_id and p.pseudo = 'ben'
       where a.user_id = auth.uid();
    raise exception 'ECHEC : message envoyé à quelqu''un qui a bloqué';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Les statistiques sont réservées à l'administrateur.
do $$ begin
  begin
    perform public.admin_stats();
    raise exception 'ECHEC : statistiques lisibles par un non-administrateur';
  exception when raise_exception then
    if sqlerrm <> 'NOT_ADMIN' then raise; end if;
  end;
end $$;
reset role;
