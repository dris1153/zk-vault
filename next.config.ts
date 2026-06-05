import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers (CSP/SRI) are hardened in Phase 6.
  reactStrictMode: true,
};

export default nextConfig;
