import type { LucideIcon } from "lucide-react";
import { Disc3, Download, Headphones, Lock, PanelsTopLeft, Sparkles, Waves } from "lucide-react";

export type NavBadge = {
  text: string;
  tone?: "live" | "beta" | "default";
};

export type NavItem = {
  label: string;
  href: string;
  sectionId?: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  enabled?: boolean;
  external?: boolean;
};

const featureFlags = {
  vault: process.env.NEXT_PUBLIC_ENABLE_VAULT === "true",
  exportMix: process.env.NEXT_PUBLIC_ENABLE_MIX_EXPORT === "true",
  install: process.env.NEXT_PUBLIC_ENABLE_INSTALL === "true",
  studioV2Live: process.env.NEXT_PUBLIC_STUDIO_V2_LIVE === "true",
};

const baseNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Disc3,
  },
  {
    label: "Studio",
    href: "/studio",
    icon: Waves,
  },
  {
    label: "Mobile DJ",
    href: "/mobile",
    icon: Headphones,
  },
  {
    label: "Studio V2",
    href: "/studio-v2",
    icon: PanelsTopLeft,
    badge: {
      text: featureFlags.studioV2Live ? "🎧 Live" : "🧪 Beta",
      tone: featureFlags.studioV2Live ? "live" : "beta",
    },
  },
  {
    label: "Vault",
    href: "/vault",
    icon: Lock,
    badge: { text: "🧪 Beta", tone: "beta" },
    enabled: featureFlags.vault,
  },
  {
    label: "Mix Export",
    href: "/export",
    icon: Download,
    enabled: featureFlags.exportMix,
  },
  {
    label: "Install",
    href: "/install",
    icon: Sparkles,
    badge: { text: "🎧 Live", tone: "live" },
    enabled: featureFlags.install,
  },
];

export const primaryNavItems = baseNavItems.filter((item) => item.enabled !== false);

export const quickNavItems = primaryNavItems.slice(0, 3);
