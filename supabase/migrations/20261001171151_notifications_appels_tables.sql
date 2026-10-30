-- Notifications d'appel quand l'appli est fermée (Web Push).
-- Tout est dans le schéma « private » : invisible depuis l'appli, seule la fonction serveur call-push y accède.
create table if not exists private.push_subs (
  endpoint text primary key check (char_length(endpoint) between 20 and 1000),
  user_id uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) between 80 and 100),
  auth text not null check (char_length(auth) between 16 and 30),
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on private.push_subs(user_id);

create table if not exists private.push_config (
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_jwk jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists private.push_log (
  caller uuid not null,
  at timestamptz not null default now()
);
create index if not exists push_log_caller_idx on private.push_log(caller, at);