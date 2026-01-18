/**
 * StepSequencer.ts - Step Sequencer Service
 *
 * Phase X: Service for managing 4x4 step sequencer logic with sample triggering
 *
 * Features:
 * - 4x4 grid pattern management
 * - Tempo-based sequencing
 * - Sample assignment and triggering
 * - Pattern save/load functionality
 */

import {
  getSamplePlayer,
  type SampleInfo,
  type PlaybackOptions,
} from "./SamplePlayer";

export interface GridStep {
  sampleId: string | null;
  active: boolean;
  velocity: number; // 0-1
  probability?: number; // 0-1, for randomization
}

export interface SequencerPattern {
  id: string;
  name: string;
  grid: GridStep[][];
  tempo: number;
  swing?: number; // 0-1, swing amount
  createdAt: Date;
}

export type SequencerState = "stopped" | "playing" | "paused";

/**
 * StepSequencer - Service for managing 4x4 step sequencer patterns
 */
class StepSequencer {
  private static instance: StepSequencer | null = null;

  private samplePlayer = getSamplePlayer();
  private patterns = new Map<string, SequencerPattern>();
  private currentPatternId: string | null = null;

  // Sequencer state
  private state: SequencerState = "stopped";
  private tempo = 120;
  private swing = 0; // 0 = no swing, 1 = maximum swing
  private currentStep = { row: 0, col: 0 };
  private grid: GridStep[][];

  // Timing
  private intervalId: NodeJS.Timeout | null = null;
  private lastStepTime = 0;

  // Callbacks
  private onStepChange?: (step: { row: number; col: number }) => void;
  private onPatternChange?: (pattern: SequencerPattern | null) => void;

