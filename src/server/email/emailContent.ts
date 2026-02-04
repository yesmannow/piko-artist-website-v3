/**
 * Email content generation module
 * Generates HTML and text email content based on form type and data
 */

import type { FormType, EmailContent } from "./types";

/**
 * Generate booking inquiry email content
 */
function generateBookingEmail(sanitizedData: Record<string, string>): EmailContent {
  const subject = `New Booking Inquiry: ${sanitizedData.promoter || "Unknown Promoter"}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff6600; border-bottom: 2px solid #ff6600; padding-bottom: 10px;">
        New Booking Inquiry
      </h2>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #ff6600;">
        <p><strong>Promoter / Entity:</strong> ${sanitizedData.promoter || "N/A"}</p>
        <p><strong>Email:</strong> ${sanitizedData.email || "N/A"}</p>
        <p><strong>Event Type:</strong> ${sanitizedData.eventType || "N/A"}</p>
        <p><strong>Target Date:</strong> ${sanitizedData.targetDate || "N/A"}</p>
        <p><strong>Venue Capacity:</strong> ${sanitizedData.venueCapacity || "N/A"}</p>
        <p><strong>Budget / Offer:</strong> ${sanitizedData.budget || "N/A"}</p>
      </div>
      <p style="color: #666; font-size: 12px;">
        Reply to this email to contact the promoter directly.
      </p>
    </div>
  `;

  const textContent = `
New Booking Inquiry

Promoter / Entity: ${sanitizedData.promoter || "N/A"}
Email: ${sanitizedData.email || "N/A"}
Event Type: ${sanitizedData.eventType || "N/A"}
Target Date: ${sanitizedData.targetDate || "N/A"}
Venue Capacity: ${sanitizedData.venueCapacity || "N/A"}
Budget / Offer: ${sanitizedData.budget || "N/A"}

Reply to this email to contact the promoter directly.
  `;

  return { subject, htmlContent, textContent };
}

/**
 * Generate contact form email content
 */
function generateContactEmail(sanitizedData: Record<string, string>): EmailContent {
  const subject = `New Contact Message: ${sanitizedData.name || "Unknown"}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FFD700; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">
        New Contact Message
      </h2>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #FFD700;">
        <p><strong>Name:</strong> ${sanitizedData.name || "N/A"}</p>
        <p><strong>Email:</strong> ${sanitizedData.email || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">
          ${sanitizedData.message || "N/A"}
        </p>
      </div>
      <p style="color: #666; font-size: 12px;">
        Reply to this email to contact ${sanitizedData.name || "the sender"} directly.
      </p>
    </div>
  `;

  const textContent = `
New Contact Message

Name: ${sanitizedData.name || "N/A"}
Email: ${sanitizedData.email || "N/A"}

Message:
${sanitizedData.message || "N/A"}

Reply to this email to contact ${sanitizedData.name || "the sender"} directly.
  `;

  return { subject, htmlContent, textContent };
}

/**
 * Build hub email HTML sections
 */
function buildHubHtmlSections(data: Record<string, string>): string {
  const contactSection = `
    <div style="background: #f5f5f5; padding: 18px; margin: 18px 0; border-left: 4px solid #FFD700;">
      <p><strong>Inquiry Type:</strong> ${data.inquiryType || "N/A"}</p>
      <p><strong>Name:</strong> ${data.name || "N/A"}</p>
      <p><strong>Email:</strong> ${data.email || "N/A"}</p>
      <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
      <p><strong>Company / Entity:</strong> ${data.company || "N/A"}</p>
      <p><strong>Location:</strong> ${(data.city || "N/A")} ${(data.country ? `(${data.country})` : "")}</p>
    </div>
  `;

  const bookingSection = `
    <h3 style="margin: 18px 0 8px;">Booking Details</h3>
    <div style="background: #fff; padding: 14px; border: 1px solid #ddd;">
      <p><strong>Event Type:</strong> ${data.eventType || "N/A"}</p>
      <p><strong>Target Date:</strong> ${data.targetDate || "N/A"}</p>
      <p><strong>Venue:</strong> ${data.venue || "N/A"}</p>
      <p><strong>Venue Capacity:</strong> ${data.venueCapacity || "N/A"}</p>
      <p><strong>Budget / Offer:</strong> ${data.budget || "N/A"}</p>
      <p><strong>Travel / Hospitality:</strong> ${data.travel || "N/A"}</p>
    </div>
  `;

  const messageSection = `
    <h3 style="margin: 18px 0 8px;">Links & Message</h3>
    <div style="background: #fff; padding: 14px; border: 1px solid #ddd;">
      <p><strong>Preferred Contact:</strong> ${data.preferredContact || "N/A"}</p>
      <p><strong>Links:</strong> ${data.links || "N/A"}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #fafafa; padding: 12px; border: 1px solid #eee;">
        ${data.message || "N/A"}
      </p>
    </div>
  `;

  return contactSection + bookingSection + messageSection;
}

/**
 * Build hub email text sections
 */
function buildHubTextSections(data: Record<string, string>): string {
  return `
Inquiry Type: ${data.inquiryType || "N/A"}
Name: ${data.name || "N/A"}
Email: ${data.email || "N/A"}
Phone: ${data.phone || "N/A"}
Company / Entity: ${data.company || "N/A"}
Location: ${data.city || "N/A"} ${data.country ? `(${data.country})` : ""}

Booking Details
Event Type: ${data.eventType || "N/A"}
Target Date: ${data.targetDate || "N/A"}
Venue: ${data.venue || "N/A"}
Venue Capacity: ${data.venueCapacity || "N/A"}
Budget / Offer: ${data.budget || "N/A"}
Travel / Hospitality: ${data.travel || "N/A"}

Links
Preferred Contact: ${data.preferredContact || "N/A"}
Links: ${data.links || "N/A"}

Message:
${data.message || "N/A"}
  `;
}

/**
 * Generate hub inquiry email content
 */
function generateHubEmail(sanitizedData: Record<string, string>): EmailContent {
  const iType = sanitizedData.inquiryType || "inquiry";
  const subject = `New ${iType.toUpperCase()} Inquiry: ${sanitizedData.name || "Unknown"}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #FFD700; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">
        New Inquiry (Business Hub)
      </h2>
      ${buildHubHtmlSections(sanitizedData)}
      <p style="color: #666; font-size: 12px; margin-top: 12px;">
        Reply to this email to contact ${sanitizedData.name || "the sender"} directly.
      </p>
    </div>
  `;

  const textContent = `New Inquiry (Business Hub)\n${buildHubTextSections(sanitizedData)}`;

  return { subject, htmlContent, textContent };
}

/**
 * Generate email content based on form type
 */
export function generateEmailContent(
  type: FormType,
  sanitizedData: Record<string, string>
): EmailContent {
  switch (type) {
    case "booking":
      return generateBookingEmail(sanitizedData);
    case "contact":
      return generateContactEmail(sanitizedData);
    case "hub":
      return generateHubEmail(sanitizedData);
  }
}
