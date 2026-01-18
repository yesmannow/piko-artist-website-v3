"use client";

import { useEffect, useState } from 'react';

/**
 * useIsHydrated - Hook to detect when component has hydrated on client
 *
 * Prevents hydration mismatches by only rendering client-only content
 * after the component has mounted on the client side.
 *
 * @example
 * ```tsx
 * const isHydrated = useIsHydrated();
 * return isHydrated ? <ClientOnlyComponent /> : null;
 * ```
 */
export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
