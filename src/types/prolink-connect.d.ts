/**
 * Type declarations for prolink-connect
 *
 * This package is used in a Node.js sidecar, not in the Next.js app.
 * These types are stubs to satisfy TypeScript during build.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'prolink-connect' {
  export function bringOnline(): void;
  export interface Network {
    on(event: string, callback: (data: any) => void): void;
  }
}
