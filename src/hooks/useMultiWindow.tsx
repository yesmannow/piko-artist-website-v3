"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Monitor, ExternalLink, X } from "lucide-react";

/**
 * Multi-Window Manager
 *
 * Phase 4: Advanced Features - Multi-Window Support
 *
 * Allows "popping out" modules into separate browser windows:
 * - Visualizer window
 * - Playlist window
 * - Effects panel window
 * - Uses Window Management API when available
 * - Fallback to standard window.open()
 * - Cross-window state synchronization via BroadcastChannel
 */

export type WindowType = "visualizer" | "playlist" | "effects" | "mixer";

interface PopoutWindow {
  type: WindowType;
  window: Window;
  url: string;
  title: string;
}

interface WindowConfig {
  url: string;
  title: string;
  width: number;
  height: number;
  features?: string;
}

const WINDOW_CONFIGS: Record<WindowType, WindowConfig> = {
  visualizer: {
    url: "/studio/visualizer",
    title: "Audio Visualizer",
    width: 1200,
    height: 800,
    features: "menubar=no,toolbar=no,location=no,status=no",
  },
  playlist: {
    url: "/studio/playlist",
    title: "Playlist Manager",
    width: 600,
    height: 900,
    features: "menubar=no,toolbar=no,location=no,status=no",
  },
  effects: {
    url: "/studio/effects",
    title: "Effects Panel",
    width: 500,
    height: 700,
    features: "menubar=no,toolbar=no,location=no,status=no",
  },
  mixer: {
    url: "/studio/mixer",
    title: "Mixer Console",
    width: 800,
    height: 600,
    features: "menubar=no,toolbar=no,location=no,status=no",
  },
};

/**
 * useMultiWindow Hook
 *
 * Manages multiple pop-out windows with cross-window communication
 */
export function useMultiWindow() {
  const [windows, setWindows] = useState<Map<WindowType, PopoutWindow>>(
    new Map(),
  );
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  // Initialize BroadcastChannel for cross-window communication
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      broadcastChannelRef.current = new BroadcastChannel("studio-sync");

      broadcastChannelRef.current.onmessage = (event) => {
        console.log("[MultiWindow] Received message:", event.data);
        // Handle cross-window messages here
        // e.g., sync audio state, mixer settings, etc.
      };

      console.log("[MultiWindow] BroadcastChannel initialized");
    } catch (error) {
      console.warn("[MultiWindow] BroadcastChannel not supported:", error);
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Check for closed windows periodically
  useEffect(() => {
    checkIntervalRef.current = window.setInterval(() => {
      setWindows((currentWindows) => {
        const newWindows = new Map(currentWindows);
        let changed = false;

        for (const [type, popout] of newWindows.entries()) {
          if (popout.window.closed) {
            console.log(`[MultiWindow] Window closed: ${type}`);
            newWindows.delete(type);
            changed = true;
          }
        }

        return changed ? newWindows : currentWindows;
      });
    }, 1000);

    return () => {
      if (checkIntervalRef.current !== null) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  /**
   * Open a pop-out window
   */
  const openWindow = useCallback(
    async (type: WindowType) => {
      // Check if window is already open
      if (windows.has(type)) {
        const existing = windows.get(type);
        if (existing && !existing.window.closed) {
          existing.window.focus();
          return;
        }
      }

      const config = WINDOW_CONFIGS[type];

      // Try to use Window Management API for multi-monitor support
      let targetWindow: Window | null = null;

      if ("getScreenDetails" in window) {
        try {
          // @ts-expect-error - Window Management API not in standard TypeScript lib
          const screenDetails = await window.getScreenDetails();
          const screens = screenDetails.screens;

          // Try to place on secondary screen if available
          if (screens.length > 1) {
            const secondaryScreen = screens[1];
            const left = secondaryScreen.availLeft + 100;
            const top = secondaryScreen.availTop + 100;

            targetWindow = window.open(
              config.url,
              config.title,
              `${config.features},width=${config.width},height=${config.height},left=${left},top=${top}`,
            );

            console.log(
              "[MultiWindow] Using Window Management API for secondary screen",
            );
          }
        } catch (error) {
          console.warn(
            "[MultiWindow] Window Management API not available:",
            error,
          );
        }
      }

      // Fallback to standard window.open
      if (!targetWindow) {
        // Calculate centered position
        const left = window.screenX + (window.outerWidth - config.width) / 2;
        const top = window.screenY + (window.outerHeight - config.height) / 2;

        targetWindow = window.open(
          config.url,
          config.title,
          `${config.features},width=${config.width},height=${config.height},left=${left},top=${top}`,
        );
      }

      if (targetWindow) {
        const popout: PopoutWindow = {
          type,
          window: targetWindow,
          url: config.url,
          title: config.title,
        };

        setWindows((current) => new Map(current).set(type, popout));

        console.log(`[MultiWindow] Opened window: ${type}`);

        // Send initialization message to new window
        setTimeout(() => {
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: "window-opened",
              windowType: type,
              timestamp: Date.now(),
            });
          }
        }, 1000);
      } else {
        console.error("[MultiWindow] Failed to open window. Popup blocked?");
      }
    },
    [windows],
  );

  /**
   * Close a pop-out window
   */
  const closeWindow = useCallback(
    (type: WindowType) => {
      const popout = windows.get(type);
      if (popout && !popout.window.closed) {
        popout.window.close();
      }

      setWindows((current) => {
        const newWindows = new Map(current);
        newWindows.delete(type);
        return newWindows;
      });

      console.log(`[MultiWindow] Closed window: ${type}`);
    },
    [windows],
  );

  /**
   * Close all pop-out windows
   */
  const closeAll = useCallback(() => {
    windows.forEach((popout) => {
      if (!popout.window.closed) {
        popout.window.close();
      }
    });

    setWindows(new Map());
    console.log("[MultiWindow] Closed all windows");
  }, [windows]);

  /**
   * Broadcast message to all windows
   */
  const broadcast = useCallback((message: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(message);
    }
  }, []);

  /**
   * Check if window is open
   */
  const isWindowOpen = useCallback(
    (type: WindowType): boolean => {
      const popout = windows.get(type);
      return popout ? !popout.window.closed : false;
    },
    [windows],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeAll();
    };
  }, [closeAll]);

  return {
    windows: Array.from(windows.values()),
    openWindow,
    closeWindow,
    closeAll,
    broadcast,
    isWindowOpen,
  };
}

