/**
 * Type declarations for lenis/react
 * This helps TypeScript resolve the subpath export correctly
 *
 * Note: The actual types are exported from lenis package, but this declaration
 * helps IDEs resolve the module when using moduleResolution: "bundler"
 */
declare module 'lenis/react' {
  import type { LenisOptions, Lenis as LenisInstance, ScrollCallback } from 'lenis';
  import type { ComponentPropsWithoutRef, ReactNode, RefAttributes } from 'react';

  export interface LenisContextValue {
    lenis: LenisInstance;
    addCallback: (callback: ScrollCallback, priority: number) => void;
    removeCallback: (callback: ScrollCallback) => void;
  }

  export interface LenisProps extends ComponentPropsWithoutRef<'div'> {
    /**
     * Setup a global instance of Lenis
     * if `asChild`, the component will render wrapper and content divs
     * @default false
     */
    root?: boolean | 'asChild';
    /**
     * Lenis options
     */
    options?: LenisOptions;
    /**
     * Auto-setup requestAnimationFrame
     * @default true
     * @deprecated use options.autoRaf instead
     */
    autoRaf?: boolean;
    /**
     * Children
     */
    children?: ReactNode;
  }

  export interface LenisRef {
    wrapper: HTMLDivElement | null;
    content: HTMLDivElement | null;
    lenis?: LenisInstance;
  }

  export const ReactLenis: React.ForwardRefExoticComponent<
    Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, 'ref'> &
      LenisProps &
      RefAttributes<LenisRef>
  >;

  /**
   * Hook to access the Lenis instance
   * @param callback Optional scroll callback
   * @param deps Optional dependency array for callback
   * @param priority Optional priority for callback
   * @returns Lenis instance or undefined
   */
  export function useLenis(callback?: ScrollCallback, deps?: React.DependencyList, priority?: number): LenisInstance | undefined;

  export { ReactLenis as Lenis, ReactLenis as default };
  export type { LenisContextValue, LenisProps, LenisRef };
}

