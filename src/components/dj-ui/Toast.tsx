"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  show: boolean;
}

export function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
  show,
}: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const Icon = type === "error" ? AlertCircle : type === "success" ? CheckCircle : Info;
  const colors = {
    error: "bg-red-500/90 border-red-600",
    success: "bg-green-500/90 border-green-600",
    info: "bg-blue-500/90 border-blue-600",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] ${colors[type]} backdrop-blur-sm border-2 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[90vw]`}
        >
          <Icon className="w-5 h-5 text-white flex-shrink-0" />
          <p className="text-white font-barlow text-sm flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
