"use client";

import { useState } from "react";

interface Entry {
  id: string;
  message: string;
}

/**
 * Minimal guestbook scaffold for quick embeds.
 * Stores entries locally for the current session.
 */
export default function GuestbookWidget() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newEntry, setNewEntry] = useState("");

  const addEntry = () => {
    const trimmed = newEntry.trim();
    if (!trimmed) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), message: trimmed },
      ...prev,
    ]);
    setNewEntry("");
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold text-white">Guestbook</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#c1ff00] focus:outline-none"
          placeholder="Drop a message..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addEntry();
          }}
        />
        <button
          type="button"
          onClick={addEntry}
          className="rounded bg-[#c1ff00] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-black"
        >
          Sign
        </button>
      </div>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-white/60">No signatures yet.</p>
        ) : (
          entries.map((entry) => (
            <p key={entry.id} className="text-sm text-white/80">
              “{entry.message}”
            </p>
          ))
        )}
      </div>
    </div>
  );
}
