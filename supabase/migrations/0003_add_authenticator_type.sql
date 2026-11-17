-- Add the 'authenticator' item type to the vault_items.type CHECK constraint.
-- Run in Supabase SQL Editor (or via db:reset) BEFORE deploying client code that
-- writes authenticator items.

alter table public.vault_items
  drop constraint if exists vault_items_type_check;

alter table public.vault_items
  add constraint vault_items_type_check check (
    type in ('login', 'authenticator', 'wallet', 'ssh_key', 'secure_note', 'api_key', 'database')
  );
