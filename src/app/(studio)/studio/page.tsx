"use client";

/**
 * Studio Page - Main entry point for DJ Studio
 * 
 * Simplified to use StudioLayout which handles all audio persistence and view management
 */

import { StudioLayout } from '@/components/studio/layout/StudioLayout';

export default function Studio() {
  return <StudioLayout />;
}
