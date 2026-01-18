/**
 * TrackHistory.ts - Session track history tracking
 *
 * Phase X: Service for tracking track playback history during recording sessions
 *
 * Features:
 * - Real-time track change detection
 * - Timestamp recording
 * - Automatic tracklist generation
 * - Session-based organization
 */

import { type MediaItem } from "@/lib/data";

export interface TrackHistoryEntry {
  trackId: string;
  title: string;
  artist: string;
  startedAt: number; // timestamp when track started
  endedAt?: number; // timestamp when track ended (if known)
  duration?: number; // track duration in seconds
  bpm?: number;
  camelot?: string;
}

export interface SessionHistory {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  tracks: TrackHistoryEntry[];
  totalDuration: number; // seconds
}

/**
 * TrackHistory - Service for tracking playback history during sessions
 */
class TrackHistory {
  private static instance: TrackHistory | null = null;

  private currentSession: SessionHistory | null = null;
  private currentTrack: TrackHistoryEntry | null = null;
  private sessions = new Map<string, SessionHistory>();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TrackHistory {
    if (!TrackHistory.instance) {
      TrackHistory.instance = new TrackHistory();
    }
    return TrackHistory.instance;
  }

  /**
   * Start a new recording session
   */
  startSession(): string {
    // End any current session
    if (this.currentSession) {
      this.endSession();
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      id: sessionId,
      startedAt: new Date(),
      tracks: [],
      totalDuration: 0,
    };

    console.log(`[TrackHistory] Started session: ${sessionId}`);
    return sessionId;
  }

  /**
   * End the current recording session
   */
  endSession(): SessionHistory | null {
    if (!this.currentSession) return null;

    this.currentSession.endedAt = new Date();

    // End current track if still playing
    if (this.currentTrack) {
      this.currentTrack.endedAt = Date.now();
      this.currentSession.tracks.push({ ...this.currentTrack });
      this.currentTrack = null;
    }

    // Calculate total duration
    this.currentSession.totalDuration = this.calculateSessionDuration();

    // Store session
    this.sessions.set(this.currentSession.id, this.currentSession);

    const session = { ...this.currentSession };
    this.currentSession = null;

    console.log(
      `[TrackHistory] Ended session: ${session.id} (${session.tracks.length} tracks)`,
    );
    return session;
  }

  /**
   * Track when a new track starts playing
   */
  trackStarted(track: MediaItem): void {
    if (!this.currentSession) return;

    // End previous track if exists
    if (this.currentTrack) {
      this.currentTrack.endedAt = Date.now();
      this.currentSession.tracks.push({ ...this.currentTrack });
    }

    // Start new track
    this.currentTrack = {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      startedAt: Date.now(),
      duration: track.duration ?? undefined,
      bpm: track.bpm ?? undefined,
      camelot: track.camelot ?? undefined,
    };

    console.log(`[TrackHistory] Started tracking: ${track.title}`);
  }

  /**
   * Track when current track stops/pauses
   */
  trackStopped(): void {
    if (!this.currentTrack || !this.currentSession) return;

    this.currentTrack.endedAt = Date.now();
    this.currentSession.tracks.push({ ...this.currentTrack });
    this.currentTrack = null;

    console.log("[TrackHistory] Track stopped");
  }

  /**
   * Get current session tracklist
   */
  getCurrentTracklist(): TrackHistoryEntry[] {
    if (!this.currentSession) return [];

    const tracks = [...this.currentSession.tracks];

    // Include current track if still playing
    if (this.currentTrack) {
      tracks.push({ ...this.currentTrack });
    }

    return tracks;
  }

  /**
   * Get completed session by ID
   */
  getSession(sessionId: string): SessionHistory | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all completed sessions
   */
  getAllSessions(): SessionHistory[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionHistory | null {
    return this.currentSession;
  }

  /**
   * Generate tracklist for export (with relative timestamps)
   */
  generateTracklist(sessionId?: string): {
    title: string;
    artist: string;
    startTime: number; // seconds from session start
    duration?: number;
    bpm?: number;
    camelot?: string;
  }[] {
    const session = sessionId
      ? this.getSession(sessionId)
      : this.currentSession;
    if (!session) return [];

    const sessionStartTime = session.startedAt.getTime();

    return session.tracks.map((track) => ({
      title: track.title,
      artist: track.artist,
      startTime: Math.round((track.startedAt - sessionStartTime) / 1000),
      duration: track.duration,
      bpm: track.bpm,
      camelot: track.camelot,
    }));
  }

  /**
   * Export tracklist as text
   */
  exportTracklistAsText(sessionId?: string): string {
    const tracklist = this.generateTracklist(sessionId);
    if (tracklist.length === 0) return "No tracks recorded";

    const lines = tracklist.map((track, index) => {
      const timeStr = formatTime(track.startTime);
      const durationStr = track.duration
        ? ` (${formatTime(track.duration)})`
        : "";
      const bpmStr = track.bpm ? ` @ ${track.bpm} BPM` : "";
      const keyStr = track.camelot ? ` in ${track.camelot}` : "";

      return `${index + 1}. ${timeStr} - ${track.artist} - ${track.title}${durationStr}${bpmStr}${keyStr}`;
    });

    return lines.join("\n");
  }

  /**
   * Clear all session history
   */
  clearHistory(): void {
    this.sessions.clear();
    if (this.currentSession) {
      this.currentSession.tracks = [];
    }
    console.log("[TrackHistory] History cleared");
  }

  /**
   * Delete a specific session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private calculateSessionDuration(): number {
    if (!this.currentSession) return 0;

    const tracks = this.currentSession.tracks;
    if (tracks.length === 0) return 0;

    // Calculate from first track start to last track end
    const firstTrack = tracks[0];
    const lastTrack = tracks[tracks.length - 1];

    if (!lastTrack.endedAt) return 0;

    return Math.round((lastTrack.endedAt - firstTrack.startedAt) / 1000);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    if (this.currentSession) {
      this.endSession();
    }
    this.sessions.clear();
    console.log("[TrackHistory] Disposed");
  }
}

// Helper function to format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Export singleton instance getter
export const getTrackHistory = () => TrackHistory.getInstance();