  // Private constructor enforces singleton
  private constructor() {
    // Initialize empty 4x4 grid
    this.grid = Array(4)
      .fill(null)
      .map(() =>
        Array(4)
          .fill(null)
          .map(() => ({
            sampleId: null,
            active: false,
            velocity: 0.8,
            probability: 1.0,
          })),
      );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StepSequencer {
    if (!StepSequencer.instance) {
      StepSequencer.instance = new StepSequencer();
    }
    return StepSequencer.instance;
  }

  /**
   * Initialize the sequencer
   */
  async initialize(): Promise<void> {
    await this.samplePlayer.initialize();
    console.log("[StepSequencer] Initialized");
  }

  /**
   * Start the sequencer
   */
  start(): void {
    if (this.state === "playing") return;

    this.state = "playing";
    this.lastStepTime = Date.now();

    this.scheduleNextStep();
    console.log("[StepSequencer] Started");
  }

  /**
   * Stop the sequencer
   */
  stop(): void {
    if (this.state === "stopped") return;

    this.state = "stopped";
    this.currentStep = { row: 0, col: 0 };

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    this.onStepChange?.({ row: -1, col: -1 }); // Signal stopped
    console.log("[StepSequencer] Stopped");
  }

  /**
   * Pause the sequencer
   */
  pause(): void {
    if (this.state !== "playing") return;

    this.state = "paused";

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    console.log("[StepSequencer] Paused");
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(60, Math.min(200, bpm));
    console.log(`[StepSequencer] Tempo set to ${this.tempo} BPM`);
  }

  /**
   * Set swing amount (0-1)
   */
  setSwing(amount: number): void {
    this.swing = Math.max(0, Math.min(1, amount));
    console.log(
      `[StepSequencer] Swing set to ${(this.swing * 100).toFixed(1)}%`,
    );
  }

  /**
   * Set grid step
   */
  setStep(row: number, col: number, step: Partial<GridStep>): void {
    if (row < 0 || row >= 4 || col < 0 || col >= 4) return;

    this.grid[row][col] = {
      ...this.grid[row][col],
      ...step,
    };
  }

  /**
   * Get grid step
   */
  getStep(row: number, col: number): GridStep {
    if (row < 0 || row >= 4 || col < 0 || col >= 4) {
      throw new Error("Invalid grid position");
    }
    return { ...this.grid[row][col] };
  }

  /**
   * Get entire grid
   */
  getGrid(): GridStep[][] {
    return this.grid.map((row) => row.map((step) => ({ ...step })));
  }

  /**
   * Clear grid
   */
  clearGrid(): void {
    this.grid = Array(4)
      .fill(null)
      .map(() =>
        Array(4)
          .fill(null)
          .map(() => ({
            sampleId: null,
            active: false,
            velocity: 0.8,
            probability: 1.0,
          })),
      );
    console.log("[StepSequencer] Grid cleared");
  }

  /**
   * Set current pattern
   */
  setPattern(patternId: string | null): void {
    if (!patternId) {
      this.currentPatternId = null;
      this.onPatternChange?.(null);
      return;
    }

    const pattern = this.patterns.get(patternId);
    if (pattern) {
      this.currentPatternId = patternId;
      this.grid = pattern.grid.map((row) => row.map((step) => ({ ...step })));
      this.tempo = pattern.tempo;
      this.swing = pattern.swing || 0;
      this.onPatternChange?.(pattern);
      console.log(`[StepSequencer] Pattern loaded: ${pattern.name}`);
    }
  }

  /**
   * Save current grid as pattern
   */
  savePattern(name: string): string {
    const patternId = `pattern_${Date.now()}`;
    const pattern: SequencerPattern = {
      id: patternId,
      name,
      grid: this.getGrid(),
      tempo: this.tempo,
      swing: this.swing,
      createdAt: new Date(),
    };

    this.patterns.set(patternId, pattern);
    this.currentPatternId = patternId;

    console.log(`[StepSequencer] Pattern saved: ${name}`);
    return patternId;
  }

  /**
   * Get all saved patterns
   */
  getPatterns(): SequencerPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Delete pattern
   */
  deletePattern(patternId: string): boolean {
    const deleted = this.patterns.delete(patternId);
    if (deleted && this.currentPatternId === patternId) {
      this.currentPatternId = null;
      this.onPatternChange?.(null);
    }
    return deleted;
  }

  /**
   * Set callback for step changes
   */
  setOnStepChange(
    callback: (step: { row: number; col: number }) => void,
  ): void {
    this.onStepChange = callback;
  }

  /**
   * Set callback for pattern changes
   */
  setOnPatternChange(
    callback: (pattern: SequencerPattern | null) => void,
  ): void {
    this.onPatternChange = callback;
  }

  /**
   * Get current state
   */
  getState(): SequencerState {
    return this.state;
  }

  /**
   * Get current tempo
   */
  getTempo(): number {
    return this.tempo;
  }

  /**
   * Get current swing
   */
  getSwing(): number {
    return this.swing;
  }

  /**
   * Get current step
   */
  getCurrentStep(): { row: number; col: number } {
    return { ...this.currentStep };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private scheduleNextStep(): void {
    if (this.state !== "playing") return;

    // Calculate step duration with swing
    const baseDuration = (60 / this.tempo) * 1000; // milliseconds per step
    const swingOffset = this.calculateSwingOffset();
    const duration = baseDuration + swingOffset;

    this.intervalId = setTimeout(() => {
      this.advanceStep();
      this.scheduleNextStep();
    }, duration);
  }

  private calculateSwingOffset(): number {
    if (this.swing === 0) return 0;

    // Apply swing to even steps (push them later) and odd steps (pull them earlier)
    const stepIndex = this.currentStep.row * 4 + this.currentStep.col;
    const isEvenStep = stepIndex % 2 === 0;

    // Swing amount in milliseconds
    const swingAmount = (60 / this.tempo) * 1000 * this.swing * 0.5;

    return isEvenStep ? swingAmount : -swingAmount;
  }

  private advanceStep(): void {
    // Trigger samples for current step
    this.triggerStepSamples();

    // Move to next step
    this.currentStep.col = (this.currentStep.col + 1) % 4;
    if (this.currentStep.col === 0) {
      this.currentStep.row = (this.currentStep.row + 1) % 4;
    }

    // Notify listeners
    this.onStepChange?.({ ...this.currentStep });

    this.lastStepTime = Date.now();
  }

  private async triggerStepSamples(): Promise<void> {
    const { row, col } = this.currentStep;
    const step = this.grid[row][col];

    if (!step.active || !step.sampleId) return;

    // Check probability
    if (step.probability !== undefined && Math.random() > step.probability) {
      return; // Skip this trigger based on probability
    }

    try {
      // Create sample info (this would normally come from a sample registry)
      const sample: SampleInfo = {
        id: step.sampleId,
        name: step.sampleId,
        url: `/audio/samples/${step.sampleId}.mp3`, // Placeholder URL
        category: "drum", // This should be determined from the actual sample
      };

      const options: PlaybackOptions = {
        velocity: step.velocity,
        syncToBeat: true,
        deckId: "deckA", // Could be configurable
      };

      await this.samplePlayer.playSample(sample, options);
    } catch (error) {
      console.error(
        `[StepSequencer] Failed to trigger sample ${step.sampleId}:`,
        error,
      );
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.stop();
    this.patterns.clear();
    this.samplePlayer.dispose();
    console.log("[StepSequencer] Disposed");
  }
}

// Export singleton instance getter
export const getStepSequencer = () => StepSequencer.getInstance();