/**
 * PopoutButton Component
 *
 * Button to trigger window pop-out
 */

interface PopoutButtonProps {
  type: WindowType;
  label: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  icon?: React.ReactNode;
}

export function PopoutButton({
  type,
  label,
  isOpen,
  onOpen,
  onClose,
  icon,
}: PopoutButtonProps) {
  const buttonClass = isOpen
    ? "flex items-center gap-2 px-4 py-2 border-2 font-mono text-sm transition-all bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400"
    : "flex items-center gap-2 px-4 py-2 border-2 font-mono text-sm transition-all bg-black/80 text-white border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10";

  return (
    <button
      onClick={isOpen ? onClose : onOpen}
      className={buttonClass}
      aria-label={`${isOpen ? "Close" : "Open"} ${label} window`}
    >
      {icon || <Monitor className="w-4 h-4" />}
      <span>{label}</span>
      {isOpen ? (
        <X className="w-3 h-3" />
      ) : (
        <ExternalLink className="w-3 h-3" />
      )}
    </button>
  );
}

/**
 * Multi-Window Control Panel
 *
 * UI for managing all pop-out windows
 */

interface MultiWindowControlPanelProps {
  className?: string;
}

export function MultiWindowControlPanel({
  className = "",
}: MultiWindowControlPanelProps) {
  const { openWindow, closeWindow, isWindowOpen } = useMultiWindow();

  const windowTypes: { type: WindowType; label: string }[] = [
    { type: "visualizer", label: "Visualizer" },
    { type: "playlist", label: "Playlist" },
    { type: "effects", label: "Effects" },
    { type: "mixer", label: "Mixer" },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-white/60 text-xs uppercase tracking-wider mb-3 font-bold">
        Multi-Window Mode
      </div>

      <div className="grid grid-cols-2 gap-2">
        {windowTypes.map(({ type, label }) => (
          <PopoutButton
            key={type}
            type={type}
            label={label}
            isOpen={isWindowOpen(type)}
            onOpen={() => openWindow(type)}
            onClose={() => closeWindow(type)}
          />
        ))}
      </div>

      <div className="text-white/40 text-xs pt-2">
        💡 Pop out modules to separate windows for multi-monitor setups
      </div>
    </div>
  );
}
