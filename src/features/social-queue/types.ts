/**
 * Social Queue Type Definitions
 */

export interface QueueTrack {
  id: string;
  track_metadata: {
    title: string;
    artist: string;
    url: string;
    duration?: number;
    bpm?: number;
  };
  votes: number;
  status: 'queued' | 'playing' | 'history';
  created_at: string;
  score: number;
}

export interface Vote {
  id: string;
  queue_id: string;
  user_id: string;
  created_at: string;
}
