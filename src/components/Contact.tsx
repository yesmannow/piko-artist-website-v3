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
          <h2 className="text-4xl md:text-5xl font-graffiti mb-8 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
            Booking / Contact
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block mb-2 font-tag text-neon-green text-lg">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border-0 border-b-2 border-neon-green text-white font-tag text-lg focus:outline-none focus:border-neon-pink transition-colors placeholder:text-gray-500"
                placeholder="Your name"
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block mb-2 font-tag text-neon-green text-lg">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border-0 border-b-2 border-neon-green text-white font-tag text-lg focus:outline-none focus:border-neon-pink transition-colors placeholder:text-gray-500"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Message Input */}
            <div>
              <label htmlFor="message" className="block mb-2 font-tag text-neon-green text-lg">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-transparent border-0 border-b-2 border-neon-green text-white font-tag text-lg focus:outline-none focus:border-neon-pink transition-colors placeholder:text-gray-500 resize-none"
                placeholder="Your message..."
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-transparent border-2 border-neon-green font-tag text-xl font-bold text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                boxShadow: "0 0 20px hsl(var(--neon-green)), 0 0 40px hsl(var(--neon-green))",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
              <motion.div
                className="absolute inset-0 bg-neon-green/20 blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.button>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center font-tag text-neon-green text-lg"
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

