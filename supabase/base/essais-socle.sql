-- 24/24 ONE WORLD — essais du socle reconstruit (base locale vide seulement). Chaque essai qui échoue arrête tout.
create function pg_temp.ok(c boolean, nom text) returns void language plpgsql as $$
begin if c is distinct from true then raise exception 'ÉCHEC : %', nom; end if; raise notice 'OK  %', nom; end $$;
create function pg_temp.qui(u text, s text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'session_id', s, 'role', 'authenticated')::text, false) $$;

-- 1. Inventaire identique au TEST relevé le 4 nov. 2026
select pg_temp.ok((select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r') = 32, '32 tables');
select pg_temp.ok((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f') = 55, '55 fonctions');
select pg_temp.ok((select count(*) from pg_policies where schemaname in ('public','private')) = 61, '61 règles public/private');
select pg_temp.ok((select count(*) from pg_policies where schemaname = 'realtime') = 6, '6 règles temps réel');
select pg_temp.ok((select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','private')) = 13, '13 déclencheurs');
select pg_temp.ok(to_regprocedure('private.session_active()') is not null and to_regprocedure('private.is_suspended(uuid)') is not null and to_regprocedure('private.is_admin()') is not null, 'F-30 : session_active, is_suspended, is_admin présentes');
select pg_temp.ok(not has_function_privilege('anon', 'public.start_conversation(text)', 'execute'), 'anon ne peut pas lancer une discussion');

-- 2. Comptes fictifs (A admin, B, C), une session chacun
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'a@essai.local', now()),
  ('00000000-0000-0000-0000-00000000000b', 'b@essai.local', now()),
  ('00000000-0000-0000-0000-00000000000c', 'c@essai.local', now());
insert into auth.sessions (id, user_id) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b'),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c');
insert into public.admins values ('00000000-0000-0000-0000-00000000000a');
insert into private.billing_settings (free_until) values ('2100-01-01');

set role authenticated;
select pg_temp.qui('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a');
insert into public.profiles (id, pseudo) values ('00000000-0000-0000-0000-00000000000a', 'admin');
select pg_temp.ok(private.is_admin(), 'is_admin vrai pour l''admin avec session');
select pg_temp.qui('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b');
insert into public.profiles (id, pseudo) values ('00000000-0000-0000-0000-00000000000b', 'bea');
select pg_temp.ok((select count(*) from public.messages) = 1, 'message de bienvenue reçu par B');
select pg_temp.ok(not private.is_admin(), 'is_admin faux pour B');
select pg_temp.qui('00000000-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-00000000000c');
insert into public.profiles (id, pseudo) values ('00000000-0000-0000-0000-00000000000c', 'cyril');

-- 3. Discussion B ↔ C
select pg_temp.qui('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b');
select set_config('essai.conv', public.start_conversation('cyril')::text, false);
insert into public.messages (conversation_id, body, lang) values (current_setting('essai.conv')::uuid, 'Bonjour', 'fr');
select pg_temp.qui('00000000-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-00000000000c');
select pg_temp.ok((select count(*) from public.messages where body = 'Bonjour') = 1, 'C lit le message de B');
select pg_temp.qui('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select count(*) from public.messages where body = 'Bonjour') = 0, 'A (hors discussion) ne le lit pas');

-- 4. Session révoquée : plus rien
select pg_temp.qui('00000000-0000-0000-0000-00000000000c', '19999999-0000-0000-0000-000000000000');
select pg_temp.ok(not private.session_active(), 'session inconnue : session_active faux');
select pg_temp.ok((select count(*) from public.messages) = 0, 'session inconnue : aucun message lisible');

-- 5. Compte suspendu : envoi refusé
reset role;
insert into private.suspensions (user_id) values ('00000000-0000-0000-0000-00000000000b');
set role authenticated;
select pg_temp.qui('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b');
select pg_temp.ok(private.is_suspended(), 'is_suspended vrai pour B suspendu');
do $$ begin
  insert into public.messages (conversation_id, body, lang) values (current_setting('essai.conv')::uuid, 'Encore', 'fr');
  raise exception 'ÉCHEC : B suspendu a pu écrire';
exception when others then
  if sqlerrm like 'ÉCHEC%' then raise; end if;
  raise notice 'OK  B suspendu ne peut plus écrire (%)', sqlerrm;
end $$;
reset role;
select pg_temp.ok(true, 'SOCLE RECONSTRUIT DEPUIS LE DÉPÔT SEUL : tous les essais passent');
