"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  useCollabSessionStore,
  type CollabMessage,
  type TrackSuggestion,
} from "@/lib/stores/collab";
import { v4 as uuidv4 } from "uuid";

export function useSupabaseCollab(sessionId: string | null) {
  const {
    addMessage,
    upsertSuggestion,
    setTrackSuggestions,
    vote,
    setGuests,
    setSession,
  } = useCollabSessionStore();

  useEffect(() => {
    if (!sessionId || !supabase) return;
    setSession(sessionId);

    // Subscribe to realtime updates for this session
    const channel = supabase.channel(`collab_${sessionId}`);

    channel
      .on("broadcast", { event: "chat" }, (payload) => {
        const msg = payload.payload as CollabMessage;
        if (msg?.id) addMessage(msg);
      })
      .on("broadcast", { event: "vote" }, (payload) => {
        const { trackId, delta } = payload.payload as {
          trackId: string;
          delta: number;
        };
        if (trackId) vote(trackId, delta);
      })
      .on("broadcast", { event: "suggest" }, (payload) => {
        const suggestion = payload.payload as TrackSuggestion;
        if (suggestion?.id) upsertSuggestion(suggestion);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Presence to track guests
          await channel.track({ nickname: uuidv4() });
        }
      });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, { nickname?: string }[]>;
      const nicknames = Object.values(state).flatMap((entries) =>
        entries.map((e) => e.nickname).filter(Boolean),
      ) as string[];
      setGuests(nicknames);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, addMessage, upsertSuggestion, vote, setGuests, setSession]);

  return {
    sendChat: async (msg: Omit<CollabMessage, "id" | "timestamp">) => {
      if (!supabase || !sessionId) return;
      const payload: CollabMessage = {
        id: uuidv4(),
        timestamp: Date.now(),
        ...msg,
      };
      await supabase.channel(`collab_${sessionId}`).send({
        type: "broadcast",
        event: "chat",
        payload,
      });
      addMessage(payload);
    },
    sendVote: async (trackId: string, delta: number) => {
      if (!supabase || !sessionId) return;
      await supabase.channel(`collab_${sessionId}`).send({
        type: "broadcast",
        event: "vote",
        payload: { trackId, delta },
      });
      vote(trackId, delta);
    },
    sendSuggestion: async (suggestion: TrackSuggestion) => {
      if (!supabase || !sessionId) return;
      await supabase.channel(`collab_${sessionId}`).send({
        type: "broadcast",
        event: "suggest",
        payload: suggestion,
      });
      upsertSuggestion(suggestion);
    },
    setTrackSuggestions,
  };
}
