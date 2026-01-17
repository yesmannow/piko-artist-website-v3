import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { primaryNavItems, quickNavItems } from "@/config/nav.config";

export function MainNav() {
  return (
    <>
      <Navbar items={primaryNavItems} />
      <MobileNav items={primaryNavItems} quickItems={quickNavItems} />
    </>
  );
}
