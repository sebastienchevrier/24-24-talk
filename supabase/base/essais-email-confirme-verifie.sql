-- Essais locaux de 25-email-confirme-verifie.sql (audit F-32). Jamais sur TEST ni PROD.
create function pg_temp.ok(c boolean, nom text) returns void language plpgsql as $$
begin if c is distinct from true then raise exception 'ÉCHEC : %', nom; end if; raise notice 'OK  %', nom; end $$;
create function pg_temp.qui(u text, s text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'session_id', s, 'role', 'authenticated')::text, false) $$;
insert into auth.users (id, email, email_confirmed_at, is_anonymous) values
  ('30000000-0000-0000-0000-000000000001', 'pas-confirme@essai.local', null, false),
  ('30000000-0000-0000-0000-000000000002', 'confirme@essai.local', now(), false),
  ('30000000-0000-0000-0000-000000000003', null, null, true);
insert into auth.sessions (id, user_id) values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002'),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003');
set role authenticated;
select pg_temp.qui('30000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001');
select pg_temp.ok(not private.compte_verifie(), 'e-mail NON confirmé : refusé');
do $$ begin
  insert into public.profiles (id, pseudo) values ('30000000-0000-0000-0000-000000000001', 'pasconfirme');
  raise exception 'ÉCHEC : profil créé sans e-mail confirmé';
exception when others then
  if sqlerrm like 'ÉCHEC%' then raise; end if;
  raise notice 'OK  profil refusé sans e-mail confirmé (%)', sqlerrm;
end $$;
select pg_temp.qui('30000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000002');
select pg_temp.ok(private.compte_verifie(), 'e-mail confirmé : accepté');
insert into public.profiles (id, pseudo) values ('30000000-0000-0000-0000-000000000002', 'confirme');
select pg_temp.ok((select count(*) from public.profiles where pseudo = 'confirme') = 1, 'profil créé avec e-mail confirmé');
select pg_temp.qui('30000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000003');
select pg_temp.ok(not private.compte_verifie(), 'anonyme sans invitation : refusé');
reset role;
insert into private.comptes_anciens values ('30000000-0000-0000-0000-000000000001');
set role authenticated;
select pg_temp.qui('30000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001');
select pg_temp.ok(private.compte_verifie(), 'compte ancien (noté avant le 23) : garde ses droits');
reset role;
select pg_temp.ok(true, 'F-32 : tous les essais passent');
