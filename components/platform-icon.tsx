"use client";

import { useState } from "react";
import type { Platform } from "@/lib/ui/platforms";
import { domainOf } from "@/lib/ui/platforms";

export function PlatformIcon({
  platform,
  url,
  size = 18,
  favicon = false,
}: {
  platform?: Platform | null;
  url?: string;
  size?: number;
  favicon?: boolean;
}) {
  if (platform) {
    if (platform.icon.kind === "svg") {
      const Comp = platform.icon.Comp;
      return <Comp size={size} />;
    }
    return <PngIcon src={platform.icon.src} label={platform.name} size={size} />;
  }

  const host = url ? domainOf(url) : "";
  if (favicon && host) {
    return <FaviconIcon host={host} size={size} />;
  }
  return <Monogram label={host} size={size} />;
}

// Local brand PNG; falls back to a monogram if the file is missing/placeholder.
function PngIcon({ src, label, size }: { src: string; label: string; size: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <Monogram label={label} size={size} />;
  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className="rounded-[4px] object-contain"
      onError={() => setBroken(true)}
    />
  );
}

// Favicon for custom domains (opt-in only). Falls back to a monogram on error.
function FaviconIcon({ host, size }: { host: string; size: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <Monogram label={host} size={size} />;
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
      alt={host}
      width={size}
      height={size}
      className="rounded-[4px] object-contain"
      onError={() => setBroken(true)}
    />
  );
}

// Deterministic, network-free placeholder: first letter + a color hashed from
// the domain/name.
function Monogram({ label, size }: { label: string; size: number }) {
  const ch = (label.replace(/[^a-z0-9]/gi, "")[0] || "?").toUpperCase();
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return (
    <span
      className="inline-flex items-center justify-center rounded-[5px] font-medium text-snow"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 42% 30%)`,
        fontSize: Math.round(size * 0.5),
      }}
    >
      {ch}
    </span>
  );
}
