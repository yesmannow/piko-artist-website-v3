import { create } from "zustand";
import { Event } from "@/lib/events";

interface EventStore {
  selectedEvent: Event | null;
  hoverEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  setHoverEvent: (event: Event | null) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  selectedEvent: null,
  hoverEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setHoverEvent: (event) => set({ hoverEvent: event }),
}));

