"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface CanvasRecorderRef {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
}

interface CanvasRecorderProps {
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  width?: number;
  height?: number;
  className?: string;
  hidden?: boolean;
}

/**
 * CanvasRecorder - Component for rendering visuals to a canvas
 *
 * Continuously renders frames using requestAnimationFrame.
 * Can be used for waveform visualization, FX parameter animations, etc.
 *
 * @example
 * ```tsx
 * <CanvasRecorder
 *   draw={(ctx, frame) => {
 *     // Draw waveform
 *     ctx.fillStyle = '#c1ff00';
 *     ctx.fillRect(0, 0, 100, 50);
 *   }}
 *   width={1280}
 *   height={720}
 * />
 * ```
 */
export const CanvasRecorder = forwardRef<CanvasRecorderRef, CanvasRecorderProps>(
  ({ draw, width = 1280, height = 720, className = '', hidden = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);
    const animationFrameRef = useRef<number | undefined>(undefined);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Set fill style for background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      let isActive = true;

      const render = () => {
        if (!isActive) return;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Draw frame
        try {
          draw(ctx, frameRef.current);
          frameRef.current++;
        } catch (error) {
          console.error('Error in draw function:', error);
        }

        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        isActive = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [draw, width, height]);

    return (
      <canvas
        ref={canvasRef}
        className={hidden ? 'hidden' : className}
        style={{ display: hidden ? 'none' : 'block' }}
      />
    );
  }
);

CanvasRecorder.displayName = 'CanvasRecorder';
