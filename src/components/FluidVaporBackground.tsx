"use client";

import { useEffect, useRef } from "react";
import { useDeckStore } from "@/store/deckStore";
import { useMixerStore } from "@/store/mixerStore";

/**
 * FluidVaporBackground - Cursor-reactive vapor/smoke effect
 * Uses Canvas 2D API for lightweight, performant fluid simulation
 */
export function FluidVaporBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
    }> = [];

    // Mouse position
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let mouseMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseMoved = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        mouseMoved = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Create new particle
    const createParticle = (x: number, y: number) => {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.3 + 0.1,
        life: 1.0,
      });
    };

    // Audio analysis for Bass Energy
    const getBassEnergy = (): number => {
      try {
        const engine = (window as any).AudioEngine?.getInstance?.() || null;
        if (!engine || !engine.masterAnalyser) return 0;
        
        const analyser = engine.masterAnalyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate bass energy (RMS < 250Hz)
        const sampleRate = engine.context.sampleRate || 44100;
        const binSize = (sampleRate / 2) / analyser.frequencyBinCount;
        const bassEndBin = Math.floor(250 / binSize);
        
        let sum = 0;
        for (let i = 0; i < bassEndBin; i++) {
          sum += (dataArray[i] / 255) ** 2; // Normalize to 0-1 and square
        }
        
        const rms = Math.sqrt(sum / bassEndBin);
        return rms;
      } catch (e) {
        return 0; // Fallback if audio engine not initialized
      }
    };

    // Replace strict import with a safer way to get the singleton since it might not be initialized
    import('@/lib/audioEngine').then(module => {
      (window as any).AudioEngine = module.AudioEngine;
    });

    // Animation loop
    let currentBloom = 0;
    let rotationAngle = 0;
    
    const animate = () => {
      // Determine track section from dominant deck
      const deckA = useDeckStore.getState().deckA;
      const deckB = useDeckStore.getState().deckB;
      const crossfader = useMixerStore.getState().crossfader;
      
      const dominantDeck = crossfader <= 0 ? deckA : deckB;
      let trackSection = 0; // 0=Intro/Outro, 1=Verse, 2=Drop
      let bpm = 120;
      
      if (dominantDeck.isPlaying && dominantDeck.buffer) {
        const progress = dominantDeck.currentTime / dominantDeck.buffer.duration;
        bpm = dominantDeck.track?.bpm ? Number(dominantDeck.track.bpm) : 120;
        if (progress > 0.15 && progress < 0.3) trackSection = 1;
        else if (progress >= 0.3 && progress < 0.7) trackSection = 2;
        else if (progress >= 0.7 && progress < 0.85) trackSection = 1;
        else trackSection = 0;
      }

      ctx.fillStyle = trackSection === 2 ? "rgba(2, 2, 5, 0.08)" : "rgba(5, 5, 5, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bassEnergy = getBassEnergy();
      
      // Target bloom is 1 if energy > 0.8, else 0. In Drop, lower threshold.
      const threshold = trackSection === 2 ? 0.6 : 0.8;
      const targetBloom = bassEnergy > threshold ? 1 : 0;
      currentBloom += (targetBloom - currentBloom) * (trackSection === 2 ? 0.2 : 0.1);
      
      ctx.save();
      
      // Apply Geometric Distortion during Drop (Section 2)
      if (trackSection === 2 && currentBloom > 0.1) {
         rotationAngle += 0.005 * currentBloom;
         ctx.translate(canvas.width/2, canvas.height/2);
         ctx.rotate(rotationAngle);
         const scale = 1 + bassEnergy * 0.1;
         ctx.scale(scale, scale);
         ctx.translate(-canvas.width/2, -canvas.height/2);
      }

      // Draw pulse grid
      if (currentBloom > 0.01 || trackSection >= 1) {
        const gridAlpha = trackSection === 0 ? currentBloom * 0.3 : (trackSection === 1 ? 0.1 + currentBloom * 0.4 : 0.2 + currentBloom * 0.6);
        ctx.strokeStyle = `rgba(0, 242, 255, ${gridAlpha})`;
        ctx.lineWidth = 1 + currentBloom * (trackSection === 2 ? 4 : 2);
        ctx.beginPath();
        // Verse syncs grid geometry
        const gridSize = trackSection === 1 ? 50 + Math.sin(Date.now() / (60000/bpm)) * 10 : 50;
        
        for(let x = 0; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for(let y = 0; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }

      // Create particles near cursor if moved recently
      if (mouseMoved) {
        const count = trackSection === 2 ? 4 : 2;
        for (let i = 0; i < count; i++) {
          createParticle(
            mouseX + (Math.random() - 0.5) * 50,
            mouseY + (Math.random() - 0.5) * 50
          );
        }
        mouseMoved = false;
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Apply slight attraction to cursor
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 200) {
          const force = (200 - dist) / 200;
          p.vx += (dx / dist) * force * 0.01;
          p.vy += (dy / dist) * force * 0.01;
        }

        // Apply friction
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Update life
        p.life -= 0.005;
        p.opacity = p.life * 0.3;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        if (currentBloom > 0) {
          // Bloom to Neon Blue
          const r = Math.floor(224 - (224 * currentBloom));
          const g = Math.floor(224 + (18 * currentBloom)); 
          const b = Math.floor(224 + (31 * currentBloom)); // 00f2ff -> rgb(0, 242, 255)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * (1 + currentBloom * 2)})`;
        } else {
          ctx.fillStyle = `rgba(224, 224, 224, ${p.opacity})`;
        }
        
        ctx.fill();

        // Add glow if blooming heavily
        if (currentBloom > 0.5) {
          ctx.shadowColor = '#00f2ff';
          ctx.shadowBlur = 10 * currentBloom;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }

        // Remove dead particles
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
      
      ctx.restore();

      // Limit particle count based on section
      const maxParticles = trackSection === 2 ? 200 : 100;
      if (particles.length > maxParticles) {
        particles.shift();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

