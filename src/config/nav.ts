export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/music", label: "Music" },
  { href: "/videos", label: "Videos" },
  { href: "/studio", label: "DJ Studio" },
  { href: "/contact", label: "Contact" },
  { href: "/install", label: "Install" },
] as const;
