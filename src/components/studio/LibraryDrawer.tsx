'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { Library } from './Library';
import { ChevronUp, ChevronDown, ListMusic } from 'lucide-react';

/**
 * LibraryDrawer — wraps the Track Library in a vaul slide-up drawer.
 *
 * The toggle button is always visible at the bottom of the studio layout.
 * On mobile (<lg) tapping it slides the Library up from the bottom edge.
 * On desktop the content is embedded inline (not in a drawer overlay) to
 * keep the full track table visible without a modal layer.
 */
export function LibraryDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: inline library (always visible) ─────────────────── */}
      <div className="hidden lg:block col-span-12">
        <Library />
      </div>

      {/* ── Mobile: vaul slide-up drawer ─────────────────────────────── */}
      <div className="lg:hidden col-span-12">
        <Drawer.Root open={open} onOpenChange={setOpen}>
          {/* Trigger pill */}
          <Drawer.Trigger asChild>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800/60 bg-[#0a0a0c]/80 backdrop-blur-[24px] text-slate-400 hover:text-slate-200 transition-colors active:scale-[0.97] touch-none select-none"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <ListMusic className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Track Library</span>
              {open ? (
                <ChevronDown className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronUp className="w-4 h-4 ml-auto" />
              )}
            </button>
          </Drawer.Trigger>

          <Drawer.Portal>
            {/* Scrim */}
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <Drawer.Content
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-slate-800/60 bg-[#0c0c10] outline-none"
              style={{ maxHeight: '80dvh' }}
            >
              {/* Drag handle */}
              <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-slate-700/60 flex-shrink-0" />

              {/* Drawer title (required for accessibility) */}
              <Drawer.Title className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Track Library
              </Drawer.Title>

              {/* Scrollable Library content */}
              <div className="overflow-y-auto flex-1 pb-safe">
                <Library />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </>
  );
}
