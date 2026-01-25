/**
 * StemDeck.ts - Dual-Player Stem Management for Phase VI
 * 
 * This class implements the "Fake Stems" architecture, managing two synchronized
 * Tone.Player instances (Vocals and Instrumental) for each deck.
 * 
 * Key Features:
 * - Phase-locked playback using Tone.Transport
 * - Independent stem muting/unmuting
 * - Parallel loading of stem files
 * - Sample-accurate synchronization
 */

import * as Tone from 'tone';

export interface StemUrls {
  vocals: string;
  inst: string;
}

export class StemDeck {
  private vocalsPlayer: Tone.Player;
  private instPlayer: Tone.Player;
  private channel: Tone.Channel;
  private deckId: string;
  
  /**
   * Create a new StemDeck
   * 
   * @param deckId - Identifier for this deck ('A' or 'B')
   * @param destination - Audio node to connect to (typically crossfader input)
   */
  constructor(deckId: string, destination: Tone.ToneAudioNode) {
    this.deckId = deckId;
    
    // Create channel strip for this deck
    this.channel = new Tone.Channel({
      volume: 0,
      pan: 0,
    });
    
    // Create player for vocals stem
    this.vocalsPlayer = new Tone.Player({
      onload: () => {
        console.log(`[StemDeck ${deckId}] Vocals loaded`);
      },
      onerror: (error) => {
        console.error(`[StemDeck ${deckId}] Vocals load error:`, error);
      }
    });
    this.vocalsPlayer.sync().start(0); // Sync to Transport, start at time 0
    
    // Create player for instrumental stem
    this.instPlayer = new Tone.Player({
      onload: () => {
        console.log(`[StemDeck ${deckId}] Instrumental loaded`);
      },
      onerror: (error) => {
        console.error(`[StemDeck ${deckId}] Instrumental load error:`, error);
      }
    });
    this.instPlayer.sync().start(0); // Sync to Transport, start at time 0
    
    // Connect both players to the channel (they mix together)
    this.vocalsPlayer.connect(this.channel);
    this.instPlayer.connect(this.channel);
    
    // Connect channel to destination
    this.channel.connect(destination);
    
    console.log(`[StemDeck ${deckId}] Initialized`);
  }
  
  /**
   * Load stem files in parallel
   * 
   * @param urls - URLs for vocals and instrumental stems
   * @returns Promise that resolves when both stems are loaded
   */
  async load(urls: StemUrls): Promise<void> {
    console.log(`[StemDeck ${this.deckId}] Loading stems:`, urls);
    
    // Load both stems in parallel for faster loading
    await Promise.all([
      this.vocalsPlayer.load(urls.vocals),
      this.instPlayer.load(urls.inst),
    ]);
    
    console.log(`[StemDeck ${this.deckId}] All stems loaded`);
  }
  
  /**
   * Start playback
   * Note: This only affects this deck's players. Transport management is 
   * handled by the parent audio engine to avoid global state conflicts.
   */
  play(): void {
    if (!this.vocalsPlayer.loaded || !this.instPlayer.loaded) {
      console.warn(`[StemDeck ${this.deckId}] Cannot play - stems not loaded`);
      return;
    }
    
    // Players are already synced to Transport via .sync()
    // They will start playing when Transport is started by the audio engine
    console.log(`[StemDeck ${this.deckId}] Ready to play (waiting for Transport)`);
  }
  
  /**
   * Pause playback by muting both players
   * This doesn't affect the Transport or other decks
   */
  pause(): void {
    this.vocalsPlayer.volume.value = -Infinity;
    this.instPlayer.volume.value = -Infinity;
    console.log(`[StemDeck ${this.deckId}] Paused (muted)`);
  }
  
  /**
   * Stop and reset playback position
   * This uses Transport position to reset without affecting other decks
   */
  stop(): void {
    // Mute the players
    this.vocalsPlayer.volume.value = -Infinity;
    this.instPlayer.volume.value = -Infinity;
    
    // Note: Seeking to position 0 is handled by the parent audio engine
    // through Transport.seconds = 0, but only for the specific deck
    console.log(`[StemDeck ${this.deckId}] Stopped`);
  }
  
  /**
   * Unmute players for playback
   * Called by the audio engine when play is triggered
   */
  unmute(): void {
    // Restore volume to 0dB (unity gain) unless a stem is toggled off
    const vocalsVolume = this.vocalsPlayer.volume.value;
    const instVolume = this.instPlayer.volume.value;
    
    if (vocalsVolume === -Infinity) {
      this.vocalsPlayer.volume.value = 0;
    }
    if (instVolume === -Infinity) {
      this.instPlayer.volume.value = 0;
    }
  }
  
  /**
   * Toggle a specific stem on/off
   * 
   * @param stem - Which stem to toggle ('vocals' or 'inst')
   * @param enabled - Whether the stem should be enabled
   */
  toggleStem(stem: 'vocals' | 'inst', enabled: boolean): void {
    const player = stem === 'vocals' ? this.vocalsPlayer : this.instPlayer;
    
    // Mute by setting volume to -Infinity dB (complete silence)
    // This is better than disconnecting because it maintains sync
    player.volume.value = enabled ? 0 : -Infinity;
    
    console.log(`[StemDeck ${this.deckId}] ${stem} ${enabled ? 'enabled' : 'muted'}`);
  }
  
  /**
   * Set playback rate for both players (for BPM sync)
   * 
   * @param rate - Playback rate (1.0 = normal speed)
   */
  setPlaybackRate(rate: number): void {
    this.vocalsPlayer.playbackRate = rate;
    this.instPlayer.playbackRate = rate;
  }
  
  /**
   * Get the current playback position
   * 
   * @returns Current position in seconds
   */
  getPosition(): number {
    return this.vocalsPlayer.toSeconds(Tone.Transport.position);
  }
  
  /**
   * Seek to a specific position
   * 
   * @param seconds - Position to seek to in seconds
   */
  seek(seconds: number): void {
    Tone.Transport.seconds = seconds;
  }
  
  /**
   * Get the channel for further audio routing (EQ, effects, etc.)
   */
  getChannel(): Tone.Channel {
    return this.channel;
  }
  
  /**
   * Check if both stems are loaded
   */
  isLoaded(): boolean {
    return this.vocalsPlayer.loaded && this.instPlayer.loaded;
  }
  
  /**
   * Dispose of all audio nodes
   */
  dispose(): void {
    this.vocalsPlayer.dispose();
    this.instPlayer.dispose();
    this.channel.dispose();
    console.log(`[StemDeck ${this.deckId}] Disposed`);
  }
}
