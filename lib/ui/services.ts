// API-key service registry: value + label + logo, grouped by category. Logos use
// the bundled developer-icons package; services not in it use a local PNG/WEBP at
// /service/<id>.(png|webp), with a monogram fallback (see ServiceIcon).

import type { ComponentType } from "react";
import {
  OpenAI,
  ChatGPT,
  ClaudeAI,
  Anthropic,
  DeepSeek,
  HuggingFace,
  AWS,
  Azure,
  GoogleCloud,
  Cloudflare,
  VercelLight,
  Netlify,
  Supabase,
  DigitalOcean,
  Railway,
  GitHubLight,
  GitLab,
  NPM,
  Docker,
  Notion,
  Figma,
  Slack,
  ReSend,
  Microsoft,
} from "developer-icons";
import type { BrandIconRef } from "@/components/brand-icon";

type IconComp = ComponentType<{ size?: number; className?: string }>;

export type ServiceCategory =
  | "ai"
  | "cloud"
  | "dev"
  | "payments"
  | "comms"
  | "software";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  icon: BrandIconRef;
}

const svg = (Comp: IconComp): BrandIconRef => ({ kind: "svg", Comp });
const png = (id: string): BrandIconRef => ({ kind: "png", src: `/service/${id}.png` });

export const SERVICES: Service[] = [
  // AI
  { id: "openai", name: "OpenAI", category: "ai", icon: svg(OpenAI) },
  { id: "chatgpt", name: "ChatGPT", category: "ai", icon: svg(ChatGPT) },
  { id: "claude", name: "Claude", category: "ai", icon: svg(ClaudeAI) },
  { id: "anthropic", name: "Anthropic", category: "ai", icon: svg(Anthropic) },
  { id: "gemini", name: "Gemini", category: "ai", icon: png("gemini") },
  { id: "deepseek", name: "DeepSeek", category: "ai", icon: svg(DeepSeek) },
  { id: "mistral", name: "Mistral", category: "ai", icon: png("mistral") },
  { id: "perplexity", name: "Perplexity", category: "ai", icon: png("perplexity") },
  { id: "grok", name: "Grok", category: "ai", icon: png("grok") },
  { id: "huggingface", name: "Hugging Face", category: "ai", icon: svg(HuggingFace) },
  { id: "elevenlabs", name: "ElevenLabs", category: "ai", icon: png("elevenlabs") },
  { id: "cohere", name: "Cohere", category: "ai", icon: png("cohere") },
  { id: "soniox", name: "Soniox", category: "ai", icon: png("soniox") },
  // Cloud
  { id: "aws", name: "AWS", category: "cloud", icon: svg(AWS) },
  { id: "azure", name: "Azure", category: "cloud", icon: svg(Azure) },
  { id: "gcp", name: "Google Cloud", category: "cloud", icon: svg(GoogleCloud) },
  { id: "cloudflare", name: "Cloudflare", category: "cloud", icon: svg(Cloudflare) },
  { id: "vercel", name: "Vercel", category: "cloud", icon: svg(VercelLight) },
  { id: "netlify", name: "Netlify", category: "cloud", icon: svg(Netlify) },
  { id: "supabase", name: "Supabase", category: "cloud", icon: svg(Supabase) },
  { id: "digitalocean", name: "DigitalOcean", category: "cloud", icon: svg(DigitalOcean) },
  { id: "railway", name: "Railway", category: "cloud", icon: svg(Railway) },
  // Dev
  { id: "github", name: "GitHub", category: "dev", icon: svg(GitHubLight) },
  { id: "gitlab", name: "GitLab", category: "dev", icon: svg(GitLab) },
  { id: "npm", name: "npm", category: "dev", icon: svg(NPM) },
  { id: "docker", name: "Docker", category: "dev", icon: svg(Docker) },
  { id: "notion", name: "Notion", category: "dev", icon: svg(Notion) },
  { id: "figma", name: "Figma", category: "dev", icon: svg(Figma) },
  { id: "linear", name: "Linear", category: "dev", icon: png("linear") },
  { id: "slack", name: "Slack", category: "dev", icon: svg(Slack) },
  // Payments
  { id: "stripe", name: "Stripe", category: "payments", icon: png("stripe") },
  { id: "paypal", name: "PayPal", category: "payments", icon: png("paypal") },
  { id: "polar", name: "Polar", category: "payments", icon: png("polar") },
  { id: "paddle", name: "Paddle", category: "payments", icon: png("paddle") },
  // Comms
  { id: "twilio", name: "Twilio", category: "comms", icon: png("twilio") },
  { id: "sendgrid", name: "SendGrid", category: "comms", icon: png("sendgrid") },
  { id: "resend", name: "Resend", category: "comms", icon: svg(ReSend) },
  { id: "mailgun", name: "Mailgun", category: "comms", icon: png("mailgun") },
  // Software / license
  { id: "windows-11-pro", name: "Windows 11 Pro", category: "software", icon: png("windows-11-pro") },
  { id: "microsoft-365", name: "Microsoft 365", category: "software", icon: svg(Microsoft) },
  { id: "jetbrains", name: "JetBrains", category: "software", icon: png("jetbrains") },
  { id: "adobe", name: "Adobe", category: "software", icon: png("adobe") },
];

export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = [
  "ai",
  "cloud",
  "dev",
  "payments",
  "comms",
  "software",
];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ai: "AI",
  cloud: "Cloud",
  dev: "Lập trình",
  payments: "Thanh toán",
  comms: "Liên lạc",
  software: "Phần mềm",
};

const BY_NAME = new Map(SERVICES.map((s) => [s.name.toLowerCase(), s]));

/** Match a stored service value (the picked name) back to a Service, or null. */
export function findServiceByName(value: string): Service | null {
  if (!value) return null;
  return BY_NAME.get(value.trim().toLowerCase()) ?? null;
}
