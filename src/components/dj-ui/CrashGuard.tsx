"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface CrashGuardProps {
  children: ReactNode;
}

interface CrashGuardState {
  hasError: boolean;
  error: Error | null;
}

export class CrashGuard extends Component<CrashGuardProps, CrashGuardState> {
  constructor(props: CrashGuardProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CrashGuardState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error boundaries should log errors for monitoring
    // In production, consider sending to error tracking service
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("DJ Console Error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1a1a1a] border-2 border-[#ccff00] rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-[#ccff00]" />
              <h1 className="text-2xl font-header uppercase tracking-wider text-[#ccff00]">
                SYSTEM FAILURE
              </h1>
            </div>
            <div className="space-y-3">
              <p className="text-gray-300 font-barlow text-sm leading-relaxed">
                Your device may not support 3D acceleration or WebGL. The DJ Console requires
                hardware-accelerated graphics to function properly.
              </p>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-gray-400 font-barlow text-xs uppercase tracking-wider">
                  Recommended: Try using a Desktop browser or a device with updated graphics drivers.
                </p>
              </div>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                aria-label="Retry loading the DJ console"
                className="mt-4 w-full px-4 py-2 bg-[#ccff00] text-black font-industrial font-bold uppercase tracking-wider rounded border-2 border-black shadow-hard hover:bg-[#b8e600] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:ring-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

