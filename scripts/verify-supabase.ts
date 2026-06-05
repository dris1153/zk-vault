/**
 * Live end-to-end verification of the vault engine against your Supabase.
 *
 *   npm run verify:supabase
 *
 * Uses the REAL crypto core (lib/crypto) and a THROWAWAY account (random email),
 * so it never touches your real vault. Proves: provision -> sign-in -> unwrap
 * DEK -> create item -> fetch -> decrypt -> recovery-key unlock -> ciphertext
 * check, then cleans up its rows.
 *
 * Prereqs (see supabase/README.md): .env.local filled + "Confirm email" OFF +
 * migration 0001_init.sql applied.
 */
import { createClient } from "@supabase/supabase-js";
import {
  createVault,
  deriveAuthSecret,
  unlockWithMaster,
  unlockWithRecovery,
  encryptJSON,
  decryptJSON,
  bytesEqual,
} from "../lib/crypto/index";
import { loadEnv, fail, ok } from "./script-env";

// Fast Argon2 so the smoke test is snappy; crypto correctness is covered by unit
// tests. We only need consistent cost between derive + verify here.
const TUNING = { memKiB: 1024, iterations: 1, parallelism: 1 };

async function rawKey(k: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", k));
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon)
    fail("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set.");

  // Supabase rejects fake domains (example.com etc). Build a throwaway address
  // on YOUR real domain via plus-addressing - distinct account, valid domain,
  // does not touch your real vault email.
  const vaultEmail = env.NEXT_PUBLIC_VAULT_EMAIL;
  if (!vaultEmail || !vaultEmail.includes("@"))
    fail("Set NEXT_PUBLIC_VAULT_EMAIL to a real address you control.");
  const [local, domain] = vaultEmail.split("@");
  const email = `${local}+zkverify${crypto.randomUUID().slice(0, 8)}@${domain}`;
  const master = `verify-${crypto.randomUUID()}`;
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\n  Verifying vault engine against ${url}`);
  console.log(`  Throwaway account: ${email}\n`);

  // 1. Provision (create envelope locally).
  const created = await createVault(master, email, TUNING);
  ok("createVault: envelope + recovery key generated");

  // 2. Sign up + sign in with the derived auth secret.
  const signUp = await supabase.auth.signUp({
    email,
    password: created.authSecret,
  });
  if (signUp.error) fail(`signUp: ${signUp.error.message}`);
  const signIn = await supabase.auth.signInWithPassword({
    email,
    password: created.authSecret,
  });
  if (signIn.error)
    fail(
      `signIn: ${signIn.error.message}. Is "Confirm email" turned OFF in Supabase Auth?`,
    );
  const userId = signIn.data.user?.id;
  if (!userId) fail("No user id after sign-in.");
  ok("Supabase auth: sign-up + sign-in with derived authSecret");

  // 3. Persist the ciphertext config.
  const insCfg = await supabase.from("vault_config").insert({
    user_id: userId,
    version: created.config.version,
    kdf_params: created.config.kdfParams,
    wrapped_dek_master: created.config.wrappedDekMaster,
    wrapped_dek_recovery: created.config.wrappedDekRecovery,
  });
  if (insCfg.error)
    fail(`insert vault_config: ${insCfg.error.message} (migration applied?)`);
  ok("vault_config persisted (RLS insert)");

  // 4. Unlock path: re-derive auth secret (no DB read), fetch config, unwrap DEK.
  const authSecret2 = await deriveAuthSecret(master, email, TUNING);
  if (authSecret2 !== created.authSecret)
    fail("authSecret not reproducible from (master,email).");
  const cfgRow = await supabase.from("vault_config").select("*").maybeSingle();
  if (cfgRow.error || !cfgRow.data)
    fail(`fetch vault_config: ${cfgRow.error?.message ?? "no row"}`);
  const cfg = {
    version: cfgRow.data.version,
    kdfParams: cfgRow.data.kdf_params,
    wrappedDekMaster: cfgRow.data.wrapped_dek_master,
    wrappedDekRecovery: cfgRow.data.wrapped_dek_recovery,
  };
  const dek = await unlockWithMaster(master, cfg);
  if (!bytesEqual(await rawKey(dek), await rawKey(created.dek)))
    fail("Unlocked DEK does not match the provisioned DEK.");
  ok("unlock: email-salt auth + unwrap yields the correct DEK");

  // 5. Recovery-key unlock yields the same DEK.
  const dekR = await unlockWithRecovery(created.recoveryWords, cfg);
  if (!bytesEqual(await rawKey(dekR), await rawKey(created.dek)))
    fail("Recovery-key DEK does not match.");
  ok("recovery key: unwraps the same DEK");

  // 6. Item CRUD + ciphertext check.
  const secret = {
    title: "Verify Login",
    username: "octocat",
    password: `pw-${crypto.randomUUID()}`,
    tags: ["verify"],
  };
  const blob = await encryptJSON(secret, dek);
  const insItem = await supabase
    .from("vault_items")
    .insert({
      type: "login",
      favorite: false,
      encrypted_data: blob.ct,
      iv: blob.iv,
    })
    .select("*")
    .single();
  if (insItem.error) fail(`insert vault_item: ${insItem.error.message}`);
  if (insItem.data.encrypted_data.includes(secret.password))
    fail("Plaintext password found in stored ciphertext column!");
  ok("vault_items: encrypted insert (no plaintext in row)");

  const fetched = await supabase
    .from("vault_items")
    .select("*")
    .eq("id", insItem.data.id)
    .single();
  if (fetched.error) fail(`fetch vault_item: ${fetched.error.message}`);
  const back = await decryptJSON(
    { iv: fetched.data.iv, ct: fetched.data.encrypted_data },
    dek,
  );
  if (JSON.stringify(back) !== JSON.stringify(secret))
    fail("Decrypted item does not match the original.");
  ok("vault_items: fetch + decrypt round-trips correctly");

  // 7. Cleanup (RLS owner delete). Auth user remains (orphan, harmless).
  await supabase.from("vault_items").delete().eq("user_id", userId);
  await supabase.from("vault_config").delete().eq("user_id", userId);
  await supabase.auth.signOut();
  ok("cleanup: test rows deleted");

  console.log(
    `\n  ALL CHECKS PASSED. Engine works against your Supabase.\n` +
      `  (You can delete the throwaway auth user in Dashboard > Authentication if you like.)\n`,
  );
}

main().catch((e) => fail(e?.message ?? String(e)));
