"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  accentColor?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
  className = "",
  headerClassName = "",
  contentClassName = "",
  accentColor = "#00ff00",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { triggerHaptic } = useHaptic();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  const toggleOpen = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`border border-gray-800 rounded-lg overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      {/* Header */}
      <button
        onClick={toggleOpen}
        className={`w-full px-4 py-3 flex items-center justify-between gap-3 transition-all hover:bg-gray-900/50 ${headerClassName}`}
        style={{
          borderLeft: `3px solid ${isOpen ? accentColor : "transparent"}`,
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div
              className="flex-shrink-0 transition-colors"
              style={{ color: isOpen ? accentColor : "#6b7280" }}
            >
              {icon}
            </div>
          )}
          <h3
            className="text-sm md:text-base font-barlow uppercase tracking-wider text-left truncate transition-colors"
            style={{ color: isOpen ? accentColor : "#9ca3af" }}
          >
            {title}
          </h3>
          {badge !== undefined && (
            <span
              className="flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded-full"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          style={{ color: isOpen ? accentColor : "#6b7280" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: contentHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              ref={contentRef}
              className={`p-4 border-t border-gray-800 ${contentClassName}`}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
