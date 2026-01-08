"use client";

import { Suspense, useEffect, useRef } from "react";
import { DJInterface } from "@/components/DJInterface";
import { HelpProvider } from "@/context/HelpContext";
import { CrashGuard } from "@/components/dj-ui/CrashGuard";
import { useAudio } from "@/context/AudioContext";
// Preload 3D models early
import "@/components/dj-ui/preload3D";

function NeonDust() {
  const { audioRef } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const sourceCreatedRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const resize = () => { const dpr = Math.max(1, window.devicePixelRatio || 1); c.width = Math.floor(c.clientWidth * dpr); c.height = Math.floor(c.clientHeight * dpr); ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr); };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const el = audioRef.current; if (!el || sourceCreatedRef.current) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ac = new AC(); const analyser = ac.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.85;
    try { const src = ac.createMediaElementSource(el); src.connect(analyser); sourceCreatedRef.current = true; } catch {}
    analyserRef.current = analyser; dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    return () => { analyserRef.current = null; dataRef.current = null; ac.close().catch(() => {}); sourceCreatedRef.current = false; };
  }, [audioRef]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxP = prefersReduced ? 0 : Math.min(3000, Math.floor(window.innerWidth * 1.5));
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = mobile ? Math.min(800, Math.max(300, Math.floor(maxP * 0.35))) : Math.max(1200, Math.floor(maxP * 0.6));
    type P = { x:number;y:number;vx:number;vy:number;s:number;a:number;t:number };
    const ps: P[] = new Array(count).fill(0).map(() => ({ x: Math.random()*c.clientWidth, y: Math.random()*c.clientHeight, vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4, s:0.6+Math.random()*1.6, a:0.1+Math.random()*0.25, t:Math.random()*Math.PI*2 }));
    let run = true; const onVis = () => { run = !document.hidden; if (run && rafRef.current == null) loop(); }; document.addEventListener('visibilitychange', onVis);
    const gold = { r:255, g:215, b:0 }; ctx.globalCompositeOperation = 'lighter';
    const levels = () => { const arr = dataRef.current; const an = analyserRef.current; if (!arr||!an) return { bass:0, mid:0, high:0, overall:0 }; an.getByteFrequencyData(arr); const len = arr.length; const lowEnd = Math.floor((200/22050)*len); const midEnd = Math.floor((2000/22050)*len); let lb=0,mb=0,hb=0,ob=0; for(let i=0;i<len;i++){ const v=arr[i]/255; ob+=v; if(i<lowEnd) lb+=v; else if(i<midEnd) mb+=v; else hb+=v; } const bass=Math.min(1,(lb/Math.max(1,lowEnd))*2); const mid=Math.min(1,(mb/Math.max(1,midEnd-lowEnd))*2); const high=Math.min(1,(hb/Math.max(1,len-midEnd))*2); const overall=Math.min(1,(ob/len)*2); return { bass, mid, high, overall }; };
    const loop = () => { rafRef.current = requestAnimationFrame(loop); if (!run) return; const w=c.clientWidth, h=c.clientHeight; ctx.clearRect(0,0,w,h); const { bass, mid, overall } = levels(); ctx.fillStyle='rgba(5,5,5,0.15)'; ctx.fillRect(0,0,w,h); const swirl=0.002+(mid||0)*0.01; const speed=0.15+(overall||0)*0.9; const alphaBoost=0.08+(bass||0)*0.5; for (let i=0;i<ps.length;i++){ const p=ps[i]; p.t+=swirl; p.vx+=Math.cos(p.t)*0.02; p.vy+=Math.sin(p.t)*0.02; p.x+=p.vx*speed; p.y+=p.vy*speed; if (p.x<-10) p.x=w+10; else if (p.x> w+10) p.x=-10; if (p.y<-10) p.y=h+10; else if (p.y> h+10) p.y=-10; const a=Math.min(0.9, p.a+alphaBoost); ctx.fillStyle=`rgba(${gold.r},${gold.g},${gold.b},${a})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.s+overall*1.5,0,Math.PI*2); ctx.fill(); } };
    if (!prefersReduced) loop();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); document.removeEventListener('visibilitychange', onVis); rafRef.current = null; };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

function StudioContent() {
  return (
    <div className="relative overflow-hidden">
      <NeonDust />
      <CrashGuard>
        <DJInterface />
      </CrashGuard>
    </div>
  );
}

export default function StudioPage() {
  return (
    <HelpProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
        <StudioContent />
      </Suspense>
    </HelpProvider>
  );
}
