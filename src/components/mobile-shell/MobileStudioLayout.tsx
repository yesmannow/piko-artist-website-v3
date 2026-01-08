"use client";

import { AlwaysOnTopBar } from './AlwaysOnTopBar';
import { AlwaysOnBottomBar } from './AlwaysOnBottomBar';
import { MainDeckContainer } from './MainDeckContainer';
import { LibraryDrawer } from './LibraryDrawer';

export const MobileStudioLayout = () => {
  return (
    // Force landscape and full viewport
    <main className="fixed inset-0 flex flex-col bg-black overflow-hidden">
      {/* Layer 3: Top Status Bar */}
      <div className="z-40 flex-none">
        <AlwaysOnTopBar />
      </div>

      {/* Layer 2: Main Work Area (Swappable Views) */}
      <div className="relative flex-1 z-10">
        <MainDeckContainer />
      </div>

      {/* Layer 1: Bottom Control Bar */}
      <div className="z-30 flex-none pb-safe">
        <AlwaysOnBottomBar />
      </div>

      {/* Layer 0: Library Drawer (Overlay) */}
      <LibraryDrawer />
    </main>
  );
};
