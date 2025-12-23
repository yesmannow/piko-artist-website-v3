import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Input sanitization helper to prevent XSS
function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  // Remove HTML tags and escape special characters
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 10000); // Limit length
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, ...formData } = body;

    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Validate and sanitize inputs
    if (type !== "booking" && type !== "contact") {
      return NextResponse.json(
        { success: false, error: "Invalid form type" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Sanitize and validate inputs
    let sanitizedData: Record<string, string> = {};
    let email: string;

    if (type === "booking") {
      // Validate required fields
      if (!formData.email || !isValidEmail(formData.email)) {
        return NextResponse.json(
          { success: false, error: "Valid email is required" },
          { status: 400 }
        );
      }

      email = formData.email;
      sanitizedData = {
        promoter: sanitizeInput(formData.promoter || ""),
        email: email,
        eventType: sanitizeInput(formData.eventType || ""),
        targetDate: sanitizeInput(formData.targetDate || ""),
        venueCapacity: sanitizeInput(formData.venueCapacity || ""),
        budget: sanitizeInput(formData.budget || ""),
      };
    } else {
      // Contact form validation
      if (!formData.email || !isValidEmail(formData.email)) {
        return NextResponse.json(
          { success: false, error: "Valid email is required" },
          { status: 400 }
        );
      }

      if (!formData.name || formData.name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }

      if (!formData.message || formData.message.trim().length < 10) {
        return NextResponse.json(
          { success: false, error: "Message must be at least 10 characters" },
          { status: 400 }
        );
      }

      email = formData.email;
      sanitizedData = {
        name: sanitizeInput(formData.name || ""),
        email: email,
        message: sanitizeInput(formData.message || ""),
      };
    }

    // Determine subject and email content based on type
    let subject: string;
    let htmlContent: string;
    let textContent: string;

    if (type === "booking") {
      subject = `New Booking Inquiry: ${sanitizedData.promoter || "Unknown Promoter"}`;

      htmlContent = `
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

      textContent = `
New Booking Inquiry

Promoter / Entity: ${sanitizedData.promoter || "N/A"}
Email: ${sanitizedData.email || "N/A"}
Event Type: ${sanitizedData.eventType || "N/A"}
Target Date: ${sanitizedData.targetDate || "N/A"}
Venue Capacity: ${sanitizedData.venueCapacity || "N/A"}
Budget / Offer: ${sanitizedData.budget || "N/A"}

Reply to this email to contact the promoter directly.
      `;
    } else {
      // Contact form
      subject = `New Contact Message: ${sanitizedData.name || "Unknown"}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px;">
            New Contact Message
          </h2>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #ccff00;">
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

      textContent = `
New Contact Message

Name: ${sanitizedData.name || "N/A"}
Email: ${sanitizedData.email || "N/A"}

Message:
${sanitizedData.message || "N/A"}

Reply to this email to contact ${sanitizedData.name || "the sender"} directly.
      `;
    }

    // Send email
    const recipientEmail = process.env.RECIPIENT_EMAIL || "Manospintadas420@gmail.com";
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      replyTo: email || process.env.EMAIL_USER,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    // Log success in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Email sent:", info.messageId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error details in development, generic message in production
    const errorMessage = process.env.NODE_ENV === "development"
      ? (error instanceof Error ? error.message : "Unknown error")
      : "Failed to send email";

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error sending email:", error);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

