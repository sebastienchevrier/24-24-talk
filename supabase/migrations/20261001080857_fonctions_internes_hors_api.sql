-- Les fonctions d'aide des règles d'accès ne sont plus appelables depuis l'API publique (/rpc) :
-- elles passent dans un schéma non exposé ; les règles qui les utilisent continuent de fonctionner.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
alter function public.is_member(uuid) set schema private;
alter function public.blocked_in(uuid) set schema private;
alter function public.can_signal(text) set schema private;