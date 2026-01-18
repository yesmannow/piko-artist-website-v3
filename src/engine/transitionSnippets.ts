import { TimelineSegment } from "@/store/useDeckMixerStore";

export type TransitionPreset = {
  id: string;
  name: string;
  automation: Array<
    TimelineSegment & {
      gainCurve?: "fade" | "duck";
      fx?: "echo" | "filter" | "stutter";
    }
  >;
};

export const transitionPresets: TransitionPreset[] = [
  {
    id: "echo-fade",
    name: "Echo Fade",
    automation: [
      {
        id: "echo-fade",
        trackId: "",
        startBeat: 0,
        endBeat: 16,
        transition: "echo-out",
        fx: "echo",
      },
    ],
  },
  {
    id: "filter-sweep",
    name: "Filter Sweep",
    automation: [
      {
        id: "filter-sweep",
        trackId: "",
        startBeat: 0,
        endBeat: 8,
        transition: "filter-in",
        fx: "filter",
      },
    ],
  },
  {
    id: "stutter-exit",
    name: "Stutter Exit",
    automation: [
      {
        id: "stutter-exit",
        trackId: "",
        startBeat: 0,
        endBeat: 4,
        transition: "cut",
        fx: "stutter",
      },
    ],
  },
];
