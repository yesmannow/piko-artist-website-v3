export type DeckVariant = "desktop" | "tablet" | "mobile";

export type DeckProps = {
  deckId: "A" | "B";
  variant: DeckVariant;
  isFocused: boolean;
  onFocus: () => void;
  onLoadTrack?: (trackId: string) => void;
  stems?: Record<string, AudioBuffer>;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
};

export type DeckRenderContext = {
  title?: string;
  artist?: string;
  bpm?: number;
  progressSeconds?: number;
  durationSeconds?: number;
  deckReady: boolean;
  performanceMode: "high" | "balanced" | "low";
  containerRef: React.RefObject<HTMLElement>;
  onCue?: () => void;
  onSync?: () => void;
};

export type DeckViewProps = DeckProps & DeckRenderContext;
