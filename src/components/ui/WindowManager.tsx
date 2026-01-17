"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Maximize2, Move } from "lucide-react";

export interface WindowConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface WindowManagerProps {
  windows: WindowConfig[];
  onWindowUpdate: (id: string, updates: Partial<WindowConfig>) => void;
  onWindowClose: (id: string) => void;
  onWindowFocus: (id: string) => void;
}

export function WindowManager({
  windows,
  onWindowUpdate,
  onWindowClose,
  onWindowFocus,
}: WindowManagerProps) {
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, windowId: string) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragRef.current = {
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
      };
      setDraggedWindow(windowId);
      onWindowFocus(windowId);
    },
    [onWindowFocus]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedWindow || !dragRef.current) return;

      const newX = e.clientX - dragRef.current.startX;
      const newY = e.clientY - dragRef.current.startY;

      onWindowUpdate(draggedWindow, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) },
      });
    },
    [draggedWindow, onWindowUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedWindow(null);
    dragRef.current = null;
  }, []);

  // Global mouse event listeners
  React.useEffect(() => {
    if (draggedWindow) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWindow, handleMouseMove, handleMouseUp]);

  const handleMinimize = (windowId: string) => {
    onWindowUpdate(windowId, { isMinimized: true });
  };

  const handleMaximize = (windowId: string) => {
    onWindowUpdate(windowId, { isMaximized: !windows.find(w => w.id === windowId)?.isMaximized });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {windows.map((window) => {
          if (window.isMinimized) return null;

          const Component = window.component;

          return (
            <motion.div
              key={window.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: window.position.x,
                y: window.position.y,
                width: window.isMaximized ? '100vw' : window.size.width,
                height: window.isMaximized ? '100vh' : window.size.height,
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-2xl pointer-events-auto overflow-hidden"
              style={{ zIndex: window.zIndex }}
            >
              {/* Window Title Bar */}
              <div
                className="flex items-center justify-between bg-gray-800 px-3 py-2 cursor-move select-none"
                onMouseDown={(e) => handleMouseDown(e, window.id)}
              >
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">{window.title}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMinimize(window.id)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMaximize(window.id)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onWindowClose(window.id)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Window Content */}
              <div className="flex-1 overflow-auto">
                <Component {...window.props} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Taskbar for minimized windows */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-sm border-t border-gray-700 flex items-center gap-2 px-4">
        {windows
          .filter((w) => w.isMinimized)
          .map((window) => (
            <button
              key={window.id}
              onClick={() => onWindowUpdate(window.id, { isMinimized: false })}
              className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors"
            >
              <span>{window.title}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

// Hook for managing window state
export function useWindowManager() {
  const [windows, setWindows] = useState<WindowConfig[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);

  const addWindow = useCallback(
    (
      id: string,
      title: string,
      component: React.ComponentType<any>,
      props: Record<string, any> = {},
      position?: { x: number; y: number },
      size?: { width: number; height: number }
    ) => {
      const newWindow: WindowConfig = {
        id,
        title,
        component,
        props,
        position: position || { x: 100 + windows.length * 30, y: 100 + windows.length * 30 },
        size: size || { width: 400, height: 400 },
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZIndex,
      };

      setWindows((prev) => [...prev, newWindow]);
      setNextZIndex((prev) => prev + 1);
    },
    [windows.length, nextZIndex]
  );

  const updateWindow = useCallback((id: string, updates: Partial<WindowConfig>) => {
    setWindows((prev) =>
      prev.map((window) => {
        if (window.id === id) {
          // If focusing, bring to front
          if (updates.zIndex === undefined && !updates.isMinimized) {
            setNextZIndex((prevZ) => prevZ + 1);
            updates.zIndex = nextZIndex + 1;
          }
          return { ...window, ...updates };
        }
        return window;
      })
    );
  }, [nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((window) => window.id !== id));
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      updateWindow(id, { zIndex: nextZIndex });
      setNextZIndex((prev) => prev + 1);
    },
    [nextZIndex, updateWindow]
  );

  return {
    windows,
    addWindow,
    updateWindow,
    closeWindow,
    focusWindow,
  };
}
