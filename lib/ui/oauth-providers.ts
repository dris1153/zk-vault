// OAuth/SSO providers a login can use ("Sign in with ..."). Logos are bundled
// developer-icons via the shared brand helpers. Rendered with <BrandIcon>.

import {
  Google,
  GitHubLight,
  AppleLight,
  Microsoft,
  Facebook,
  XLight,
  Discord,
  GitLab,
  LinkedIn,
  Slack,
} from "developer-icons";
import { svg, type BrandIconRef } from "./brand";

export interface OAuthProvider {
  id: string;
  name: string;
  icon: BrandIconRef;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "google", name: "Google", icon: svg(Google) },
  { id: "github", name: "GitHub", icon: svg(GitHubLight) },
  { id: "apple", name: "Apple", icon: svg(AppleLight) },
  { id: "microsoft", name: "Microsoft", icon: svg(Microsoft) },
  { id: "facebook", name: "Facebook", icon: svg(Facebook) },
  { id: "x", name: "X (Twitter)", icon: svg(XLight) },
  { id: "discord", name: "Discord", icon: svg(Discord) },
  { id: "gitlab", name: "GitLab", icon: svg(GitLab) },
  { id: "linkedin", name: "LinkedIn", icon: svg(LinkedIn) },
  { id: "slack", name: "Slack", icon: svg(Slack) },
];

const BY_ID = new Map(OAUTH_PROVIDERS.map((p) => [p.id, p]));

export function findOAuthProvider(id: string): OAuthProvider | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}

export function oauthProviderLabel(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}
