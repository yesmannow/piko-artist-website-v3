"use client";

import { RotateCw, Smartphone } from "lucide-react";

/**
 * REMEDIATION: CSS Orientation Guard
 *
 * iOS Safari ignores the `orientation: landscape` manifest setting.
 * This component enforces landscape mode via CSS media queries.
 *
 * Shows a full-screen overlay in portrait mode asking user to rotate device.
 */
export const OrientationGuard = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-8 px-8 landscape:hidden">
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Animated Rotation Icon */}
        <div className="relative">
          <Smartphone className="w-24 h-24 text-[#FFD700] animate-pulse" />
          <RotateCw
            className="w-12 h-12 text-white absolute -bottom-2 -right-2 animate-spin"
            style={{ animationDuration: "2s" }}
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
          ROTATE DEVICE
        </h1>

        {/* Instructions */}
        <div className="max-w-sm space-y-3 text-sm text-zinc-400 font-mono">
          <p className="text-[#FFD700] font-bold uppercase tracking-wider">
            ⚠ LANDSCAPE MODE REQUIRED
          </p>
          <p>
            Studio V2 is optimized for landscape orientation to provide the best
            DJ experience.
          </p>
          <p className="text-xs text-zinc-500">
            Please rotate your device to continue.
          </p>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 z-10 text-center w-full">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
          PIKO STUDIO V2 • MOBILE DJ WORKSTATION
        </p>
      </div>
    </div>
  );
};
