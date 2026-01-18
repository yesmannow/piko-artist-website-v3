import type { LucideIcon } from "lucide-react";
import {
  Disc3,
  Download,
  Headphones,
  Lock,
  PanelsTopLeft,
  Sparkles,
  Waves,
  LayoutTemplate,
} from "lucide-react";

export interface NavBadge {
  text: string;
  tone?: "live" | "beta" | "default";
}

export interface NavItem {
  label: string;
  href: string;
  sectionId?: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  enabled?: boolean;
  external?: boolean;
}

const baseNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Disc3,
  },
  {
    label: "Music",
    href: "/music",
    icon: Headphones,
  },
  {
    label: "Videos",
    href: "/videos",
    icon: PanelsTopLeft,
  },
  {
    label: "DJ Studio",
    href: "/studio",
    icon: Waves,
  },
  {
    label: "Contact",
    href: "/contact",
    icon: Lock,
  },
  {
    label: "Install",
    href: "/install",
    icon: Sparkles,
  },
];

export const primaryNavItems = baseNavItems.filter(
  (item) => item.enabled !== false,
);

export const quickNavItems = primaryNavItems.slice(0, 3);

export const labsNavItems: NavItem[] = [
  ...primaryNavItems,
  { label: "Timeline", href: "/timeline", icon: LayoutTemplate },
];
