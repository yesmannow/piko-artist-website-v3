import { TimelineSegment } from "@/store/useDeckMixerStore";

export type TransitionSnippet = {
  id: string;
  name: string;
  transition: NonNullable<TimelineSegment["transition"]>;
  description?: string;
};

export const transitionSnippets: TransitionSnippet[] = [
  {
    id: "fade",
    name: "Smooth Fade",
    transition: "fade",
    description: "Basic equal-power fade between segments.",
  },
  {
    id: "cut",
    name: "Hard Cut",
    transition: "cut",
    description: "Abrupt change for high-energy mixes.",
  },
  {
    id: "echo-out",
    name: "Echo Out",
    transition: "echo-out",
    description: "Send decay and ducking into the next drop.",
  },
  {
    id: "filter-in",
    name: "Filter In",
    transition: "filter-in",
    description: "HPF sweep to introduce the next track.",
  },
];
