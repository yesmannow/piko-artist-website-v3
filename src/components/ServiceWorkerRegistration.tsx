"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistration - Registers the service worker for PWA functionality
 *
 * This component should be mounted in the root layout to enable
 * offline functionality and asset caching.
 *
 * Includes cache cleanup utility to prevent QuotaExceededError.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true") {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          // Log registration success (only in dev)
          if (process.env.NODE_ENV === "development") {
            console.log("[SW] Service Worker registered:", registration);
          }

          // Check for updates periodically
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available
                  if (process.env.NODE_ENV === "development") {
                    console.log("[SW] New service worker available");
                  }
                }
              });
            }
          });

          // Periodic cache cleanup to prevent quota errors
          // Run cleanup every 24 hours
          setInterval(async () => {
            try {
              if ("storage" in navigator && "estimate" in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const usagePercent = estimate.usage && estimate.quota
                  ? (estimate.usage / estimate.quota) * 100
                  : 0;

                // If storage is > 80% full, trigger cleanup
                if (usagePercent > 80) {
                  console.warn(`[SW] Storage usage at ${usagePercent.toFixed(1)}%, triggering cleanup...`);

                  // Send message to service worker to clean up caches
                  if (registration.active) {
                    registration.active.postMessage({ type: "CLEANUP_CACHES" });
                  }
                }
              }
            } catch (error) {
              console.error("[SW] Storage check failed:", error);
            }
          }, 24 * 60 * 60 * 1000); // 24 hours

        } catch (error) {
          console.error("[SW] Service Worker registration failed:", error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}

