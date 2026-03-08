"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export interface AISuggestion {
  id: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

// Simple event bus for the toast (in a real app, this might be a Zustand store)
type Listener = (suggestion: AISuggestion) => void;
const listeners = new Set<Listener>();

export const notifyAISuggestion = (suggestion: Omit<AISuggestion, 'id'>) => {
  const fullSuggestion = { ...suggestion, id: Math.random().toString(36).substring(7) };
  listeners.forEach((listener) => listener(fullSuggestion));
};

export function AIToastContainer() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    const handleAdd = (suggestion: AISuggestion) => {
      setSuggestions((prev) => [...prev, suggestion]);
      // Auto dismiss after 5 seconds if no action
      if (!suggestion.action) {
        setTimeout(() => {
          setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        }, 5000);
      }
    };

    listeners.add(handleAdd);
    return () => {
      listeners.delete(handleAdd);
    };
  }, []);

  const removeSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {suggestions.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="pointer-events-auto flex items-center gap-3 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-md border border-indigo-500/30 p-3 rounded-2xl shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="text-sm font-medium text-white/90 max-w-[250px] leading-tight">
              {s.message}
            </p>
            {s.action && s.actionLabel && (
              <button
                onClick={() => {
                  s.action!();
                  removeSuggestion(s.id);
                }}
                className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/50 rounded-lg text-xs font-semibold text-indigo-200 uppercase tracking-wider transition-colors ml-2"
              >
                {s.actionLabel}
              </button>
            )}
            <button
              onClick={() => removeSuggestion(s.id)}
              className="p-1 text-white/40 hover:text-white/80 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
