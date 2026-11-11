create index if not exists blocks_blocked_idx on public.blocks(blocked);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists reports_reporter_idx on public.reports(reporter);

drop policy if exists "creer mon profil" on public.profiles;
create policy "creer mon profil" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "modifier mon profil" on public.profiles;
create policy "modifier mon profil" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "supprimer mon profil" on public.profiles;
create policy "supprimer mon profil" on public.profiles for delete to authenticated using (id = (select auth.uid()));

drop policy if exists "marquer comme lu" on public.members;
create policy "marquer comme lu" on public.members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "quitter une discussion" on public.members;
create policy "quitter une discussion" on public.members for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "lire les messages" on public.messages;
create policy "lire les messages" on public.messages for select to authenticated using (
  public.is_member(conversation_id)
  and not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = messages.sender_id)
);
drop policy if exists "envoyer un message" on public.messages;
create policy "envoyer un message" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and public.is_member(conversation_id)
  and not public.blocked_in(conversation_id)
);
drop policy if exists "supprimer mes messages" on public.messages;
create policy "supprimer mes messages" on public.messages for delete to authenticated using (sender_id = (select auth.uid()));

drop policy if exists "mes blocages" on public.blocks;
create policy "mes blocages" on public.blocks for select to authenticated using (blocker = (select auth.uid()));
drop policy if exists "bloquer" on public.blocks;
create policy "bloquer" on public.blocks for insert to authenticated with check (blocker = (select auth.uid()));
drop policy if exists "debloquer" on public.blocks;
create policy "debloquer" on public.blocks for delete to authenticated using (blocker = (select auth.uid()));

drop policy if exists "signaler" on public.reports;
create policy "signaler" on public.reports for insert to authenticated with check (reporter = (select auth.uid()));