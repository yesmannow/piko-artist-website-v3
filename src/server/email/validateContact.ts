/**
 * Input validation and sanitization module
 * Pure functions with no side effects - easily testable
 */

import type { FormType, ValidationResult } from "./types";

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  // Remove HTML tags and escape special characters
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 10000); // Limit length to prevent DOS
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate form type
 */
export function isValidFormType(type: unknown): type is FormType {
  return type === "booking" || type === "contact" || type === "hub";
}

/**
 * Validate and sanitize booking form
 */
function validateBooking(formData: Record<string, unknown>): ValidationResult {
  if (!formData.email || !isValidEmail(formData.email as string)) {
    return { isValid: false, error: "Valid email is required" };
  }

  const email = formData.email as string;
  const sanitizedData = {
    promoter: sanitizeInput(formData.promoter || ""),
    email: email,
    eventType: sanitizeInput(formData.eventType || ""),
    targetDate: sanitizeInput(formData.targetDate || ""),
    venueCapacity: sanitizeInput(formData.venueCapacity || ""),
    budget: sanitizeInput(formData.budget || ""),
  };

  return { isValid: true, sanitizedData, email };
}

/**
 * Validate and sanitize contact form
 */
function validateContact(formData: Record<string, unknown>): ValidationResult {
  if (!formData.email || !isValidEmail(formData.email as string)) {
    return { isValid: false, error: "Valid email is required" };
  }

  if (!formData.name || typeof formData.name !== "string" || formData.name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  if (!formData.message || typeof formData.message !== "string" || formData.message.trim().length < 10) {
    return { isValid: false, error: "Message must be at least 10 characters" };
  }

  const email = formData.email as string;
  const sanitizedData = {
    name: sanitizeInput(formData.name),
    email: email,
    message: sanitizeInput(formData.message),
  };

  return { isValid: true, sanitizedData, email };
}

/**
 * Sanitize all hub form fields
 */
function sanitizeHubFields(formData: Record<string, unknown>, email: string): Record<string, string> {
  return {
    inquiryType: sanitizeInput(formData.inquiryType || ""),
    name: sanitizeInput(formData.name),
    email: email,
    phone: sanitizeInput(formData.phone || ""),
    company: sanitizeInput(formData.company || ""),
    city: sanitizeInput(formData.city || ""),
    country: sanitizeInput(formData.country || ""),
    eventType: sanitizeInput(formData.eventType || ""),
    targetDate: sanitizeInput(formData.targetDate || ""),
    venue: sanitizeInput(formData.venue || ""),
    venueCapacity: sanitizeInput(formData.venueCapacity || ""),
    budget: sanitizeInput(formData.budget || ""),
    travel: sanitizeInput(formData.travel || ""),
    preferredContact: sanitizeInput(formData.preferredContact || ""),
    links: sanitizeInput(formData.links || ""),
    message: sanitizeInput(formData.message),
  };
}

/**
 * Validate and sanitize hub inquiry form
 */
function validateHub(formData: Record<string, unknown>): ValidationResult {
  if (!formData.email || !isValidEmail(formData.email as string)) {
    return { isValid: false, error: "Valid email is required" };
  }

  if (!formData.name || typeof formData.name !== "string" || formData.name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  if (!formData.message || typeof formData.message !== "string" || formData.message.trim().length < 10) {
    return { isValid: false, error: "Message must be at least 10 characters" };
  }

  const email = formData.email as string;
  const sanitizedData = sanitizeHubFields(formData, email);

  return { isValid: true, sanitizedData, email };
}

/**
 * Main validation function - routes to appropriate validator based on form type
 */
export function validateContactForm(
  type: FormType,
  formData: Record<string, unknown>
): ValidationResult {
  if (!isValidFormType(type)) {
    return { isValid: false, error: "Invalid form type" };
  }

  switch (type) {
    case "booking":
      return validateBooking(formData);
    case "contact":
      return validateContact(formData);
    case "hub":
      return validateHub(formData);
    default:
      return { isValid: false, error: "Invalid form type" };
  }
}
