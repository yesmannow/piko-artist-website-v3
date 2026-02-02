// src/components/ui/JogArtwork.tsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useArtworkPreload } from '@/hooks/useArtworkPreload';
import './JogArtwork.css';

/**
 * Performance Considerations:
 * - Preloads images and creates small thumbnails via useArtworkPreload hook
 * - OffscreenCanvas: Could be used for heavy drawing in workers for very large canvases
 * - Throttles scratch updates with requestAnimationFrame in animation loops
 * - Fallback to CSS background on low-performance devices (performanceMode="low")
 * - Caches thumbnails in memory via useArtworkPreload to avoid repeated decode
 */

export type JogArtworkHandle = {
  setRotation: (deg: number) => void;
  setSpinning: (on: boolean) => void;
  nudge: (direction: 'left' | 'right', amount?: number) => void;
};

type Props = {
  src?: string;
  size?: number; // px
  alt?: string;
  performanceMode?: 'high' | 'low';
  energy?: number; // 0-1 for reactive lighting
  trackTitle?: string;
  trackArtist?: string;
  onScratch?: (angle: number) => void;
};

const Grooves = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
  // draw subtle concentric grooves
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#000';
  for (let r = radius * 0.9; r > radius * 0.2; r -= 2.5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

export const JogArtwork = forwardRef<JogArtworkHandle, Props>(({
  src,
  size = 320,
  alt = 'Track artwork',
  performanceMode = 'high',
  energy = 0,
  trackTitle,
  trackArtist,
  onScratch: _onScratch
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const spinningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const nudgeRef = useRef<{ active: boolean; target: number; startTime: number } | null>(null);
  const { img, thumb } = useArtworkPreload(src, 256);

  // Nudge animation
  const drawRef = useRef<(rotation?: number) => void | null>(null);
  const loopRef = useRef<(() => void) | null>(null);

  const animateNudge = useCallback(() => {
    if (!nudgeRef.current?.active) return;

    const elapsed = Date.now() - nudgeRef.current.startTime;
    const duration = 200; // ms
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    const currentRotation = nudgeRef.current.target * easeOut;
    rotationRef.current = currentRotation;
  drawRef.current?.(currentRotation);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animateNudge);
    } else {
      nudgeRef.current = null;
      rafRef.current = null;
    }
  }, []);

  // Nudge method
  const nudge = useCallback((direction: 'left' | 'right', amount = 15) => {
    if (nudgeRef.current?.active) return; // prevent overlapping nudges

    const nudgeAmount = direction === 'left' ? -amount : amount;
    nudgeRef.current = {
      active: true,
      target: rotationRef.current + nudgeAmount,
      startTime: Date.now()
    };

    animateNudge();
  }, [animateNudge]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nudge('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          nudge('right');
          break;
      }
    };

    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).addEventListener === 'function') {
      (globalThis as any).addEventListener('keydown', handleKeyDown);
      return () => (globalThis as any).removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [nudge]);

  // draw function
  const draw = (rotation = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  const dpr = (typeof globalThis !== 'undefined' && (globalThis as any).devicePixelRatio) || 1;
    const w = size;
    const h = size;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 6;

    // draw circular clipped artwork
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // rotate context for spinning effect
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // draw image (use thumbnail if available for speed)
  if (thumb && performanceMode === 'high') {
      // draw thumbnail scaled to cover
      const imgCanvas = thumb;
      const scale = Math.max(w / imgCanvas.width, h / imgCanvas.height);
      const iw = imgCanvas.width * scale;
      const ih = imgCanvas.height * scale;
      ctx.drawImage(imgCanvas, (w - iw) / 2, (h - ih) / 2, iw, ih);
    } else if (img) {
      const image = img;
      const scale = Math.max(w / image.width, h / image.height);
      const iw = image.width * scale;
      const ih = image.height * scale;
      ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
    } else {
      // fallback: neutral radial gradient
      const g = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      g.addColorStop(0, '#222');
      g.addColorStop(1, '#111');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

  // grooves overlay (subtle)
  Grooves(ctx, cx, cy, radius);

    // rim: outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.restore();

    // center label (small circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    ctx.restore();

    // subtle highlight (top-left)
    ctx.save();
    const grad = ctx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.6, 2, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.06)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // store ref to drawing fn so callbacks can use it without being a dependency
    drawRef.current = draw;
  };

  // animation loop for spinning
  const loop = () => {
    if (!spinningRef.current) { rafRef.current = null; return; }
    rotationRef.current = (rotationRef.current + 0.6) % 360; // base speed
    draw(rotationRef.current);
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    // initial draw
    drawRef.current?.(rotationRef.current);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, thumb, size, performanceMode]);

  useImperativeHandle(ref, () => ({
    setRotation: (deg: number) => {
      rotationRef.current = deg;
      drawRef.current?.(rotationRef.current);
    },
    setSpinning: (on: boolean) => {
      spinningRef.current = on;
      if (on && !rafRef.current) rafRef.current = requestAnimationFrame(() => loopRef.current?.());
      if (!on && rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    },
    nudge,
  }), [img, thumb, size, performanceMode, nudge]);

  // Reactive lighting based on energy
  const reactiveShadow = `0 8px 30px rgba(0,0,0,${0.4 + energy * 0.6})`;

  return (
    <div
      className="jog-artwork-wrapper"
      ref={wrapperRef}
      style={{
        width: size,
        height: size,
        boxShadow: reactiveShadow
      }}
      aria-hidden={false}
    >
      {performanceMode === 'low' ? (
        // Low-power CSS fallback. Provide real <img> for accessibility but hide it visually.
        <div style={{ position: 'relative' }}>
          <div
            className="jog-fallback"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundImage: src ? `url(${src})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: reactiveShadow,
              filter: 'blur(0.5px)'
            }}
            aria-hidden={true}
          />
          {src && (
            <img src={src} alt={alt} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} aria-hidden={false} />
          )}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="jog-artwork-canvas"
          aria-hidden={true}
          tabIndex={-1}
        />
      )}

      {/* Center vinyl label */}
      {(trackTitle || trackArtist) && (
        <div className="jog-center-label" aria-hidden="true">
          {trackTitle && <span className="label-title">{trackTitle}</span>}
          {trackArtist && <span className="label-artist">{trackArtist}</span>}
        </div>
      )}
    </div>
  );
});

JogArtwork.displayName = 'JogArtwork';
