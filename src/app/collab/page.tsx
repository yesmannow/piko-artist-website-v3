"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCollabSessionStore } from "@/lib/stores/collab";
import { ChatPanel } from "@/components/ChatPanel";
import { VoteQueue } from "@/components/VoteQueue";
import { useSupabaseCollab } from "@/lib/hooks/useSupabaseCollab";
import { v4 as uuidv4 } from "uuid";

export default function CollabPage() {
  const searchParams = useSearchParams();
  const isHost = searchParams?.get("host") === "true";
  const sessionId = searchParams?.get("session") || uuidv4();
  const {
    nickname,
    setNickname,
    sessionId: storedSession,
    setSession,
  } = useCollabSessionStore();
  useSupabaseCollab(sessionId);

  useEffect(() => {
    if (!storedSession) setSession(sessionId);
    if (!nickname) setNickname(`Guest-${Math.floor(Math.random() * 9999)}`);
  }, [storedSession, sessionId, setSession, nickname, setNickname]);

  const HostPanel = useMemo(
    () => (
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/70">
            DJ Interface placeholder (load decks/mixer)
          </p>
        </div>
        <div className="grid gap-3">
          <VoteQueue sessionId={sessionId} isHost />
          <ChatPanel sessionId={sessionId} />
        </div>
      </div>
    ),
    [sessionId],
  );

  const GuestPanel = useMemo(
    () => (
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            Now Playing
          </p>
          <p className="text-lg font-semibold text-white">Host set</p>
        </div>
        <div className="grid gap-3">
          <VoteQueue sessionId={sessionId} />
          <ChatPanel sessionId={sessionId} />
        </div>
      </div>
    ),
    [sessionId],
  );

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            Collab Session
          </p>
          <h1 className="text-2xl font-bold">
            {isHost ? "Host View" : "Guest View"}
          </h1>
        </div>
        <div className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
          Session: {sessionId}
        </div>
      </div>
      {isHost ? HostPanel : GuestPanel}
    </div>
  );
}
