import Link from "next/link";
import type { ReactNode } from "react";

type DocsLayoutProps = {
  children: ReactNode;
};

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="ds-shell">
      <header className="ds-header">
        <div className="ds-header-inner">
          <div>
            <div className="studio-logo">Piko Studio Docs</div>
            <div className="studio-chip">Design System</div>
          </div>
          <nav className="ds-nav" aria-label="Studio design documentation">
            <Link href="/docs/design-system">Design system</Link>
            <Link href="/docs/components">Components</Link>
            <Link href="/docs/motion">Motion</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
