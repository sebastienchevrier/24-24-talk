-- Essais locaux de 24-stats-anti-triche.sql (audit F-31) sur le socle reconstruit. Jamais sur TEST ni PROD.
create function pg_temp.ok(c boolean, nom text) returns void language plpgsql as $$
begin if c is distinct from true then raise exception 'ÉCHEC : %', nom; end if; raise notice 'OK  %', nom; end $$;
insert into private.stats_origins values ('https://site.essai');
create function pg_temp.depuis(ip text) returns void language sql as $$
  select set_config('request.headers', json_build_object('origin', 'https://site.essai', 'x-forwarded-for', ip || ', 10.0.0.1')::text, false) $$;
create function pg_temp.n(k text) returns bigint language sql as $$
  select coalesce((select n from public.stat_days where kind = k), 0) $$;
set role anon;
select pg_temp.depuis('203.0.113.7');
-- 1. Un script qui envoie 500 « traductions » du même appareil : toutes comptées sauf au-delà de 3000 → ici 500
select public.track('20000000-0000-0000-0000-000000000001', 'traduction') from generate_series(1, 500);
reset role; select pg_temp.ok(pg_temp.n('traduction') = 500, '500 traductions d''un appareil comptées (sous le plafond 3000)'); set role anon;
-- 2. 200 « ouvertures » du même appareil : plafond 50
select public.track('20000000-0000-0000-0000-000000000001', 'ouverture') from generate_series(1, 200);
reset role; select pg_temp.ok(pg_temp.n('ouverture') = 50, 'ouvertures plafonnées à 50 par appareil et par jour'); set role anon;
-- 3. 100 faux appareils depuis la même adresse : 10 comptés (le 1er appareil + 9)
select public.track(gen_random_uuid(), 'ouverture') from generate_series(1, 100);
reset role; select pg_temp.ok((select count(*) from public.stat_devices) = 10, '100 faux appareils d''une adresse : 10 personnes comptées'); set role anon;
-- 4. Minutes d'appel : 50 appels de 2 h du même appareil → 12 h maximum
select pg_temp.depuis('198.51.100.9');
select public.track('20000000-0000-0000-0000-000000000002', 'appel_sec', 7200) from generate_series(1, 50);
reset role; select pg_temp.ok(pg_temp.n('appel_sec') = 43200, 'minutes d''appel plafonnées à 12 h par appareil et par jour'); set role anon;
-- 5. Sans identifiant d'appareil : rien n'est compté
select public.track(null, 'appel');
reset role; select pg_temp.ok(pg_temp.n('appel') = 0, 'sans identifiant : rien compté'); set role anon;
-- 6. ping : 300 faux appareils d'une autre adresse → 10 en ligne au plus
select pg_temp.depuis('192.0.2.44');
select public.ping(gen_random_uuid(), false) from generate_series(1, 300);
reset role; select pg_temp.ok((select count(*) from public.stat_presence) <= 12, 'ping : faux appareils d''une adresse plafonnés (' || (select count(*) from public.stat_presence) || ' en ligne)'); set role anon;
-- 7. Mauvaise origine : rien
select set_config('request.headers', '{"origin":"https://pirate.example","x-forwarded-for":"192.0.2.99"}', false);
select public.track('20000000-0000-0000-0000-000000000009', 'appel');
reset role; select pg_temp.ok(pg_temp.n('appel') = 0, 'origine inconnue : rien compté');
-- 8. Droits : anon ne peut pas appeler les fonctions internes ni lire les compteurs
select pg_temp.ok(not has_function_privilege('anon', 'private.stat_accorder(text, bigint, bigint)', 'execute'), 'anon ne peut pas appeler stat_accorder');
select pg_temp.ok(not has_table_privilege('anon', 'private.stat_quota', 'select'), 'anon ne lit pas les compteurs');
select pg_temp.ok((select count(*) from private.stat_quota where cle like 'res:%' and cle ~ '203\.0\.113') = 0, 'aucune adresse en clair gardée');
select pg_temp.ok(true, 'F-31 : tous les essais passent');
