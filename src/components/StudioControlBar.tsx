"use client";

import React from "react";
import { useResponsiveVariant } from "@/hooks/useResponsiveVariant";

export function StudioControlBar() {
  const variant = useResponsiveVariant();

  return (
    <div className={`studio-control-bar ${variant}`} role="toolbar" aria-label="Studio controls">
      <div className="transport">
        <button aria-label="Play/Pause" className="btn-transport" />
        <button aria-label="Cue" className="btn-transport" />
      </div>

      {variant !== "mobile" && (
        <div className="crossfader" role="group" aria-label="Crossfader">
          <input type="range" aria-label="Crossfader" />
        </div>
      )}

      <div className="toggles" role="group" aria-label="Mode toggles">
        <button aria-pressed="false" aria-label="One-Click Mix" className="btn-toggle" />
        <button aria-pressed="false" aria-label="Stem Mode" className="btn-toggle" />
        <button aria-pressed="false" aria-label="FX" className="btn-toggle" />
        <button aria-pressed="false" aria-label="Library" className="btn-toggle" />
      </div>
    </div>
  );
}
