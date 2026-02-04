import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/server/email/rateLimit";
import { validateContactForm, isValidFormType } from "@/server/email/validateContact";
import { generateEmailContent } from "@/server/email/emailContent";
import { sendEmail, validateEmailConfig } from "@/server/email/sendEmail";

/**
 * POST /api/send-email
 * Handles contact form submissions with validation, rate limiting, and email sending
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientId = getClientIdentifier(request.headers);
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Validate email configuration
    const emailConfig = validateEmailConfig();
    if (!emailConfig) {
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { type, ...formData } = body;

    if (!isValidFormType(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid form type" },
        { status: 400 }
      );
    }

    // 4. Validate and sanitize form data
    const validationResult = validateContactForm(type, formData);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // 5. Generate email content
    const emailContent = generateEmailContent(type, validationResult.sanitizedData!);

    // 6. Send email
    await sendEmail(emailConfig, emailContent, validationResult.email!);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error details in development, generic message in production
    const errorMessage = process.env.NODE_ENV === "development"
      ? (error instanceof Error ? error.message : "Unknown error")
      : "Failed to send email";

    if (process.env.NODE_ENV === "development") {
      console.error("[SendEmail API] Error:", error);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
