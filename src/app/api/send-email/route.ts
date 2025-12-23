import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...formData } = body;

    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials not configured");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
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

    // Determine subject and email content based on type
    let subject: string;
    let htmlContent: string;
    let textContent: string;

    if (type === "booking") {
      subject = `New Booking Inquiry: ${formData.promoter || "Unknown Promoter"}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6600; border-bottom: 2px solid #ff6600; padding-bottom: 10px;">
            New Booking Inquiry
          </h2>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #ff6600;">
            <p><strong>Promoter / Entity:</strong> ${formData.promoter || "N/A"}</p>
            <p><strong>Email:</strong> ${formData.email || "N/A"}</p>
            <p><strong>Event Type:</strong> ${formData.eventType || "N/A"}</p>
            <p><strong>Target Date:</strong> ${formData.targetDate || "N/A"}</p>
            <p><strong>Venue Capacity:</strong> ${formData.venueCapacity || "N/A"}</p>
            <p><strong>Budget / Offer:</strong> ${formData.budget || "N/A"}</p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Reply to this email to contact the promoter directly.
          </p>
        </div>
      `;

      textContent = `
New Booking Inquiry

Promoter / Entity: ${formData.promoter || "N/A"}
Email: ${formData.email || "N/A"}
Event Type: ${formData.eventType || "N/A"}
Target Date: ${formData.targetDate || "N/A"}
Venue Capacity: ${formData.venueCapacity || "N/A"}
Budget / Offer: ${formData.budget || "N/A"}

Reply to this email to contact the promoter directly.
      `;
    } else {
      // Contact form
      subject = `New Contact Message: ${formData.name || "Unknown"}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px;">
            New Contact Message
          </h2>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #ccff00;">
            <p><strong>Name:</strong> ${formData.name || "N/A"}</p>
            <p><strong>Email:</strong> ${formData.email || "N/A"}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">
              ${formData.message || "N/A"}
            </p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Reply to this email to contact ${formData.name || "the sender"} directly.
          </p>
        </div>
      `;

      textContent = `
New Contact Message

Name: ${formData.name || "N/A"}
Email: ${formData.email || "N/A"}

Message:
${formData.message || "N/A"}

Reply to this email to contact ${formData.name || "the sender"} directly.
      `;
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "Manospintadas420@gmail.com",
      replyTo: formData.email || process.env.EMAIL_USER,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}

