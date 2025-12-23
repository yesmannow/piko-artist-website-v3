"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { getUpcomingEvents, getPastEvents, Event } from "@/lib/events";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

interface EventListProps {
  limit?: number;
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const dateStr = event.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Random rotation for wheatpaste effect
  const rotation = (Math.random() * 2 - 1).toFixed(2);
  const tapeRotation = (Math.random() * 8 - 4).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
      viewport={{ once: true }}
      className="group relative overflow-visible"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Duct Tape Element - Top Center */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-12 md:w-16 h-4 md:h-6 bg-tape-gray opacity-80"
        style={{ transform: `translateX(-50%) rotate(${tapeRotation}deg)` }}
      >
        <div className="w-full h-full bg-tape-gray border border-black/20" />
      </div>

      {/* Poster Card */}
      <div
        className="bg-concrete overflow-hidden border-2 border-black transition-all hover:scale-[1.02] relative torn-edge"
        style={{
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Wrinkled Paper Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: "multiply",
          }}
        />

        {/* Event Image - Grayscale */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Status Badge */}
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded border-2 border-black text-xs font-header font-bold ${
              event.status === "upcoming"
                ? "bg-safety-orange text-black"
                : "bg-tape-gray text-black"
            }`}
            style={{
              boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
            }}
          >
            {event.status === "upcoming" ? "UPCOMING" : "PAST"}
          </div>
        </div>

        {/* Card Info */}
        <div className="p-4 bg-concrete">
          <h3 className="font-header text-lg md:text-xl text-foreground line-clamp-2 mb-2 group-hover:text-toxic-lime transition-colors font-bold">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm">
            {/* Date - Impact Font */}
            <div className="flex items-center gap-2 text-foreground/80">
              <Calendar className="w-4 h-4" />
              <span className="font-header font-bold">{dateStr}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-foreground/60">
              <MapPin className="w-4 h-4" />
              <span className="font-tag">{event.location}</span>
            </div>

            {/* Type */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-tag uppercase border-2 border-black ${
                  event.type === "festival"
                    ? "bg-spray-magenta/20 text-spray-magenta"
                    : "bg-toxic-lime/20 text-toxic-lime"
                }`}
              >
                {event.type}
              </span>
            </div>

            {/* Ticket Link (if available) */}
            {event.ticketLink && event.status === "upcoming" && (
              <Link
                href={event.ticketLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white text-black font-header font-bold border-2 border-black hover:bg-toxic-lime transition-colors"
                style={{
                  boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Get Tickets
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function EventList({ limit }: EventListProps) {
  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  // If limit is provided, show only next N upcoming events
  if (limit) {
    const limitedEvents = upcomingEvents.slice(0, limit);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
        {limitedEvents.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    );
  }

  // Full list with sections
  return (
    <div className="space-y-12">
      {/* INCOMING TRANSMISSIONS - Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-3xl md:text-4xl font-header mb-6 md:mb-8 text-foreground">
            INCOMING TRANSMISSIONS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
            {upcomingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ARCHIVED FOOTAGE - Past Events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-3xl md:text-4xl font-header mb-6 md:mb-8 text-foreground">
            ARCHIVED FOOTAGE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
            {pastEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

