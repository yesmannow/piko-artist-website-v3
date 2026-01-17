"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import { useLatencyBenchmark } from "@/hooks/useLatencyBenchmark";

interface LatencyMonitorProps {
  audioContext: AudioContext | null;
  compact?: boolean;
}

/**
 * LatencyMonitor - Real-time latency monitoring UI
 *
 * Phase 4: Advanced Features - Latency Benchmarking
 *
 * Displays:
 * - Current latency in milliseconds
 * - Performance grade (A+ to F)
 * - Glitch count
 * - Real-time recommendations
 * - Historical trend
 */
export function LatencyMonitor({
  audioContext,
  compact = false,
}: LatencyMonitorProps) {
  const {
    metrics,
    isBenchmarking,
    isMonitoring,
    history,
    startMonitoring,
    stopMonitoring,
    getRecommendations,
  } = useLatencyBenchmark(audioContext);

  if (!audioContext) {
    return null;
  }

  const recommendations = getRecommendations();

  // Determine status icon and color
  const getStatusIcon = () => {
    if (!metrics) return <Activity className="w-4 h-4 text-gray-400" />;

    if (metrics.grade === "A+" || metrics.grade === "A") {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (metrics.grade === "B" || metrics.grade === "C") {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!metrics) return "#666";

    if (metrics.grade === "A+" || metrics.grade === "A") return "#22c55e";
    if (metrics.grade === "B" || metrics.grade === "C") return "#eab308";
    return "#ef4444";
  };

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm border border-white/10 font-mono text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {getStatusIcon()}

        {metrics && (
          <>
            <span style={{ color: getStatusColor() }} className="font-bold">
              {metrics.totalLatencyMs.toFixed(1)}ms
            </span>

            <span className="text-white/40">|</span>

            <span className="text-white/60">
              Grade:{" "}
              <span style={{ color: getStatusColor() }} className="font-bold">
                {metrics.grade}
              </span>
            </span>

            {metrics.glitchCount > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span className="text-red-400">
                  {metrics.glitchCount} glitches
                </span>
              </>
            )}
          </>
        )}

        {isBenchmarking && (
          <span className="text-white/60 animate-pulse">Measuring...</span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-black/80 backdrop-blur-sm border-2 border-white/10 p-4 font-mono text-xs"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold uppercase tracking-wider">
            Latency Monitor
          </h3>
        </div>

        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            isMonitoring
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-cyan-500 text-black hover:bg-cyan-400"
          }`}
        >
          {isMonitoring ? "Stop" : "Start"} Monitoring
        </button>
      </div>

      {/* Metrics Display */}
      {metrics && (
        <div className="space-y-3">
          {/* Main Latency Display */}
          <div className="flex items-baseline gap-3">
            {getStatusIcon()}

            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-bold"
                style={{ color: getStatusColor() }}
              >
                {metrics.totalLatencyMs.toFixed(1)}
              </span>
              <span className="text-white/60 text-sm">ms</span>
            </div>

            <div className="ml-auto text-right">
              <div
                className="text-2xl font-bold"
                style={{ color: getStatusColor() }}
              >
                {metrics.grade}
              </div>
              <div className="text-white/40 text-xs">
                {metrics.isAcceptable ? "Acceptable" : "High"}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
            <div>
              <div className="text-white/40 text-xs">Base Latency</div>
              <div className="text-white font-bold">
                {(metrics.baseLatency * 1000).toFixed(2)}ms
              </div>
            </div>

            <div>
              <div className="text-white/40 text-xs">Output Latency</div>
              <div className="text-white font-bold">
                {(metrics.outputLatency * 1000).toFixed(2)}ms
              </div>
            </div>

            <div>
              <div className="text-white/40 text-xs">Buffer Size</div>
              <div className="text-white font-bold">
                {metrics.bufferSize} samples
              </div>
            </div>

            <div>
              <div className="text-white/40 text-xs">Sample Rate</div>
              <div className="text-white font-bold">
                {(metrics.sampleRate / 1000).toFixed(1)}kHz
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-white/40 text-xs">Glitches Detected</div>
              <div
                className={`font-bold ${metrics.glitchCount > 0 ? "text-red-400" : "text-green-400"}`}
              >
                {metrics.glitchCount}
              </div>
            </div>
          </div>

          {/* Performance Trend */}
          {history.length > 1 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/40 text-xs mb-2">
                Performance Trend
              </div>
              <div className="flex items-end gap-1 h-12">
                {history.slice(-10).map((metric, i) => {
                  const height = Math.min(
                    100,
                    (metric.totalLatencyMs / 50) * 100,
                  );
                  const color = metric.isAcceptable ? "#22c55e" : "#ef4444";

                  return (
                    <div
                      key={i}
                      className="flex-1 bg-white/10 rounded-t"
                      style={{
                        height: `${height}%`,
                        backgroundColor: color,
                        opacity: 0.3 + (i / 10) * 0.7,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Info className="w-3 h-3" />
                <span>Recommendations</span>
              </div>

              {recommendations.map((rec, i) => (
                <div key={i} className="text-white/80 text-xs pl-5">
                  • {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Benchmarking State */}
      {isBenchmarking && (
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity className="w-4 h-4 animate-spin" />
          <span>Running benchmark...</span>
        </div>
      )}

      {/* No Metrics Yet */}
      {!metrics && !isBenchmarking && (
        <div className="text-center py-8 text-white/40">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Click "Start Monitoring" to begin</p>
        </div>
      )}
    </motion.div>
  );
}
