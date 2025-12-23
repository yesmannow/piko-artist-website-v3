"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, FormEvent } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section id="contact" className="relative min-h-[600px] flex items-center justify-center py-20 px-4 md:px-8 overflow-hidden">
      {/* Graffiti Wall Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg/graffiti-wall-2.jpg"
          alt="Graffiti Wall Background"
          fill
          className="object-cover"
          priority
        />
        {/* Heavy dark overlay (90% opacity) */}
        <div className="absolute inset-0 bg-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-header mb-8 text-center text-foreground">
            Booking / Contact
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input - Duct Tape Style */}
            <div>
              <label htmlFor="name" className="block mb-2 font-tag text-toxic-lime text-lg">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Email Input - Duct Tape Style */}
            <div>
              <label htmlFor="email" className="block mb-2 font-tag text-toxic-lime text-lg">
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

            {/* Message Input - Duct Tape Style */}
            <div>
              <label htmlFor="message" className="block mb-2 font-tag text-toxic-lime text-lg">
                Message
              </label>
              <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-300 text-black font-tag text-lg focus:outline-none transition-all placeholder:text-gray-600 resize-none"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                  placeholder="Your message..."
                />
              </div>
            </div>

            {/* Submit Button - "Fragile" Sticker Style */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-red-600 border-2 border-black font-header text-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-hard"
              style={{
                clipPath: "polygon(2% 0%, 98% 0%, 100% 3%, 100% 97%, 98% 100%, 2% 100%, 0% 97%, 0% 3%)",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1), inset 0 0 10px rgba(0,0,0,0.1)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? "ENVIANDO..." : "FRAGILE - HANDLE WITH CARE"}
              {/* Distressed border effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
                  `,
                  opacity: 0.3,
                }}
              />
            </motion.button>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center font-tag text-toxic-lime text-lg"
              >
                ✓ Mensaje enviado con éxito!
              </motion.p>
            )}
            {submitStatus === "error" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center font-tag text-red-500 text-lg"
              >
                ✗ Error al enviar. Por favor intenta de nuevo.
              </motion.p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}

