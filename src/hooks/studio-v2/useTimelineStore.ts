import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * TimelineTrack - Represents a single track placed on the timeline
 *
 * Architecture note: Uses trackKey (normalized ID) per repo rules.
 * Never use full URLs as IDs - always normalize to slug format.
 */
export interface TimelineTrack {
  id: string; // Unique placement ID (UUID)
  trackKey: string; // Normalized track identifier (slug-like)
  title: string;
  artist: string;
  duration: number; // Track duration in seconds
  startTime: number; // Position on timeline (seconds from start)
  row: number; // Vertical lane (0-7)
  volume: number; // Track volume (0-1)
  fadeIn: number; // Fade in duration (seconds)
  fadeOut: number; // Fade out duration (seconds)
  bpm?: number;
  key?: string;
  color?: string; // Visual color coding
}

/**
 * TimelineProject - Saved project state
 */
export interface TimelineProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: TimelineTrack[];
  duration: number;
  bpm?: number; // Master tempo (if set)
}

interface TimelineState {
  // Tracks on timeline
  tracks: TimelineTrack[];

  // Playback state
  playhead: number; // Current time position (seconds)
  isPlaying: boolean;

  // View state
  zoom: number; // Pixels per second (10-200)
  scrollOffset: number; // Horizontal scroll position

  // Selection
  selectedTrackIds: string[];

  // Project metadata
  projectName: string;
  projectId: string | null;
  lastSaved: number | null;

  // Actions - Track Management
  addTrack: (track: Omit<TimelineTrack, 'id'>) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  moveTrack: (trackId: string, newStartTime: number, newRow: number) => void;
  duplicateTrack: (trackId: string) => void;
  clearTracks: () => void;

  // Actions - Playback
  setPlayhead: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;

  // Actions - View
  setZoom: (zoom: number) => void;
  setScrollOffset: (offset: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Actions - Selection
  selectTrack: (trackId: string) => void;
  deselectTrack: (trackId: string) => void;
  clearSelection: () => void;
  selectMultiple: (trackIds: string[]) => void;

  // Actions - Project
  setProjectName: (name: string) => void;
  saveProject: () => void;
  loadProject: (project: TimelineProject) => void;
  newProject: () => void;

  // Computed values
  getTotalDuration: () => number;
  getTrackAtPosition: (time: number, row: number) => TimelineTrack | null;
  getOverlappingTracks: (trackId: string) => TimelineTrack[];
}

/**
 * useTimelineStore - Main state management for Studio V2
 *
 * Persists to localStorage for project recovery.
 */
export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Initial state
      tracks: [],
      playhead: 0,
      isPlaying: false,
      zoom: 50, // Default: 50 pixels per second
      scrollOffset: 0,
      selectedTrackIds: [],
      projectName: 'Untitled Mix',
      projectId: null,
      lastSaved: null,

      // Track Management
      addTrack: (track) => {
        const id = `track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          tracks: [...state.tracks, { ...track, id }],
        }));
      },

      removeTrack: (trackId) => {
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
          selectedTrackIds: state.selectedTrackIds.filter((id) => id !== trackId),
        }));
      },

      updateTrack: (trackId, updates) => {
        set((state) => ({
          tracks: state.tracks.map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        }));
      },

      moveTrack: (trackId, newStartTime, newRow) => {
        set((state) => ({
          tracks: state.tracks.map((t) =>
            t.id === trackId
              ? { ...t, startTime: Math.max(0, newStartTime), row: Math.max(0, Math.min(7, newRow)) }
              : t
          ),
        }));
      },

      duplicateTrack: (trackId) => {
        const track = get().tracks.find((t) => t.id === trackId);
        if (track) {
          const newId = `track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          set((state) => ({
            tracks: [
              ...state.tracks,
              {
                ...track,
                id: newId,
                startTime: track.startTime + track.duration + 2, // Offset 2 seconds
              },
            ],
          }));
        }
      },

      clearTracks: () => {
        set({ tracks: [], selectedTrackIds: [] });
      },

      // Playback
      setPlayhead: (time) => {
        set({ playhead: Math.max(0, time) });
      },

      setIsPlaying: (playing) => {
        set({ isPlaying: playing });
      },

      play: () => {
        set({ isPlaying: true });
      },

      pause: () => {
        set({ isPlaying: false });
      },

      stop: () => {
        set({ isPlaying: false, playhead: 0 });
      },

      // View
      setZoom: (zoom) => {
        set({ zoom: Math.max(10, Math.min(200, zoom)) });
      },

      setScrollOffset: (offset) => {
        set({ scrollOffset: Math.max(0, offset) });
      },

      zoomIn: () => {
        const currentZoom = get().zoom;
        set({ zoom: Math.min(200, currentZoom * 1.25) });
      },

      zoomOut: () => {
        const currentZoom = get().zoom;
        set({ zoom: Math.max(10, currentZoom * 0.8) });
      },

      // Selection
      selectTrack: (trackId) => {
        set((state) => ({
          selectedTrackIds: state.selectedTrackIds.includes(trackId)
            ? state.selectedTrackIds
            : [...state.selectedTrackIds, trackId],
        }));
      },

      deselectTrack: (trackId) => {
        set((state) => ({
          selectedTrackIds: state.selectedTrackIds.filter((id) => id !== trackId),
        }));
      },

      clearSelection: () => {
        set({ selectedTrackIds: [] });
      },

      selectMultiple: (trackIds) => {
        set({ selectedTrackIds: trackIds });
      },

      // Project
      setProjectName: (name) => {
        set({ projectName: name });
      },

      saveProject: () => {
        set({ lastSaved: Date.now() });
        // TODO: Implement IndexedDB persistence in Phase 7
      },

      loadProject: (project) => {
        set({
          tracks: project.tracks,
          projectName: project.name,
          projectId: project.id,
          playhead: 0,
          isPlaying: false,
          selectedTrackIds: [],
          lastSaved: project.updatedAt,
        });
      },

      newProject: () => {
        set({
          tracks: [],
          playhead: 0,
          isPlaying: false,
          selectedTrackIds: [],
          projectName: 'Untitled Mix',
          projectId: null,
          lastSaved: null,
        });
      },

      // Computed
      getTotalDuration: () => {
        const tracks = get().tracks;
        if (tracks.length === 0) return 0;
        return Math.max(...tracks.map((t) => t.startTime + t.duration));
      },

      getTrackAtPosition: (time, row) => {
        const tracks = get().tracks;
        return (
          tracks.find(
            (t) =>
              t.row === row &&
              time >= t.startTime &&
              time <= t.startTime + t.duration
          ) || null
        );
      },

      getOverlappingTracks: (trackId) => {
        const tracks = get().tracks;
        const track = tracks.find((t) => t.id === trackId);
        if (!track) return [];

        return tracks.filter(
          (t) =>
            t.id !== trackId &&
            t.row === track.row &&
            !(
              t.startTime + t.duration <= track.startTime ||
              t.startTime >= track.startTime + track.duration
            )
        );
      },
    }),
    {
      name: 'studio-v2-timeline',
      partialize: (state) => ({
        // Only persist these fields
        tracks: state.tracks,
        projectName: state.projectName,
        projectId: state.projectId,
        zoom: state.zoom,
      }),
    }
  )
);
