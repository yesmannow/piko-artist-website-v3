"use client";

import { useState } from 'react';

/**
 * Dev Reset Button - Clears Service Worker and Cache Storage
 *
 * Use this when development feels "cached" or "haunted" by old assets.
 * Only visible in development mode.
 */
export function DevResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleReset = async () => {
    setIsResetting(true);
    setMessage('Resetting...');

    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log(`[DevReset] Unregistered ${registrations.length} service worker(s)`);
      }

      // 2. Clear all cache storage
      if ('caches' in globalThis) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log(`[DevReset] Deleted ${cacheNames.length} cache(s)`);
      }

      // 3. Clear localStorage
      localStorage.clear();
      console.log('[DevReset] Cleared localStorage');

      // 4. Clear sessionStorage
      sessionStorage.clear();
      console.log('[DevReset] Cleared sessionStorage');

      setMessage('✅ Reset complete! Reloading...');

      // 5. Hard reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('[DevReset] Failed:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-9999 bg-yellow-500/90 text-black px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-xs font-bold uppercase">Dev Mode</div>
          <div className="text-xs">Feeling cached?</div>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3 py-1 bg-black text-yellow-500 rounded font-mono text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {isResetting ? 'Resetting...' : 'Reset SW & Cache'}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-xs font-mono">{message}</div>
      )}
    </div>
  );
}
