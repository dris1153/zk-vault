// Static platform registry. Login items store only `url`; the platform (logo +
// name) is resolved from the URL domain at render time, so adding a platform
// here lights up matching existing items with NO data migration.
//
// Icons are bundled via the `developer-icons` package (no CDN). Brands not in
// that package use a local PNG at /brand/<id>.png (placeholder until replaced).

import { svg, png, webp, type BrandIconRef } from "./brand";
import {
  GitHubDark,
  GitLab,
  Cloudflare,
  Notion,
  Figma,
  Telegram,
  Slack,
  Discord,
  Messenger,
  WhatsApp,
  Facebook,
  XDark,
  Instagram,
  LinkedIn,
  Reddit,
  YouTube,
  Google,
  Microsoft,
  AppleDark,
} from "developer-icons";

export type PlatformCategory =
  | "popular"
  | "dev"
  | "social"
  | "messaging"
  | "finance"
  | "game"
  | "other";

export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
  domains: string[]; // a platform can match several domains
  icon: BrandIconRef;
}

export const PLATFORMS: Platform[] = [
  {
    id: "github",
    name: "GitHub",
    category: "dev",
    domains: ["github.com"],
    icon: svg(GitHubDark),
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "dev",
    domains: ["gitlab.com"],
    icon: svg(GitLab),
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "dev",
    domains: ["cloudflare.com", "dash.cloudflare.com"],
    icon: svg(Cloudflare),
  },
  {
    id: "notion",
    name: "Notion",
    category: "dev",
    domains: ["notion.so"],
    icon: svg(Notion),
  },
  {
    id: "figma",
    name: "Figma",
    category: "dev",
    domains: ["figma.com"],
    icon: svg(Figma),
  },

  {
    id: "telegram",
    name: "Telegram",
    category: "messaging",
    domains: ["telegram.org", "t.me"],
    icon: svg(Telegram),
  },
  {
    id: "slack",
    name: "Slack",
    category: "messaging",
    domains: ["slack.com"],
    icon: svg(Slack),
  },
  {
    id: "discord",
    name: "Discord",
    category: "messaging",
    domains: ["discord.com", "discord.gg"],
    icon: svg(Discord),
  },
  {
    id: "messenger",
    name: "Messenger",
    category: "messaging",
    domains: ["messenger.com"],
    icon: svg(Messenger),
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "messaging",
    domains: ["whatsapp.com", "wa.me"],
    icon: svg(WhatsApp),
  },
  {
    id: "zalo",
    name: "Zalo",
    category: "messaging",
    domains: ["zalo.me", "chat.zalo.me"],
    icon: webp("zalo"),
  },

  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    domains: ["facebook.com", "fb.com"],
    icon: svg(Facebook),
  },
  {
    id: "x",
    name: "X (Twitter)",
    category: "social",
    domains: ["x.com", "twitter.com"],
    icon: svg(XDark),
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    domains: ["instagram.com"],
    icon: svg(Instagram),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    domains: ["linkedin.com"],
    icon: svg(LinkedIn),
  },
  {
    id: "reddit",
    name: "Reddit",
    category: "social",
    domains: ["reddit.com"],
    icon: svg(Reddit),
  },
  {
    id: "riot",
    name: "Riot",
    category: "game",
    domains: ["riotgames.com"],
    icon: png("riot"),
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "social",
    domains: ["youtube.com", "youtu.be"],
    icon: svg(YouTube),
  },

  {
    id: "google",
    name: "Google",
    category: "popular",
    domains: ["google.com", "accounts.google.com"],
    icon: svg(Google),
  },
  {
    id: "microsoft",
    name: "Microsoft",
    category: "popular",
    domains: ["microsoft.com", "live.com", "outlook.com"],
    icon: svg(Microsoft),
  },

  {
    id: "apple",
    name: "Apple",
    category: "other",
    domains: ["apple.com", "icloud.com"],
    icon: svg(AppleDark),
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "other",
    domains: ["spotify.com"],
    icon: png("spotify"),
  },
];

export const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  popular: "Phổ biến",
  dev: "Lập trình",
  social: "Mạng xã hội",
  messaging: "Nhắn tin",
  finance: "Tài chính",
  game: "Trò chơi",
  other: "Khác",
};

export const CATEGORY_ORDER: PlatformCategory[] = [
  "popular",
  "dev",
  "social",
  "messaging",
  "finance",
  "game",
  "other",
];

/** Lowercase hostname without `www.`; tolerates bare domains and full URLs. */
export function domainOf(url: string): string {
  if (!url) return "";
  const raw = url.trim().toLowerCase();
  let host: string;
  try {
    host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    host = raw.split("/")[0];
  }
  return host.replace(/^www\./, "");
}

/** Resolve a platform from a URL or issuer/service name: domain first, then name/id. */
export function findPlatform(url: string): Platform | null {
  const host = domainOf(url);
  if (host) {
    for (const p of PLATFORMS) {
      if (p.domains.includes(host)) return p;
    }
    for (const p of PLATFORMS) {
      if (p.domains.some((d) => host.endsWith("." + d))) return p;
    }
  }
  const q = url.trim().toLowerCase();
  if (!q) return null;
  for (const p of PLATFORMS) {
    if (p.name.toLowerCase() === q || p.id.toLowerCase() === q) return p;
  }
  return null;
}
