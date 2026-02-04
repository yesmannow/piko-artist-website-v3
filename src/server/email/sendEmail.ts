/**
 * Email sending module
 * Wraps nodemailer configuration and sending logic
 */

import nodemailer from "nodemailer";
import type { EmailContent } from "./types";

export interface EmailConfig {
  emailUser: string;
  emailPass: string;
  recipientEmail: string;
}

/**
 * Validate email configuration from environment variables
 */
export function validateEmailConfig(): EmailConfig | null {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const recipientEmail = process.env.RECIPIENT_EMAIL || "Manospintadas420@gmail.com";

  if (!emailUser || !emailPass) {
    return null;
  }

  return { emailUser, emailPass, recipientEmail };
}

/**
 * Send email using nodemailer
 */
export async function sendEmail(
  config: EmailConfig,
  content: EmailContent,
  replyToEmail: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });

  const info = await transporter.sendMail({
    from: config.emailUser,
    to: config.recipientEmail,
    replyTo: replyToEmail || config.emailUser,
    subject: content.subject,
    text: content.textContent,
    html: content.htmlContent,
  });

  // Log success in development only
  if (process.env.NODE_ENV === "development") {
    console.log("[EmailService] Email sent:", info.messageId);
  }
}
