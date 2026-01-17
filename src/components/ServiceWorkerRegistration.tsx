"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistration - Registers the service worker for PWA functionality
 *
 * This component should be mounted in the root layout to enable
 * offline functionality and asset caching.
 *
 * Includes cache cleanup utility to prevent QuotaExceededError.
 * On initial load, purges all service workers and caches to prevent stale asset errors.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // CRITICAL: Purge all service workers and caches on first load to fix stale asset errors
    const purgeServiceWorkersAndCaches = async () => {
      try {
        // Check if this is the first load after the fix (using a flag in sessionStorage)
        const hasPerformedPurge = sessionStorage.getItem("sw-cache-purged");
        
        if (!hasPerformedPurge) {
          console.log("[SW Purge] Starting service worker and cache cleanup...");

          // 1. Unregister all service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log("[SW Purge] Unregistered service worker:", registration.scope);
          }

          // 2. Delete all caches
          if ("caches" in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log("[SW Purge] Deleted cache:", cacheName);
            }
          }

          // Mark purge as complete
          sessionStorage.setItem("sw-cache-purged", "true");
          console.log("[SW Purge] Cleanup complete. Reloading page...");

          // 3. Reload the page to ensure a fresh session
          window.location.reload();
        }
      } catch (error) {
        console.error("[SW Purge] Failed to purge service workers and caches:", error);
        // Continue execution even if purge fails to avoid breaking functionality
      }
    };

    // Execute purge first, then register service worker
    purgeServiceWorkersAndCaches()
      .catch((error) => {
        console.error("[SW Purge] Unexpected error during purge:", error);
      })
      .finally(() => {
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
      });
  }, []);

  return null;
}

