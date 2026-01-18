"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface OverlayShellProps {
  open: boolean;
  onClose?: () => void;
  z?: "overlay" | "modal";
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  /**
   * Custom backdrop component (optional)
   * If provided, replaces default backdrop
   */
  backdrop?: React.ReactNode;
}

/**
 * OverlayShell - Standardized overlay component with consistent z-index, scroll lock, and behavior
 *
 * Features:
 * - Renders via portal to document.body (avoids stacking context traps)
 * - Consistent z-index system (overlay: 200, modal: 300)
 * - Automatic scroll lock via useBodyScrollLock hook
 * - ESC key handling
 * - Backdrop click to close
 * - Sets data-modal-open="true" on wrapper when open
 * - Proper pointer-events handling
 */
export function OverlayShell({
  open,
  onClose,
  z = "overlay",
  closeOnEsc = true,
  closeOnBackdrop = true,
  children,
  className = "",
  backdropClassName = "",
  backdrop,
}: OverlayShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted (for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useBodyScrollLock(open);

  // Handle ESC key
  useEffect(() => {
    if (!open || !closeOnEsc || !onClose) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, closeOnEsc, onClose]);

  // Set data-modal-open attribute on body when open (for global styling/behavior)
  useEffect(() => {
    if (open) {
      document.body.setAttribute("data-modal-open", "true");
    } else {
      document.body.removeAttribute("data-modal-open");
    }

    return () => {
      document.body.removeAttribute("data-modal-open");
    };
  }, [open]);

  // Default backdrop
  const defaultBackdrop = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`absolute inset-0 bg-black/80 ${backdropClassName}`}
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
    />
  );

  if (!mounted) return null;

  const zIndexClass = z === "modal" ? "z-modal" : "z-overlay";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 ${className}`}
          data-modal-open="true"
        >
          {backdrop || defaultBackdrop}
          <div
            className="relative z-10 w-full h-full flex items-center justify-center"
            onClick={(e) => {
              // Prevent backdrop click when clicking content
              e.stopPropagation();
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

