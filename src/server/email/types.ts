/**
 * Email service type definitions
 */

export type FormType = "booking" | "contact" | "hub";

export interface BookingFormData {
  promoter?: string;
  email: string;
  eventType?: string;
  targetDate?: string;
  venueCapacity?: string;
  budget?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface HubFormData {
  inquiryType?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  country?: string;
  eventType?: string;
  targetDate?: string;
  venue?: string;
  venueCapacity?: string;
  budget?: string;
  travel?: string;
  preferredContact?: string;
  links?: string;
  message: string;
}

export type FormData = BookingFormData | ContactFormData | HubFormData;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedData?: Record<string, string>;
  email?: string;
}

export interface EmailContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}
