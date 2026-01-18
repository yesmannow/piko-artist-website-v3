"use client";

import { useState, useRef, useCallback } from 'react';
import type { Keyframe } from '@/lib/fx/FXAutomation';

interface FXAutomationCurveEditorProps {
  keyframes: Keyframe[];
  onChange: (newFrames: Keyframe[]) => void;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * FXAutomationCurveEditor - Interactive SVG-based curve editor
 * 
 * Features:
 * - Drag keyframes to adjust time/value
 * - Click to add new keyframes
 * - Double-click to delete keyframes
 * - Smooth curve visualization with tension
 */
export function FXAutomationCurveEditor({
  keyframes,
  onChange,
  duration = 60,
  width = 600,
  height = 200,
}: FXAutomationCurveEditorProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  // Convert keyframe to SVG coordinates
  const toSVGCoords = useCallback(
    (kf: Keyframe) => {
      const x = (kf.time / duration) * width;
      const y = height - kf.value * height;
      return { x, y };
    },
    [duration, width, height]
  );

  // Convert SVG coordinates to keyframe
  const fromSVGCoords = useCallback(
    (x: number, y: number): Keyframe => {
      const time = Math.max(0, Math.min((x / width) * duration, duration));
      const value = Math.max(0, Math.min(1 - y / height, 1));
      return { time, value };
    },
    [duration, width, height]
  );

  // Generate smooth curve path using quadratic bezier
  const generateCurvePath = useCallback(() => {
    if (sortedKeyframes.length === 0) return '';

    const points = sortedKeyframes.map(toSVGCoords);
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;

      if (i === 0) {
        path += ` L ${midX} ${midY}`;
      } else {
        const prev = points[i - 1];
        const cp1X = (current.x + prev.x) / 2;
        const cp1Y = (current.y + prev.y) / 2;
        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      }
    }

    if (points.length > 1) {
      path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    }

    return path;
  }, [sortedKeyframes, toSVGCoords]);

  const handleMouseDown = (index: number, e: React.MouseEvent<SVGCircleElement>) => {
    e.preventDefault();
    const kf = sortedKeyframes[index];
    const coords = toSVGCoords(kf);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingIndex(index);
    setDragOffset({
      x: e.clientX - rect.left - coords.x,
      y: e.clientY - rect.top - coords.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (draggingIndex === null || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      const newKf = fromSVGCoords(x, y);
      const updated = [...sortedKeyframes];
      updated[draggingIndex] = newKf;
      updated.sort((a, b) => a.time - b.time);

      // Update the dragging index after sort
      const newIndex = updated.findIndex(
        (kf) => Math.abs(kf.time - newKf.time) < 0.01
      );

      if (newIndex !== -1) {
        setDraggingIndex(newIndex);
        onChange(updated);
      }
    },
    [draggingIndex, dragOffset, sortedKeyframes, fromSVGCoords, onChange]
  );

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const handleDoubleClick = (index: number) => {
    const updated = sortedKeyframes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingIndex !== null) return; // Don't add keyframe while dragging

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newKf = fromSVGCoords(x, y);

    // Don't add if clicking on existing keyframe
    const tooClose = sortedKeyframes.some(
      (kf) => Math.abs(kf.time - newKf.time) < 0.5
    );
    if (tooClose) return;

    const updated = [...sortedKeyframes, newKf].sort((a, b) => a.time - b.time);
    onChange(updated);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Curve Editor</h4>
        <p className="text-xs text-white/60">
          Click to add • Drag to move • Double-click to delete
        </p>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        {/* Grid */}
        <defs>
          <pattern
            id="grid"
            width="60"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Value lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((val) => (
          <line
            key={val}
            x1={0}
            y1={height - val * height}
            x2={width}
            y2={height - val * height}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Time markers */}
        {[0, 15, 30, 45, 60].map((time) => (
          <line
            key={time}
            x1={(time / duration) * width}
            y1={0}
            x2={(time / duration) * width}
            y2={height}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Curve path */}
        {sortedKeyframes.length > 0 && (
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Gradient for curve */}
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c1ff00" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Keyframes */}
        {sortedKeyframes.map((kf, index) => {
          const coords = toSVGCoords(kf);
          return (
            <g key={index}>
              {/* Keyframe circle */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={draggingIndex === index ? 8 : 6}
                fill={draggingIndex === index ? '#c1ff00' : '#7c3aed'}
                stroke="white"
                strokeWidth="2"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleMouseDown(index, e)}
                onDoubleClick={() => handleDoubleClick(index)}
              />
              {/* Value label */}
              <text
                x={coords.x}
                y={coords.y - 12}
                textAnchor="middle"
                className="text-[10px] fill-white/80 pointer-events-none"
              >
                {kf.value.toFixed(2)}
              </text>
              {/* Time label */}
              <text
                x={coords.x}
                y={height + 16}
                textAnchor="middle"
                className="text-[10px] fill-white/60 pointer-events-none"
              >
                {kf.time.toFixed(1)}s
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
