-- 24/24 Talk Réseau — canaux privés pour les appels traduits (© 2026 Sébastien Chevrier)
create or replace function public.can_signal(topic text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  target uuid;
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target := substr(topic, 6)::uuid;
  if target = auth.uid() then return false; end if;
  if exists (select 1 from public.blocks where blocker = target and blocked = auth.uid()) then return false; end if;
  return exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = target
  );
end;
$$;
revoke execute on function public.can_signal(text) from public, anon;
grant execute on function public.can_signal(text) to authenticated;

drop policy if exists "reseau recevoir dans ma boite" on realtime.messages;
create policy "reseau recevoir dans ma boite" on realtime.messages for select to authenticated using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'user:' || (select auth.uid())::text
);
drop policy if exists "reseau envoyer a un contact" on realtime.messages;
create policy "reseau envoyer a un contact" on realtime.messages for insert to authenticated with check (
  realtime.messages.extension = 'broadcast'
  and public.can_signal((select realtime.topic()))
);