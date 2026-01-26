export default function StudioRouteWrapper({ children }: { children: React.ReactNode }) {
  // Intentionally minimal: Studio must remain self-contained and must NOT mount
  // the legacy site Audio/Video providers or persistent players.
  return <>{children}</>;
}
