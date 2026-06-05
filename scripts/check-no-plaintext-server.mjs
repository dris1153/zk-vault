/**
 * Zero-knowledge guard: the crypto/vault layer must NEVER run in a server
 * context, or plaintext could leave the browser. Fails if any Server Action
 * ("use server") or route handler imports @/lib/crypto or @/lib/vault via
 * static import, dynamic import(), or require().
 *
 *   npm run guard
 *
 * Note: this is a line-level check (it does not follow transitive re-exports).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep, basename } from "node:path";

const ROOTS = ["app", "components", "lib"];

// Matches the crypto/vault layer in: `from "..."`, `import("...")`, `require("...")`.
const TARGET = String.raw`(?:@\/lib\/(?:crypto|vault)|(?:\.\.?\/)+lib\/(?:crypto|vault))[\w/.-]*`;
const BAD_IMPORT = new RegExp(
  String.raw`(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']${TARGET}["']`,
);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name))
      out.push(p);
  }
  return out;
}

function isServerContext(file, content) {
  if (/["']use server["']/.test(content)) return true; // Server Action
  if (/^route\.(ts|tsx)$/.test(basename(file))) return true; // App Router handler
  if (file.split(sep).includes("api")) return true; // /api/ route tree
  return false;
}

const violations = [];
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue;
  }
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    if (isServerContext(file, content) && BAD_IMPORT.test(content)) {
      violations.push(file);
    }
  }
}

if (violations.length) {
  console.error(
    "\n  ZERO-KNOWLEDGE GUARD FAILED: server-context files import the vault/crypto layer:\n",
  );
  for (const v of violations) console.error(`   - ${v}`);
  console.error(
    "\n  Move all encryption + vault data access to client components only.\n",
  );
  process.exit(1);
}

console.log("  guard passed: crypto/vault layer is client-only.");
