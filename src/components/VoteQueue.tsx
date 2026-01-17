"use client";

import { useMemo } from "react";
import {
  useCollabSessionStore,
  type TrackSuggestion,
} from "@/lib/stores/collab";
import { useSupabaseCollab } from "@/lib/hooks/useSupabaseCollab";
import { ThumbsUp, ThumbsDown, Flame, XCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface VoteQueueProps {
  sessionId: string | null;
  isHost?: boolean;
  onApprove?: (track: TrackSuggestion) => void;
}

export function VoteQueue({ sessionId, isHost, onApprove }: VoteQueueProps) {
  const { trackSuggestions, votes, nickname } = useCollabSessionStore();
  const { sendVote, sendSuggestion } = useSupabaseCollab(sessionId);

  const ordered = useMemo(
    () =>
      [...trackSuggestions].sort(
        (a, b) => (votes[b.id] ?? b.votes ?? 0) - (votes[a.id] ?? a.votes ?? 0),
      ),
    [trackSuggestions, votes],
  );

  const handleVote = (id: string, delta: number) => {
    void sendVote(id, delta);
  };

  const addSuggestion = () => {
    if (!nickname) return;
    const suggestion: TrackSuggestion = {
      id: uuidv4(),
      title: "User Suggestion",
      artist: nickname,
      votes: 0,
      suggestedBy: nickname,
    };
    void sendSuggestion(suggestion);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-white/60">
          Vote Queue
        </span>
        <button
          onClick={addSuggestion}
          className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/80 hover:border-safety-yellow"
          disabled={!nickname}
        >
          Suggest
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {ordered.map((track) => {
          const score = votes[track.id] ?? track.votes ?? 0;
          const heat = score >= 5;
          const dead = score <= -3;
          const barPct = Math.max(0, Math.min(100, (score + 5) * 10));

          return (
            <div
              key={track.id}
              className="rounded-lg border border-white/10 bg-black/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {track.title}
                  </p>
                  <p className="text-xs text-white/60">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2 text-safety-yellow">
                  {heat && <Flame className="h-4 w-4" />}
                  {dead && <XCircle className="h-4 w-4 text-red-400" />}
                  <span className="text-sm font-bold">{score}</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-safety-yellow"
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleVote(track.id, 1)}
                  className="rounded-full border border-white/20 p-2 text-white hover:border-safety-yellow"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleVote(track.id, -1)}
                  className="rounded-full border border-white/20 p-2 text-white hover:border-white/50"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                {isHost && onApprove ? (
                  <button
                    onClick={() => onApprove(track)}
                    className="ml-auto rounded-full border border-safety-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-safety-yellow"
                  >
                    Add to Deck
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {ordered.length === 0 && (
          <p className="text-sm text-white/60">
            No suggestions yet. Add one to start voting.
          </p>
        )}
      </div>
    </div>
  );
}
