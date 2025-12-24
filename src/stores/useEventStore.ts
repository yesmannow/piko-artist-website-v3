import { create } from "zustand";
import { Event } from "@/lib/events";

interface EventStore {
  selectedEvent: Event | null;
  hoverEvent: Event | null;
  isFlying: boolean;
  pendingEvent: Event | null; // Event waiting for fly-to animation
  setSelectedEvent: (event: Event | null) => void;
  setHoverEvent: (event: Event | null) => void;
  setIsFlying: (flying: boolean) => void;
  setPendingEvent: (event: Event | null) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  selectedEvent: null,
  hoverEvent: null,
  isFlying: false,
  pendingEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setHoverEvent: (event) => set({ hoverEvent: event }),
  setIsFlying: (flying) => set({ isFlying: flying }),
  setPendingEvent: (event) => set({ pendingEvent: event }),
}));

