"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * PHASE 10: Studio Error Boundary
 * 
 * Catches errors in the Studio V2 application and displays a friendly error screen.
 * Handles crashes from:
 * - AudioEngine failures
 * - WebGL context loss
 * - React component errors
 * - Web Worker failures
 */
export class StudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('🚨 Studio Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReload = () => {
    // Hard reload to reset all state
    window.location.reload();
  };

  handleReset = () => {
    // Try to recover without full reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-black to-black flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-gray-900 rounded-lg shadow-2xl border-2 border-red-500 overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <h1 className="text-xl font-barlow uppercase tracking-wider text-white font-bold">
                Studio Error
              </h1>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              <div>
                <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-2">
                  What Happened
                </h2>
                <p className="text-white text-sm">
                  The audio engine or graphics system encountered an unexpected error and needs to be restarted.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div>
                  <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-2">
                    Error Details (Dev Mode)
                  </h2>
                  <div className="bg-black rounded p-4 overflow-auto max-h-48">
                    <pre className="text-xs text-red-400 font-mono">
                      {this.state.error.toString()}
                      {this.state.errorInfo && (
                        <>
                          {'\n\n'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Possible Causes */}
              <div>
                <h2 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-2">
                  Common Causes
                </h2>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• WebGL context lost (GPU driver issue)</li>
                  <li>• AudioContext suspended (browser autoplay policy)</li>
                  <li>• Web Worker crash (memory issue)</li>
                  <li>• MIDI device disconnected unexpectedly</li>
                  <li>• Browser compatibility issue</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-barlow uppercase font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Studio
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-barlow uppercase font-bold transition-all active:scale-95"
                >
                  Try Again
                </button>
              </div>

              {/* Support Info */}
              <div className="pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-600 text-center">
                  If this error persists, try clearing your browser cache or using a different browser.
                  <br />
                  Recommended: Chrome/Edge 90+ or Safari 14+
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
