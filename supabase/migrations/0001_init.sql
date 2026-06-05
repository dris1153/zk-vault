-- Zero-Knowledge Vault schema.
-- Tables store ONLY ciphertext + non-secret metadata (type, favorite).
-- Row Level Security isolates every row to its owning user.

-- updated_at trigger ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- vault_config: one row per user, holds KDF params + both wrapped DEK copies.
-- (No saltAuth: the auth secret salt is email-derived, not stored.)
create table if not exists public.vault_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version int not null default 1,
  kdf_params jsonb not null,
  wrapped_dek_master jsonb not null,
  wrapped_dek_recovery jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- vault_items: ciphertext items. type + favorite are the ONLY plaintext fields
-- (used for category counts/filters without decrypting).
create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid () references auth.users (id) on delete cascade,
  type text not null check (
    type in ('login', 'wallet', 'ssh_key', 'secure_note', 'api_key')
  ),
  favorite boolean not null default false,
  encrypted_data text not null,
  iv text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_items_user_type_idx
  on public.vault_items (user_id, type);

-- updated_at triggers
drop trigger if exists vault_config_updated_at on public.vault_config;
create trigger vault_config_updated_at
  before update on public.vault_config
  for each row execute function public.set_updated_at();

drop trigger if exists vault_items_updated_at on public.vault_items;
create trigger vault_items_updated_at
  before update on public.vault_items
  for each row execute function public.set_updated_at();

-- Row Level Security ------------------------------------------------------
alter table public.vault_config enable row level security;
alter table public.vault_items enable row level security;

-- vault_config: owner-only for every operation.
create policy "config_select_own" on public.vault_config
  for select using (auth.uid () = user_id);
create policy "config_insert_own" on public.vault_config
  for insert with check (auth.uid () = user_id);
create policy "config_update_own" on public.vault_config
  for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
create policy "config_delete_own" on public.vault_config
  for delete using (auth.uid () = user_id);

-- vault_items: owner-only for every operation.
create policy "items_select_own" on public.vault_items
  for select using (auth.uid () = user_id);
create policy "items_insert_own" on public.vault_items
  for insert with check (auth.uid () = user_id);
create policy "items_update_own" on public.vault_items
  for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
create policy "items_delete_own" on public.vault_items
  for delete using (auth.uid () = user_id);
