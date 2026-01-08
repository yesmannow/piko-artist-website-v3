"use client";

import { useEffect, useState } from 'react';

/**
 * REMEDIATION: Mobile Detection Hook
 * Detects mobile devices to apply WebGL optimizations
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // Also check screen size (mobile typically < 768px width)
    const isSmallScreen = window.innerWidth < 768;
    
    // Check for touch support
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Consider it mobile if it matches any criteria
    setIsMobile(isMobileDevice || (isSmallScreen && isTouchDevice));
  }, []);

  return isMobile;
}
