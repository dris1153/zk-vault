import { describe, it, expect } from "vitest";
import type { VaultItem } from "@/lib/vault/items";
import { parseTotp, parseTotpMeta, currentCode, nextCode } from "../totp";
import { toCodeEntries, sortCodeEntries, filterCodeEntries } from "../codes";
import { primarySecretField } from "../item-fields";

const SECRET = "JBSWY3DPEHPK3PXP";

function makeItem(
  overrides: Partial<VaultItem> & Pick<VaultItem, "id" | "type" | "data">,
): VaultItem {
  return {
    favorite: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("totp helpers", () => {
  it("extracts issuer and account from otpauth:// URIs", () => {
    expect(
      parseTotpMeta(
        `otpauth://totp/GitHub:alice@example.com?secret=${SECRET}&issuer=GitHub`,
      ),
    ).toEqual({ issuer: "GitHub", account: "alice@example.com" });

    expect(
      parseTotpMeta(`otpauth://totp/Acme:bob?secret=${SECRET}`),
    ).toEqual({ issuer: "Acme", account: "bob" });

    expect(parseTotpMeta(SECRET)).toBeNull();
  });

  it("computes nextCode equal to the next 30s period code", () => {
    const totp = parseTotp(SECRET)!;
    const t = 1_700_000_005_000;
    expect(nextCode(totp, t)).toBe(currentCode(totp, t + 30_000).code);
  });
});

describe("codes list helpers", () => {
  const items: VaultItem[] = [
    makeItem({
      id: "1",
      type: "login",
      favorite: false,
      data: {
        title: "GitHub",
        username: "alice",
        password: "pw",
        url: "github.com",
        totp_secret: SECRET,
        tags: ["dev"],
      },
    }),
    makeItem({
      id: "2",
      type: "authenticator",
      favorite: true,
      data: {
        title: "Cloudflare",
        account: "ops@acme.io",
        totp_secret: SECRET,
        tags: ["infra"],
      },
    }),
    makeItem({
      id: "3",
      type: "authenticator",
      favorite: false,
      data: {
        title: "",
        account: "",
        totp_secret: `otpauth://totp/AWS:root@aws?secret=${SECRET}&issuer=AWS`,
        tags: [],
      },
    }),
    makeItem({
      id: "4",
      type: "login",
      data: { title: "No2FA", username: "bob", password: "pw", tags: [] },
    }),
    makeItem({
      id: "5",
      type: "wallet",
      data: { title: "ETH", private_key: "0xabc", tags: [] },
    }),
  ];

  it("includes authenticator and TOTP-bearing login items with URI fallback", () => {
    const entries = toCodeEntries(items);
    expect(entries.map((e) => e.id)).toEqual(["1", "2", "3"]);
    expect(entries[0]).toMatchObject({
      issuer: "GitHub",
      account: "alice",
      source: "login",
      pinned: false,
    });
    expect(entries[1]).toMatchObject({
      issuer: "Cloudflare",
      account: "ops@acme.io",
      source: "authenticator",
      pinned: true,
    });
    expect(entries[2]).toMatchObject({
      issuer: "AWS",
      account: "root@aws",
      source: "authenticator",
    });
  });

  it("sorts pinned entries first then alphabetically by issuer", () => {
    const entries = sortCodeEntries(toCodeEntries(items));
    expect(entries.map((e) => e.issuer)).toEqual(["Cloudflare", "AWS", "GitHub"]);
  });

  it("filters by issuer, account, url, and tags", () => {
    const entries = toCodeEntries(items);
    expect(filterCodeEntries(entries, "ops@acme").map((e) => e.id)).toEqual(["2"]);
    expect(filterCodeEntries(entries, "infra").map((e) => e.id)).toEqual(["2"]);
    expect(filterCodeEntries(entries, "github.com").map((e) => e.id)).toEqual(["1"]);
  });
});

describe("primarySecretField", () => {
  it("resolves primary secret per item type", () => {
    expect(
      primarySecretField("login", { auth_method: "credential", password: "p" }),
    )?.toMatchObject({ field: "password", value: "p" });
    expect(
      primarySecretField("login", { auth_method: "oauth", password: "p" }),
    ).toBeNull();
    expect(
      primarySecretField("authenticator", { totp_secret: SECRET }),
    )?.toMatchObject({ field: "totp_secret", value: SECRET });
    expect(
      primarySecretField("wallet", { seed_phrase: "one two" }),
    )?.toMatchObject({ field: "seed_phrase", value: "one two" });
    expect(
      primarySecretField("ssh_key", { private_key: "pem" }),
    )?.toMatchObject({ field: "private_key", value: "pem" });
    expect(
      primarySecretField("api_key", { key: "sk-1" }),
    )?.toMatchObject({ field: "key", value: "sk-1" });
    expect(
      primarySecretField("database", { password: "dbpw" }),
    )?.toMatchObject({ field: "password", value: "dbpw" });
    expect(
      primarySecretField("secure_note", { content: "secret note" }),
    )?.toMatchObject({ field: "content", value: "secret note" });
  });
});
