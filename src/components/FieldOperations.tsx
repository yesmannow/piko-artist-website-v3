"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { events } from "@/lib/events";

/**
 * FieldOperations - Tactical Dispatch Board for Tour Section
 *
 * Urban Syndicate aesthetic: Interactive dispatch board with
 * tactical folders, dark grid-map background, and perforated ticket buttons.
 */
export function FieldOperations() {
  return (
    <section id="live-operations" className="relative py-24 bg-[#080808] overflow-hidden">
      {/* Background Grid Map */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none grayscale"
        style={{
          backgroundImage: `radial-gradient(#E0E0E0 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <h2
          className="text-4xl md:text-6xl font-black italic uppercase mb-12 border-l-8 border-[#FFD700] pl-6"
          style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
        >
          FIELD_<span className="text-[#FFD700]">DISPATCH</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.slice(0, 4).map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-[#111] border border-white/10 p-1 transition-all hover:border-[#FFD700]/50"
            >
              <div className="flex bg-[#111] p-6 border border-white/5 items-center justify-between">
                <div>
                  <div className="text-[#FFD700] font-mono text-[10px] mb-2 tracking-tighter uppercase font-bold">
                    Status: SIGNAL_LOCKED
                  </div>
                  <h3
                    className="text-2xl font-black italic text-[#E0E0E0]"
                    style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
                  >
                    {event.location.toUpperCase()}
                  </h3>
                  <p className="text-sm opacity-50 font-bold uppercase font-mono">
                    {event.title} — {event.date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                  </p>
                </div>

                {/* Perforated Ticket Style Button */}
                <Link
                  href={event.ticketLink || "/tour"}
                  className="relative px-6 py-3 bg-[#FFD700] text-black font-black italic uppercase text-xs border-r-4 border-dashed border-black/30 hover:bg-white transition-colors inline-block"
                  style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
                >
                  SECURE PASS
                </Link>
              </div>

              {/* Tactical Folder "Tab" */}
              <div className="absolute -top-3 left-6 px-4 py-1 bg-[#222] text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] border border-white/10">
                OP_FILE_{i + 1}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Industrial Caution Tape Footer */}
        <div className="mt-24 h-14 w-[110%] -ml-[5%] flex items-center overflow-hidden bg-[#FFD700] text-black font-black italic rotate-[-1.5deg] shadow-2xl">
          <div className="whitespace-nowrap animate-marquee">
            {Array(8)
              .fill(" PIKO FG // LIVE OPERATIONS // SIGNAL_ACQUIRED // VAULT_ACCESS_GRANTED //")
              .map((t, i) => (
                <span key={i} className="text-xl mx-4">
                  {t}
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

