-- Add the 'database' item type to the vault_items.type CHECK constraint.
-- Apply this to an ALREADY-DEPLOYED database (a fresh `npm run db:reset` picks up
-- the updated constraint from 0001_init.sql directly).
--
-- Run in the Supabase SQL editor, or via `npm run db:reset` (which reapplies all
-- migrations). Field DATA needs no migration - items store arbitrary encrypted JSON.

alter table public.vault_items
  drop constraint if exists vault_items_type_check;

alter table public.vault_items
  add constraint vault_items_type_check check (
    type in ('login', 'wallet', 'ssh_key', 'secure_note', 'api_key', 'database')
  );
