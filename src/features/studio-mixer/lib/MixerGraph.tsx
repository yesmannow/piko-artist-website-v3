"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { MasterBus } from "@/features/audio-engine/lib/MasterBus";
import { createChannelStrip } from "@/features/audio-engine/hooks/useChannelStrip";
import type { ChannelStripNodes } from "@/features/audio-engine/hooks/useChannelStrip";
import { createChorus, createFlanger, createPhaser } from "@/utils/fxUtils";
import { createImpulseResponse } from "./createImpulseResponse";
import { MixerGraphProvider } from "./MixerGraphContext";
import { useMixerStore } from "../stores/useMixerStore";

type DeckId = "A" | "B";

type BypassStage = {
  in: GainNode;
  out: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  dispose?: () => void;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function mapCutoffHz(v01: number) {
  // 40Hz .. 18kHz (log curve)
  const min = 40;
  const max = 18000;
  const t = clamp01(v01);
  return min * Math.pow(max / min, t);
}

function createDistortionCurve(amount01: number) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const a = clamp01(amount01);
  const k = 2 * a / (1 - a + 1e-4);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function createBypassStage(audioContext: AudioContext, effectIn: AudioNode, effectOut: AudioNode): BypassStage {
  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const dry = audioContext.createGain();
  const wet = audioContext.createGain();

  dry.gain.value = 1;
  wet.gain.value = 0;

  input.connect(dry);
  dry.connect(output);

  input.connect(effectIn);
  effectOut.connect(wet);
  wet.connect(output);

  return { in: input, out: output, dryGain: dry, wetGain: wet };
}

function setStageMix(stage: BypassStage, mix01: number) {
  const m = clamp01(mix01);
  stage.wetGain.gain.value = m;
  stage.dryGain.gain.value = 1 - m;
}

type DeckGraph = {
  channel: ChannelStripNodes;
  // Inserts
  filter: BiquadFilterNode;
  grit: WaveShaperNode;
  // Stages
  gritStage: BypassStage;
  chorusStage: BypassStage;
  flangerStage: BypassStage;
  phaserStage: BypassStage;
  delayStage: BypassStage;
  reverbStage: BypassStage;
  // Output controls
  deckGain: GainNode;
  crossGain: GainNode;
  // LFO disposables
  stopOscillators: (() => void)[];
};

function createDelayStage(audioContext: AudioContext) {
  const delay = audioContext.createDelay(2.0);
  const feedback = audioContext.createGain();
  delay.delayTime.value = 0.25;
  feedback.gain.value = 0.0;
  delay.connect(feedback);
  feedback.connect(delay);

  const out = audioContext.createGain();
  delay.connect(out);

  const stage = createBypassStage(audioContext, delay, out);
  return { stage, delay, feedback };
}

function connectChain(from: AudioNode, to: AudioNode) {
  from.connect(to);
}

export function MixerGraph({ children }: { children: React.ReactNode }) {
  const manager = useMemo(() => AudioContextManager.getInstance(), []);
  const audioContext = manager.getContext();

  const masterBus = useMemo(() => MasterBus.getInstance(), []);

  const graphRef = useRef<{
    masterAnalyser: AnalyserNode;
    deck: Record<DeckId, DeckGraph>;
    dispose: () => void;
  } | null>(null);

  // Build graph once
  useEffect(() => {
    if (!audioContext) return;
    if (graphRef.current) return;

    const masterAnalyser = audioContext.createAnalyser();
    masterAnalyser.fftSize = 2048;
    masterAnalyser.smoothingTimeConstant = 0.85;
    masterBus.connectTap(masterAnalyser);

    const buildDeck = (): DeckGraph => {
      const channel = createChannelStrip(audioContext);

      // Insert: filter
      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 18000;
      filter.Q.value = 0.8;

      // Insert: grit
      const grit = audioContext.createWaveShaper();
      grit.curve = createDistortionCurve(0);
      grit.oversample = "2x";

      // Mod FX stages (bypass stages)
      const chorus = createChorus(audioContext, 1.5, 0.0, 0.02, 0.0);
      const chorusStage = createBypassStage(audioContext, chorus.delayNode, chorus.gainNode);

      const flanger = createFlanger(audioContext, 0.5, 0.0, 0.003, 0.0);
      const flangerStage = createBypassStage(audioContext, flanger.delayNode, flanger.gainNode);

      const phaser = createPhaser(audioContext, 0.5, 0.0, 4);
      // Connect phaser filters in series
      for (let i = 0; i < phaser.filters.length - 1; i++) {
        phaser.filters[i]!.connect(phaser.filters[i + 1]!);
      }
      const phaserIn = phaser.filters[0]!;
      const phaserOut = phaser.filters[phaser.filters.length - 1]!;
      const phaserStage = createBypassStage(audioContext, phaserIn, phaserOut);

      // Delay stage
      const delay = createDelayStage(audioContext);

      // Reverb stage
      const convolver = audioContext.createConvolver();
      convolver.buffer = createImpulseResponse(audioContext, 1.2, 3.2);
      const convolverOut = audioContext.createGain();
      convolver.connect(convolverOut);
      const reverbStage = createBypassStage(audioContext, convolver, convolverOut);

      // Grit stage as bypass mix (dry vs shaper)
      const gritStage = createBypassStage(audioContext, grit, grit);

      // Output controls
      const deckGain = audioContext.createGain();
      deckGain.gain.value = 0.9;
      const crossGain = audioContext.createGain();
      crossGain.gain.value = 1;

      // Connect channel strip output into chain
      // channel: trim -> low -> mid -> high -> panner
      connectChain(channel.panner, filter);
      connectChain(filter, gritStage.in);
      connectChain(gritStage.out, chorusStage.in);
      connectChain(chorusStage.out, flangerStage.in);
      connectChain(flangerStage.out, phaserStage.in);
      connectChain(phaserStage.out, delay.stage.in);
      connectChain(delay.stage.out, reverbStage.in);
      connectChain(reverbStage.out, deckGain);
      connectChain(deckGain, crossGain);

      // crossGain -> MasterBus input (summing node)
      const masterInput = masterBus.getInput();
      if (masterInput) crossGain.connect(masterInput);

      const stopOscillators: Array<() => void> = [
        () => {
          try { chorus.oscillator.stop(); } catch {}
          try { flanger.oscillator.stop(); } catch {}
          try { phaser.oscillator.stop(); } catch {}
        },
      ];

      return {
        channel,
        filter,
        grit,
        gritStage,
        chorusStage,
        flangerStage,
        phaserStage,
        delayStage: delay.stage,
        reverbStage,
        deckGain,
        crossGain,
        stopOscillators,
      };
    };

    const deckA = buildDeck();
    const deckB = buildDeck();

    const dispose = () => {
      masterBus.disconnectTap(masterAnalyser);

      const cleanupDeck = (d: DeckGraph) => {
        d.stopOscillators.forEach((fn) => fn());
        try { d.crossGain.disconnect(); } catch {}
        try { d.deckGain.disconnect(); } catch {}

        // Disconnect chain nodes
        try { d.reverbStage.out.disconnect(); } catch {}
        try { d.reverbStage.in.disconnect(); } catch {}
        try { d.delayStage.out.disconnect(); } catch {}
        try { d.delayStage.in.disconnect(); } catch {}
        try { d.phaserStage.out.disconnect(); } catch {}
        try { d.phaserStage.in.disconnect(); } catch {}
        try { d.flangerStage.out.disconnect(); } catch {}
        try { d.flangerStage.in.disconnect(); } catch {}
        try { d.chorusStage.out.disconnect(); } catch {}
        try { d.chorusStage.in.disconnect(); } catch {}
        try { d.gritStage.out.disconnect(); } catch {}
        try { d.gritStage.in.disconnect(); } catch {}
        try { d.filter.disconnect(); } catch {}

        // Disconnect channel strip nodes
        try { d.channel.pflAnalyser.disconnect(); } catch {}
        try { d.channel.postFaderAnalyser.disconnect(); } catch {}
        try { d.channel.panner.disconnect(); } catch {}
        try { d.channel.highFilter.disconnect(); } catch {}
        try { d.channel.midFilter.disconnect(); } catch {}
        try { d.channel.lowFilter.disconnect(); } catch {}
        try { d.channel.trimGain.disconnect(); } catch {}
      };

      cleanupDeck(deckA);
      cleanupDeck(deckB);
    };

    graphRef.current = { masterAnalyser, deck: { A: deckA, B: deckB }, dispose };
    setGraphReady(true);

    return () => {
      graphRef.current?.dispose();
      graphRef.current = null;
      setGraphReady(false);
    };
  }, [audioContext, masterBus]);

  // Apply store → graph params
  useEffect(() => {
    if (!audioContext) return;
    const unsub = useMixerStore.subscribe((state) => {
      const g = graphRef.current;
      if (!g) return;

      // Deck volume
      g.deck.A.deckGain.gain.value = clamp01(state.deckVolume.A);
      g.deck.B.deckGain.gain.value = clamp01(state.deckVolume.B);

      // EQ mapping: -1..1 -> -12..+12 dB
      const mapEqDb = (v: number) => Math.max(-12, Math.min(12, v * 12));
      g.deck.A.channel.highFilter.gain.value = mapEqDb(state.eq.A.high);
      g.deck.A.channel.midFilter.gain.value = mapEqDb(state.eq.A.mid);
      g.deck.A.channel.lowFilter.gain.value = mapEqDb(state.eq.A.low);

      g.deck.B.channel.highFilter.gain.value = mapEqDb(state.eq.B.high);
      g.deck.B.channel.midFilter.gain.value = mapEqDb(state.eq.B.mid);
      g.deck.B.channel.lowFilter.gain.value = mapEqDb(state.eq.B.low);

      // Crossfader gains (simple equal-power-ish curves)
      const x = Math.max(-1, Math.min(1, state.crossfader));
      const t = (x + 1) / 2; // 0..1 (0=A, 1=B)
      const curve = state.crossfaderCurve;

      const applyCurve = (v: number) => {
        const vv = Math.max(0, Math.min(1, v));
        if (curve === "linear") return vv;
        if (curve === "sharp") return Math.pow(vv, 2.4);
        // smooth
        return 0.5 - 0.5 * Math.cos(Math.PI * vv);
      };

      const gainA = applyCurve(1 - t);
      const gainB = applyCurve(t);
      g.deck.A.crossGain.gain.value = gainA;
      g.deck.B.crossGain.gain.value = gainB;

      // FX target: apply FX params to target deck; bypass on the other deck (MVP)
      const target = state.fxTarget;
      const applyFxTo = (deckId: DeckId, enabled: boolean) => {
        const d = g.deck[deckId];

        // Filter
        d.filter.type = state.fx.filterType === "hpf" ? "highpass" : state.fx.filterType === "bpf" ? "bandpass" : "lowpass";
        d.filter.frequency.value = mapCutoffHz(enabled ? state.fx.filterCutoff01 : 1);

        // Grit (mix stage)
        d.grit.curve = createDistortionCurve(enabled ? state.fx.grit01 : 0);
        setStageMix(d.gritStage, enabled ? state.fx.grit01 : 0);

        // Chorus/Flanger/Phaser (use depth as mix)
        setStageMix(d.chorusStage, enabled ? state.fx.chorusDepth01 : 0);
        setStageMix(d.flangerStage, enabled ? state.fx.flangerDepth01 : 0);
        setStageMix(d.phaserStage, enabled ? state.fx.phaserDepth01 : 0);

        // Delay (use feedback as mix for now)
        setStageMix(d.delayStage, enabled ? state.fx.delayFeedback01 : 0);

        // Reverb
        setStageMix(d.reverbStage, enabled ? state.fx.reverbWet01 : 0);
      };

      applyFxTo("A", target === "A");
      applyFxTo("B", target === "B");
    });

    return () => unsub();
  }, [audioContext]);

  // Always provide the context, but children should handle loading state
  // Use state to trigger re-render when graph is ready
  const [graphReady, setGraphReady] = useState(false);

  const graphValue = useMemo(() => {
    if (!audioContext || !graphRef.current) {
      // Return null to indicate loading - children should check for this
      return null;
    }
    return {
      audioContext,
      masterAnalyser: graphRef.current.masterAnalyser,
      deck: {
        A: { channel: graphRef.current.deck.A.channel },
        B: { channel: graphRef.current.deck.B.channel },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioContext]);

  // Always render the provider, even if graph isn't ready yet
  return (
    <MixerGraphProvider value={graphValue}>
      {children}
    </MixerGraphProvider>
  );
}

