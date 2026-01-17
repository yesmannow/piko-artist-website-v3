"use client";

import { useEffect, useState } from "react";
import { X, Share2, Link as LinkIcon } from "lucide-react";

interface ShareMixModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  mixUrl: string;
  coverArt?: string;
}

export function ShareMixModal({
  open,
  onClose,
  title,
  mixUrl,
  coverArt,
}: ShareMixModalProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  if (!open) return null;

  const share = async () => {
    if (canNativeShare) {
      await navigator.share({ title, url: mixUrl });
      return;
    }
    await navigator.clipboard.writeText(mixUrl);
  };

  const shareTo = (network: "x" | "threads") => {
    const encoded = encodeURIComponent(mixUrl);
    if (network === "x") {
      window.open(
        `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`,
        "_blank",
      );
    } else {
      window.open(
        `https://www.threads.net/intent/post?url=${encoded}`,
        "_blank",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Share Mix
            </p>
            <p className="text-lg font-semibold">{title}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {coverArt ? (
          <div
            className="h-40 w-full rounded-xl border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverArt})` }}
          />
        ) : null}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            Link
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            <LinkIcon className="h-4 w-4 text-white/50" />
            <span className="flex-1 truncate text-sm">{mixUrl}</span>
            <button
              onClick={share}
              className="rounded-full border border-safety-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-safety-yellow"
            >
              {canNativeShare ? "Share" : "Copy"}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => shareTo("x")}
            className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm uppercase tracking-[0.16em] text-white/80 hover:border-white/50"
          >
            Share on X
          </button>
          <button
            onClick={() => shareTo("threads")}
            className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm uppercase tracking-[0.16em] text-white/80 hover:border-white/50"
          >
            Threads
          </button>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60 space-y-1">
          <div className="flex items-center justify-between">
            <span>Shareable URL</span>
            <span className="text-white/80">{mixUrl ? "Ready" : "No URL"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Preview</span>
            <Share2 className="h-4 w-4 text-safety-yellow" />
          </div>
        </div>
      </div>
    </div>
  );
}
