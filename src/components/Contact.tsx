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
  const [errorMessage, setErrorMessage] = useState<string>("");

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
          type: "contact",
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit form" }));
        setSubmitStatus("error");
        setErrorMessage(errorData.error || "Failed to submit form. Please try again.");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setErrorMessage("");
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Failed to submit form. Please try again.");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error submitting form:", error);
      }
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
              <label htmlFor="name" className="block mb-2 font-industrial font-bold uppercase tracking-wider text-toxic-lime text-lg">
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
                  minLength={2}
                  maxLength={100}
                  aria-label="Your name"
                  aria-required="true"
                  className="w-full px-4 py-3 bg-gray-300 text-black font-industrial font-bold uppercase tracking-wider text-lg focus:outline-none focus:ring-2 focus:ring-toxic-lime transition-all placeholder:text-gray-600"
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
              <label htmlFor="email" className="block mb-2 font-industrial font-bold uppercase tracking-wider text-toxic-lime text-lg">
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
                  maxLength={254}
                  aria-label="Your email address"
                  aria-required="true"
                  className="w-full px-4 py-3 bg-gray-300 text-black font-industrial font-bold uppercase tracking-wider text-lg focus:outline-none focus:ring-2 focus:ring-toxic-lime transition-all placeholder:text-gray-600"
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
              <label htmlFor="message" className="block mb-2 font-industrial font-bold uppercase tracking-wider text-toxic-lime text-lg">
                Message
              </label>
              <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  aria-label="Your message"
                  aria-required="true"
                  className="w-full px-4 py-3 bg-gray-300 text-black font-industrial font-bold uppercase tracking-wider text-lg focus:outline-none focus:ring-2 focus:ring-toxic-lime transition-all placeholder:text-gray-600 resize-none"
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
              aria-label={isSubmitting ? "Submitting form" : "Submit contact form"}
              aria-busy={isSubmitting}
              className="w-full px-8 py-4 bg-red-600 border-2 border-black font-header text-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-hard focus:outline-none focus:ring-2 focus:ring-toxic-lime focus:ring-offset-2"
              style={{
                clipPath: "polygon(2% 0%, 98% 0%, 100% 3%, 100% 97%, 98% 100%, 2% 100%, 0% 97%, 0% 3%)",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1), inset 0 0 10px rgba(0,0,0,0.1)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? "TRANSMITTING..." : "FRAGILE - HANDLE WITH CARE"}
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
                className="text-center font-header text-toxic-lime text-lg font-bold"
                role="status"
                aria-live="polite"
              >
                ✓ TRANSMISSION SECURE
              </motion.p>
            )}
            {submitStatus === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-2"
                role="alert"
                aria-live="polite"
              >
                <p className="font-header text-red-500 text-lg font-bold">
                  ✗ SIGNAL LOST
                </p>
                {errorMessage && (
                  <p className="text-sm text-red-400 font-barlow">
                    {errorMessage}
                  </p>
                )}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}

