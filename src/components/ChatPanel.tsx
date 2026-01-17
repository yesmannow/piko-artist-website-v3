"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCollabSessionStore, type CollabMessage } from "@/lib/stores/collab";
import { useSupabaseCollab } from "@/lib/hooks/useSupabaseCollab";
import { Send } from "lucide-react";

interface ChatPanelProps {
  sessionId: string | null;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { nickname, chatLog, setNickname } = useCollabSessionStore();
  const { sendChat } = useSupabaseCollab(sessionId);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const color = useMemo(() => {
    const colors = ["#FFD700", "#00e0ff", "#ff00d4", "#9eff00"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleSend = async () => {
    if (!input.trim() || !nickname) return;
    const text = input.trim();
    setInput("");

    const payload: Omit<CollabMessage, "id" | "timestamp"> = {
      nickname,
      text,
      type: text.startsWith("/") ? "command" : "chat",
    };
    await sendChat(payload);
  };

  const handleCommand = (text: string) => {
    const command = text.split(" ")[0];
    if (command === "/skip") return "Requesting skip";
    if (command === "/boost") return "Boosting track";
    if (command === "/request") return "Request noted";
    return text;
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-white/60">
          Chat
        </span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-white focus:border-safety-yellow focus:outline-none"
        />
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto pr-1">
        {chatLog.map((msg) => (
          <div
            key={msg.id}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color }}
              >
                {msg.nickname}
              </span>
              <span className="text-[10px] text-white/50">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-white/80">{handleCommand(msg.text)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message... /skip /boost /request"
          className="flex-1 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus:border-safety-yellow focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          className="rounded-full bg-safety-yellow p-2 text-black"
          disabled={!nickname}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
