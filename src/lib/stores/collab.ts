import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CollabMessage {
  id: string;
  nickname: string;
  text: string;
  timestamp: number;
  type?: "chat" | "command";
}

export interface TrackSuggestion {
  id: string;
  title: string;
  artist: string;
  votes: number;
  suggestedBy?: string;
}

export interface CollabState {
  sessionId: string;
  nickname: string;
  chatLog: CollabMessage[];
  votes: Record<string, number>;
  trackSuggestions: TrackSuggestion[];
  currentTrack: string | null;
  guests: string[];
  setSession: (id: string) => void;
  setNickname: (name: string) => void;
  addMessage: (msg: CollabMessage) => void;
  upsertSuggestion: (suggestion: TrackSuggestion) => void;
  vote: (trackId: string, delta: number) => void;
  setGuests: (guests: string[]) => void;
  setCurrentTrack: (trackId: string | null) => void;
  setTrackSuggestions: (tracks: TrackSuggestion[]) => void;
}

export const useCollabSessionStore = create<CollabState>()(
  persist(
    (set, get) => ({
      sessionId: "",
      nickname: "",
      chatLog: [],
      votes: {},
      trackSuggestions: [],
      currentTrack: null,
      guests: [],
      setSession: (id) => set({ sessionId: id }),
      setNickname: (name) => set({ nickname: name }),
      addMessage: (msg) => set({ chatLog: [...get().chatLog, msg] }),
      upsertSuggestion: (suggestion) =>
        set((state) => {
          const existing = state.trackSuggestions.find(
            (t) => t.id === suggestion.id,
          );
          if (existing) {
            return {
              trackSuggestions: state.trackSuggestions.map((t) =>
                t.id === suggestion.id ? { ...t, ...suggestion } : t,
              ),
            };
          }
          return { trackSuggestions: [...state.trackSuggestions, suggestion] };
        }),
      vote: (trackId, delta) =>
        set((state) => ({
          votes: {
            ...state.votes,
            [trackId]: (state.votes[trackId] ?? 0) + delta,
          },
        })),
      setGuests: (guests) => set({ guests }),
      setCurrentTrack: (trackId) => set({ currentTrack: trackId }),
      setTrackSuggestions: (tracks) => set({ trackSuggestions: tracks }),
    }),
    {
      name: "collab-session",
      partialize: (state) => ({
        sessionId: state.sessionId,
        nickname: state.nickname,
      }),
    },
  ),
);
