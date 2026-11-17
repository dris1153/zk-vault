"use client";

import type { VaultItem } from "@/lib/vault/items";
import { TYPE_ICON } from "@/lib/ui/icons";
import { findPlatform } from "@/lib/ui/platforms";
import { PlatformIcon } from "./platform-icon";
import { EngineIcon } from "./engine-icon";
import { ServiceIcon } from "./service-icon";

export function ItemAvatar({
  item,
  favicon = false,
  boxSize = 36,
  iconSize = 18,
}: {
  item: VaultItem;
  favicon?: boolean;
  boxSize?: number;
  iconSize?: number;
}) {
  const Icon = TYPE_ICON[item.type];
  const url = item.type === "login" ? ((item.data.url as string) ?? "") : "";
  const title = (item.data.title as string) ?? "";
  const platform =
    item.type === "login"
      ? url
        ? findPlatform(url)
        : null
      : item.type === "authenticator"
        ? findPlatform(title)
        : null;

  const showBrand =
    (item.type === "login" && (platform !== null || url !== "")) ||
    (item.type === "authenticator" && platform !== null);
  const engine =
    item.type === "database" ? ((item.data.engine as string) ?? "") : "";
  const service =
    item.type === "api_key" ? ((item.data.service as string) ?? "") : "";

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg bg-inset text-ink"
      style={{ width: boxSize, height: boxSize }}
    >
      {showBrand ? (
        <PlatformIcon
          platform={platform}
          url={url || title}
          size={iconSize}
          favicon={favicon}
        />
      ) : engine ? (
        <EngineIcon engine={engine} size={iconSize} />
      ) : service ? (
        <ServiceIcon service={service} size={iconSize} />
      ) : (
        <Icon size={iconSize} />
      )}
    </span>
  );
}
