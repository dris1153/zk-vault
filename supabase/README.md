# Supabase setup (one-time)

This vault uses Supabase purely as a **ciphertext store + auth gate**. It never
sees your master password, keys, or plaintext.

## 1. Create the project
1. Create a project at https://supabase.com (free tier is fine).
2. Project Settings → API → copy **Project URL** and the **anon public** key.
3. Copy `.env.local.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> The vault email is NOT an env var - you enter it on the lock screen at first
> signup/unlock (a real address you control), and the browser remembers it.
> Never paste the `service_role` key anywhere in this app.

## 2. Disable email confirmation (single-user convenience)
Authentication → Sign In / Providers → Email:
- Turn **OFF** "Confirm email".

Why: provisioning signs up + immediately signs in with a derived password. With
confirmation ON, the first session is blocked until you click an email link.
(If you prefer to keep it ON, confirm the one signup email once, then unlock works.)

## 3. Apply the schema
Run the migration in `supabase/migrations/0001_init.sql`:

- **Dashboard:** SQL Editor → paste the file contents → Run.
- **CLI:** `supabase link` then `supabase db push` (or `supabase migration up`).

This creates `vault_config` + `vault_items`, enables Row Level Security, and
adds per-user policies (`auth.uid() = user_id`). After this, even with the anon
key, rows are unreadable without your login, and contain only ciphertext.

## 4. Verify (optional)
- Table Editor → both tables exist, RLS = enabled.
- After first run + adding an item, the `vault_items` row shows only
  `type`, `favorite`, and opaque `encrypted_data` / `iv` - no readable secret.
