"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistration - Registers the service worker for PWA functionality
 *
 * This component should be mounted in the root layout to enable
 * offline functionality and asset caching.
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
        } catch (error) {
          console.error("[SW] Service Worker registration failed:", error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}

