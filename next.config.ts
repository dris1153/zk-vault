import type { NextConfig } from "next";

// Lock outbound connections to self + your Supabase project (REST + realtime).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isDev = process.env.NODE_ENV !== "production";

if (!supabaseUrl && !isDev) {
  console.warn(
    "[next.config] NEXT_PUBLIC_SUPABASE_URL is unset - CSP connect-src will block Supabase and the app will not work.",
  );
}

const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWss = supabaseOrigin.replace(/^https/, "wss");

// NOTE: 'unsafe-inline' for script-src is a known residual (Next injects an
// inline bootstrap). A nonce-based CSP via middleware (v2) would remove it and
// is the highest-value hardening against injected-script DEK theft.
// 'wasm-unsafe-eval' is REQUIRED: hash-wasm compiles the Argon2id WebAssembly
// module at unlock/create time. It permits WASM compilation only, NOT general
// JS eval(), so it does not weaken XSS protection.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  // icons.duckduckgo.com is for the OPT-IN favicon feature (Settings); it only
  // loads when the user enables it (default off). Brand logos are bundled, not fetched.
  `img-src 'self' data: blob: https://icons.duckduckgo.com`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWss}`.trim(),
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
