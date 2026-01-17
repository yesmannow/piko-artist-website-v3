"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  User,
  MapPin,
  Clock,
  Trash2,
  Heart,
} from "lucide-react";

interface GuestbookEntry {
  id: string;
  name: string;
  location: string;
  message: string;
  timestamp: number;
  likes: number;
  vibe: "fire" | "chill" | "hype" | "real";
}

const vibeEmojis = {
  fire: "🔥",
  chill: "😎",
  hype: "⚡",
  real: "💯",
};

const vibeColors = {
  fire: "from-orange-500 to-red-500",
  chill: "from-blue-500 to-cyan-500",
  hype: "from-yellow-500 to-amber-500",
  real: "from-purple-500 to-pink-500",
};

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [selectedVibe, setSelectedVibe] =
    useState<GuestbookEntry["vibe"]>("fire");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | GuestbookEntry["vibe"]>("all");

  // Load entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("piko-guestbook");
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load guestbook entries", e);
      }
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (newEntries: GuestbookEntry[]) => {
    localStorage.setItem("piko-guestbook", JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const newEntry: GuestbookEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      location: location.trim() || "Unknown",
      message: message.trim(),
      timestamp: Date.now(),
      likes: 0,
      vibe: selectedVibe,
    };

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newEntries = [newEntry, ...entries];
    saveEntries(newEntries);

    // Reset form
    setName("");
    setLocation("");
    setMessage("");
    setSelectedVibe("fire");
    setIsSubmitting(false);
  };

  const handleLike = (id: string) => {
    const newEntries = entries.map((entry) =>
      entry.id === id ? { ...entry, likes: entry.likes + 1 } : entry,
    );
    saveEntries(newEntries);
  };

  const handleDelete = (id: string) => {
    const newEntries = entries.filter((entry) => entry.id !== id);
    saveEntries(newEntries);
  };

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.vibe === filter);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 md:px-8 border-b-4 border-[#FFD700]">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-mono text-xs uppercase tracking-wider mb-6 border-2 border-black"
            style={{ boxShadow: "4px 4px 0px #000" }}
          >
            <MessageSquare className="w-4 h-4" />
            Community Wall
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black italic uppercase text-white mb-4"
            style={{
              fontFamily: "var(--font-lexend), system-ui, sans-serif",
              transform: "skewX(-12deg)",
              textShadow: "4px 4px 0px rgba(0,0,0,0.5)",
            }}
          >
            DROP YOUR
            <br />
            <span className="text-[#FFD700]">SIGNATURE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#E0E0E0]/70 max-w-2xl mx-auto"
          >
            Leave your mark. Share your vibe. Connect with the community. This
            is where the real ones speak.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm font-mono text-[#FFD700]/80"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block w-2 h-2 bg-[#FFD700] rounded-full"
            />
            {entries.length} SIGNATURES • LIVE WALL
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sign Form - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24">
              <div className="bg-[#1a1a1a] border-2 border-[#FFD700]/30 p-6">
                <h2 className="text-2xl font-black italic uppercase text-[#FFD700] mb-6 tracking-wider">
                  Sign the Wall
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-mono text-[#E0E0E0]/60 uppercase tracking-wider mb-2">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/50" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        maxLength={50}
                        className="w-full bg-black/60 border-2 border-[#E0E0E0]/20 focus:border-[#FFD700] pl-10 pr-4 py-3 text-[#E0E0E0] placeholder:text-[#E0E0E0]/30 transition-colors outline-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs font-mono text-[#E0E0E0]/60 uppercase tracking-wider mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/50" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        maxLength={50}
                        className="w-full bg-black/60 border-2 border-[#E0E0E0]/20 focus:border-[#FFD700] pl-10 pr-4 py-3 text-[#E0E0E0] placeholder:text-[#E0E0E0]/30 transition-colors outline-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Vibe Selector */}
                  <div>
                    <label className="block text-xs font-mono text-[#E0E0E0]/60 uppercase tracking-wider mb-2">
                      Your Vibe
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        Object.keys(vibeEmojis) as Array<
                          keyof typeof vibeEmojis
                        >
                      ).map((vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          onClick={() => setSelectedVibe(vibe)}
                          className={`
                            relative p-3 border-2 transition-all
                            ${
                              selectedVibe === vibe
                                ? "border-[#FFD700] bg-[#FFD700]/10 scale-105"
                                : "border-[#E0E0E0]/20 hover:border-[#FFD700]/50"
                            }
                          `}
                        >
                          <span className="text-2xl">{vibeEmojis[vibe]}</span>
                          {selectedVibe === vibe && (
                            <motion.div
                              layoutId="vibe-selector"
                              className="absolute inset-0 border-2 border-[#FFD700]"
                              transition={{ type: "spring", duration: 0.3 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-xs font-mono text-[#E0E0E0]/60 uppercase tracking-wider mb-2">
                      Your Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Drop your thoughts, feedback, or just say what's up..."
                      required
                      maxLength={500}
                      rows={4}
                      className="w-full bg-black/60 border-2 border-[#E0E0E0]/20 focus:border-[#FFD700] px-4 py-3 text-[#E0E0E0] placeholder:text-[#E0E0E0]/30 transition-colors outline-none font-mono text-sm resize-none"
                    />
                    <div className="text-xs text-[#E0E0E0]/40 text-right mt-1 font-mono">
                      {message.length}/500
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !message.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-[#FFD700] text-black font-black italic uppercase py-4 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      fontFamily: "var(--font-lexend), system-ui, sans-serif",
                      transform: "skewX(-12deg)",
                      boxShadow: "4px 4px 0px #000",
                    }}
                  >
                    <span
                      style={{
                        transform: "skewX(12deg)",
                        display: "inline-block",
                      }}
                    >
                      {isSubmitting ? (
                        "POSTING..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 inline mr-2" />
                          POST IT
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Entries Feed - Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`
                  px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 transition-all
                  ${
                    filter === "all"
                      ? "bg-[#FFD700] text-black border-black"
                      : "bg-black/60 text-[#E0E0E0]/70 border-[#E0E0E0]/20 hover:border-[#FFD700]/50"
                  }
                `}
              >
                All ({entries.length})
              </button>
              {(Object.keys(vibeEmojis) as Array<keyof typeof vibeEmojis>).map(
                (vibe) => {
                  const count = entries.filter((e) => e.vibe === vibe).length;
                  return (
                    <button
                      key={vibe}
                      onClick={() => setFilter(vibe)}
                      className={`
                      px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 transition-all flex items-center gap-2
                      ${
                        filter === vibe
                          ? "bg-[#FFD700] text-black border-black"
                          : "bg-black/60 text-[#E0E0E0]/70 border-[#E0E0E0]/20 hover:border-[#FFD700]/50"
                      }
                    `}
                    >
                      <span>{vibeEmojis[vibe]}</span>
                      {count > 0 && <span>({count})</span>}
                    </button>
                  );
                },
              )}
            </div>

            {/* Entries List */}
            <AnimatePresence mode="popLayout">
              {filteredEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <MessageSquare className="w-16 h-16 text-[#E0E0E0]/20 mx-auto mb-4" />
                  <p className="text-[#E0E0E0]/40 font-mono">
                    No signatures yet. Be the first to drop yours!
                  </p>
                </motion.div>
              ) : (
                filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-[#1a1a1a] border-2 border-[#E0E0E0]/10 hover:border-[#FFD700]/30 transition-all p-6 relative group"
                  >
                    {/* Vibe Badge */}
                    <div
                      className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gradient-to-br ${
                        vibeColors[entry.vibe]
                      } text-2xl`}
                    >
                      {vibeEmojis[entry.vibe]}
                    </div>

                    {/* Header */}
                    <div className="mb-4 pr-14">
                      <h3 className="text-lg font-bold text-[#FFD700] mb-1">
                        {entry.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[#E0E0E0]/50 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-[#E0E0E0]/80 leading-relaxed mb-4">
                      {entry.message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <motion.button
                        onClick={() => handleLike(entry.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 text-[#E0E0E0]/60 hover:text-[#FFD700] transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-mono">{entry.likes}</span>
                      </motion.button>

                      <motion.button
                        onClick={() => handleDelete(entry.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-[#E0E0E0]/40 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Scan Line Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 215, 0, 0.03) 2px, rgba(255, 215, 0, 0.03) 4px)",
                        }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
