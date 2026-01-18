import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { primaryNavItems, quickNavItems } from "@/config/nav.config";
import { useUIStore } from "@/store/useUIStore";

export function MainNav() {
  const labsEnabled = useUIStore((state) => state.labsEnabled);
  return (
    <>
      <Navbar items={primaryNavItems} />
      <MobileNav
        items={primaryNavItems}
        quickItems={quickNavItems}
        labsEnabled={labsEnabled}
      />
    </>
  );
}
