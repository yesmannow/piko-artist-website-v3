"use client";

import { useEffect, useState } from "react";
import { TrackLibrary } from "./TrackLibrary";
import { useStudioStore } from "@/store/useStudioStore";

export function LibraryDrawer() {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (!isDesktop) {
    return (
      <TrackLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onTrackLoaded={() => setLibraryOpen(false)}
        panelId="studio-library-drawer"
      />
    );
  }

  return (
    <aside
      className={`library-drawer ${libraryOpen ? "is-open" : "is-collapsed"}`}
      id="studio-library-drawer"
      aria-hidden={!libraryOpen}
    >
      <TrackLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onTrackLoaded={() => setLibraryOpen(false)}
        inline
        panelId="studio-library-drawer-content"
      />
    </aside>
  );
}
