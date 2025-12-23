"use client";

import { motion } from "framer-motion";
import { useState, FormEvent } from "react";
import { GlitchText } from "@/components/GlitchText";

export function BookingForm() {
  const [formData, setFormData] = useState({
    promoter: "",
    email: "",
    eventType: "festival",
    targetDate: "",
    venueCapacity: "",
    budget: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "booking",
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        setFormData({
          promoter: "",
          email: "",
          eventType: "festival",
          targetDate: "",
          venueCapacity: "",
          budget: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative bg-zinc-900 p-6 md:p-8 border-2 border-safety-orange shadow-hard"
      style={{
        boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {/* Noise Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <h2 className="text-3xl md:text-4xl font-header mb-2 text-foreground">
          <GlitchText text="SECURE THE ASSET" />
        </h2>
        <p className="text-sm md:text-base font-tag text-foreground/70">
          Booking Inquiry / Performance Contract
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Promoter / Entity */}
        <div>
          <label htmlFor="promoter" className="block mb-2 font-tag text-safety-orange text-lg">
            Promoter / Entity
          </label>
          <div className="relative">
            <input
              type="text"
              id="promoter"
              name="promoter"
              value={formData.promoter}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
              placeholder="Your name or organization"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-2 font-tag text-safety-orange text-lg">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="eventType" className="block mb-2 font-tag text-safety-orange text-lg">
            Event Type
          </label>
          <div className="relative">
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all border-2 border-black"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              <option value="festival">Festival</option>
              <option value="club">Club</option>
              <option value="private">Private</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="targetDate" className="block mb-2 font-tag text-safety-orange text-lg">
            Target Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
            />
          </div>
        </div>

        {/* Venue Capacity */}
        <div>
          <label htmlFor="venueCapacity" className="block mb-2 font-tag text-safety-orange text-lg">
            Venue Capacity
          </label>
          <div className="relative">
            <input
              type="number"
              id="venueCapacity"
              name="venueCapacity"
              value={formData.venueCapacity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
              placeholder="Expected attendance"
            />
          </div>
        </div>

        {/* Budget / Offer */}
        <div>
          <label htmlFor="budget" className="block mb-2 font-tag text-safety-orange text-lg">
            Budget / Offer
          </label>
          <div className="relative">
            <input
              type="text"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
              }}
              placeholder="Budget range or offer amount"
            />
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-white text-black font-header text-xl font-bold border-2 border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-hard"
          style={{
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? "TRANSMITTING..." : "TRANSMIT OFFER"}
        </motion.button>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-header text-toxic-lime text-lg font-bold"
          >
            ✓ TRANSMISSION SECURE
          </motion.p>
        )}
        {submitStatus === "error" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-header text-red-500 text-lg font-bold"
          >
            ✗ SIGNAL LOST - Please try again
          </motion.p>
        )}
      </form>
    </motion.div>
  );
}

