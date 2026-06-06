// Strong random password generator (Web Crypto, unbiased rejection sampling).

export interface GenOpts {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

export const DEFAULT_GEN_OPTS: GenOpts = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
};

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

/** Unbiased index in [0, n) via rejection sampling (avoids modulo bias). */
function randIndex(n: number): number {
  const max = Math.floor(256 / n) * n;
  const buf = new Uint8Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= max);
  return v % n;
}

const pick = (chars: string): string => chars[randIndex(chars.length)];

export function generatePassword(opts: GenOpts = DEFAULT_GEN_OPTS): string {
  const pools: string[] = [];
  if (opts.lower) pools.push(SETS.lower);
  if (opts.upper) pools.push(SETS.upper);
  if (opts.digits) pools.push(SETS.digits);
  if (opts.symbols) pools.push(SETS.symbols);
  if (pools.length === 0) pools.push(SETS.lower);

  const length = Math.max(pools.length, Math.min(opts.length, 128));
  const all = pools.join("");

  // One char from each enabled pool (so all classes appear), then fill the rest.
  const out: string[] = pools.map((p) => pick(p));
  while (out.length < length) out.push(pick(all));

  // Fisher-Yates shuffle so the guaranteed leading chars aren't predictable.
  for (let i = out.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}
