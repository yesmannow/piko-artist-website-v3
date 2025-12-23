export interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  type: "festival" | "club";
  status: "upcoming" | "past";
  image: string;
  ticketLink?: string;
}

export const events: Event[] = [
  // Upcoming Events
  {
    id: "riverbeat-2025",
    title: "Riverbeat Festival",
    date: new Date("2025-05-02"),
    location: "Memphis, TN",
    coordinates: [35.14, -90.04],
    type: "festival",
    status: "upcoming",
    image: "/images/events/event-festival-7.jpg",
    ticketLink: "https://example.com/tickets/riverbeat",
  },
  {
    id: "rolling-loud-portugal-2025",
    title: "Rolling Loud",
    date: new Date("2025-07-05"),
    location: "Portugal",
    coordinates: [37.13, -8.53],
    type: "festival",
    status: "upcoming",
    image: "/images/events/event-6-festival.webp",
    ticketLink: "https://example.com/tickets/rolling-loud",
  },
  {
    id: "neon-city-bass-2025",
    title: "Neon City Bass",
    date: new Date("2025-08-12"),
    location: "Berlin",
    coordinates: [52.52, 13.4],
    type: "festival",
    status: "upcoming",
    image: "/images/events/event-5.jpg",
    ticketLink: "https://example.com/tickets/neon-city",
  },
  // Past Events
  {
    id: "mini-music-fest-2024",
    title: "Mini Music Fest",
    date: new Date("2024-09-19"),
    location: "Chicago",
    coordinates: [41.87, -87.62],
    type: "festival",
    status: "past",
    image: "/images/events/event-festival-3.jpg",
  },
  {
    id: "rolling-loud-portugal-2020",
    title: "Rolling Loud 2020",
    date: new Date("2020-07-08"),
    location: "Portugal",
    coordinates: [37.13, -8.53],
    type: "festival",
    status: "past",
    image: "/images/events/event-festival-4.jpg",
  },
  {
    id: "basement-set-2023",
    title: "The Basement Set",
    date: new Date("2023-12-10"),
    location: "NYC",
    coordinates: [40.71, -74.0],
    type: "club",
    status: "past",
    image: "/images/events/event-1.jpg",
  },
  {
    id: "warehouse-project-2023",
    title: "Warehouse Project",
    date: new Date("2023-11-05"),
    location: "London",
    coordinates: [51.5, -0.12],
    type: "club",
    status: "past",
    image: "/images/events/event-4.jpg",
  },
];

// Helper functions
export function getUpcomingEvents(): Event[] {
  return events.filter((event) => event.status === "upcoming").sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getPastEvents(): Event[] {
  return events.filter((event) => event.status === "past").sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

