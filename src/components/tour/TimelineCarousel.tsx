"use client";

import { useCallback, useEffect, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Event } from "@/lib/events";
import { useEventStore } from "@/stores/useEventStore";
import { Calendar, MapPin } from "lucide-react";

interface TimelineCarouselProps {
  events: Event[];
}

// Group events by year and month
function groupEventsByYearMonth(events: Event[]) {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
    const year = event.date.getFullYear();
    const month = event.date.getMonth();
    const key = `${year}-${month}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(event);
  });

  // Sort keys chronologically
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [yearA, monthA] = a.split("-").map(Number);
    const [yearB, monthB] = b.split("-").map(Number);
    if (yearA !== yearB) return yearB - yearA; // Descending (newest first)
    return monthB - monthA;
  });

  return sortedKeys.map((key) => ({
    key,
    year: parseInt(key.split("-")[0]),
    month: parseInt(key.split("-")[1]),
    events: grouped[key].sort((a, b) => a.date.getTime() - b.date.getTime()),
  }));
}

export function TimelineCarousel({ events }: TimelineCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
  });
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const selectedEvent = useEventStore((state) => state.selectedEvent);

  const groupedEvents = useMemo(() => groupEventsByYearMonth(events), [events]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Scroll to selected event
  useEffect(() => {
    if (!selectedEvent || !emblaApi) return;

    const selectedIndex = groupedEvents.findIndex((group) =>
      group.events.some((e) => e.id === selectedEvent.id)
    );

    if (selectedIndex !== -1) {
      emblaApi.scrollTo(selectedIndex);
    }
  }, [selectedEvent, emblaApi, groupedEvents]);

  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  return (
    <div className="relative w-full">
      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-concrete border-2 border-black text-foreground font-header font-bold hover:bg-toxic-lime hover:text-black transition-colors flex items-center justify-center shadow-hard"
        aria-label="Previous timeline"
      >
        ←
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-concrete border-2 border-black text-foreground font-header font-bold hover:bg-toxic-lime hover:text-black transition-colors flex items-center justify-center shadow-hard"
        aria-label="Next timeline"
      >
        →
      </button>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {groupedEvents.map((group, groupIndex) => (
            <div
              key={group.key}
              className="flex-shrink-0 w-[280px] md:w-[320px]"
            >
              {/* Year/Month Header */}
              <div className="mb-4 bg-concrete border-2 border-black p-3 shadow-hard">
                <h3 className="font-header text-2xl text-foreground">
                  {monthNames[group.month]} {group.year}
                </h3>
              </div>

              {/* Events in this month */}
              <div className="space-y-3">
                {group.events.map((event, eventIndex) => {
                  const isSelected = selectedEvent?.id === event.id;
                  const isUpcoming = event.status === "upcoming";
                  const isLive = isUpcoming && new Date(event.date) > new Date();

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: groupIndex % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: eventIndex * 0.1 }}
                      onClick={() => setSelectedEvent(event)}
                      className={`relative p-4 bg-concrete border-2 cursor-pointer transition-all hover:scale-105 ${
                        isSelected
                          ? "border-toxic-lime shadow-[0_0_20px_rgba(204,255,0,0.5)]"
                          : "border-black"
                      } ${isLive ? "ring-2 ring-safety-orange ring-opacity-50" : ""}`}
                      style={{
                        boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
                      }}
                    >
                      {/* Live/Upcoming Glow */}
                      {isLive && (
                        <motion.div
                          className="absolute inset-0 bg-safety-orange/20 rounded"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      )}

                      <div className="relative z-10">
                        <h4 className="font-header text-lg text-foreground mb-2 line-clamp-1">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-foreground/70 mb-2">
                          <Calendar className="w-3 h-3" />
                          <span className="font-industrial font-bold">
                            {event.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <MapPin className="w-3 h-3" />
                          <span className="font-industrial font-bold uppercase tracking-wider">
                            {event.location}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded border-2 border-black text-xs font-header font-bold ${
                              isUpcoming
                                ? "bg-safety-orange text-black"
                                : "bg-tape-gray text-black"
                            }`}
                          >
                            {isUpcoming ? "UPCOMING" : "PAST"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

