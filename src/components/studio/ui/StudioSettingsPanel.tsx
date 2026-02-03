"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore";

const ONBOARDING_STORAGE_KEY = "piko-studio-onboarding-seen";

/**
 * Reset App - Clears service workers, caches, and reloads
 * Used to recover from stale cache issues
 */
async function resetApp() {
  try {
    // Unregister all service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // Clear CacheStorage
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // Optional: Clear studio-related localStorage (preserve user content)
    // Only clear known studio keys, not all localStorage
    const studioKeys = ["piko-studio-onboarding-seen", "piko-studio-settings"];
    studioKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    });

    // Reload the page
    window.location.reload();
  } catch (error) {
    console.error("[Reset App] Failed:", error);
    alert("Failed to reset app. Please clear your browser cache manually.");
  }
}

export function StudioSettingsPanel() {
  const settingsOpen = useStudioStore((state) => state.settingsOpen);
  const setSettingsOpen = useStudioStore((state) => state.setSettingsOpen);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const setPerformanceMode = useStudioStore((state) => state.setPerformanceMode);
  const show3D = useStudioStore((state) => state.show3D);
  const setShow3D = useStudioStore((state) => state.setShow3D);
  const showStemWaveforms = useStudioStore((state) => state.showStemWaveforms);
  const setShowStemWaveforms = useStudioStore((state) => state.setShowStemWaveforms);
  const autoStem = useStudioStore((state) => state.autoStem);
  const setAutoStem = useStudioStore((state) => state.setAutoStem);
  const startOnboarding = useStudioStore((state) => state.startOnboarding);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [setSettingsOpen, settingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div
      className="studio-settings-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => setSettingsOpen(false)}
    >
      <div className="studio-settings-panel" id="studio-settings-panel" onClick={(event) => event.stopPropagation()}>
        <div className="studio-settings-header">
          <h3>Studio Settings</h3>
          <button type="button" className="btn" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
            Close
          </button>
        </div>

        <label className="studio-setting-row">
          <span>3D visuals</span>
          <input type="checkbox" checked={show3D} onChange={(e) => setShow3D(e.target.checked)} />
        </label>

        <label className="studio-setting-row">
          <span>Per-stem waveforms</span>
          <input
            type="checkbox"
            checked={showStemWaveforms}
            onChange={(e) => setShowStemWaveforms(e.target.checked)}
          />
        </label>

        <label className="studio-setting-row">
          <span>Auto-generate stems</span>
          <input type="checkbox" checked={autoStem} onChange={(e) => setAutoStem(e.target.checked)} />
        </label>

        <label className="studio-setting-row">
          <span>Performance mode</span>
          <select value={performanceMode} onChange={(e) => setPerformanceMode(e.target.value as typeof performanceMode)}>
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="low">Low</option>
          </select>
        </label>

        <div className="studio-setting-row">
          <span>Onboarding tour</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              }
              startOnboarding();
              setSettingsOpen(false);
            }}
          >
            Restart
          </button>
        </div>

        <div className="studio-setting-row">
          <span>Reset App</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (confirm("Clear all caches and reload? This will help fix stale content issues.")) {
                resetApp();
              }
            }}
            title="Unregister service workers, clear caches, and reload"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
