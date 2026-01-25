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
   * Start playback using Transport for phase-locked synchronization
   * Both players are already synced to Transport via .sync()
   */
  play(): void {
    if (!this.vocalsPlayer.loaded || !this.instPlayer.loaded) {
      console.warn(`[StemDeck ${this.deckId}] Cannot play - stems not loaded`);
      return;
    }
    
    // Start the Transport if not already running
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
    
    console.log(`[StemDeck ${this.deckId}] Playing`);
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    // Pause the Transport (affects all synced players)
    Tone.Transport.pause();
    console.log(`[StemDeck ${this.deckId}] Paused`);
  }
  
  /**
   * Stop and reset playback
   */
  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    console.log(`[StemDeck ${this.deckId}] Stopped`);
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
