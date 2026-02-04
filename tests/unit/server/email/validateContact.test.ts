import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  isValidEmail,
  isValidFormType,
  validateContactForm,
} from "@/server/email/validateContact";

describe("validateContact", () => {
  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;");
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should handle non-string input", () => {
      expect(sanitizeInput(123)).toBe("");
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
    });

    it("should limit length to 10000 characters", () => {
      const longString = "a".repeat(20000);
      expect(sanitizeInput(longString)).toHaveLength(10000);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject emails longer than 254 characters", () => {
      const longEmail = "a".repeat(250) + "@test.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidFormType", () => {
    it("should accept valid form types", () => {
      expect(isValidFormType("booking")).toBe(true);
      expect(isValidFormType("contact")).toBe(true);
      expect(isValidFormType("hub")).toBe(true);
    });

    it("should reject invalid form types", () => {
      expect(isValidFormType("invalid")).toBe(false);
      expect(isValidFormType("")).toBe(false);
      expect(isValidFormType(null)).toBe(false);
      expect(isValidFormType(123)).toBe(false);
    });
  });

  describe("validateContactForm - booking", () => {
    it("should validate valid booking form", () => {
      const result = validateContactForm("booking", {
        email: "promoter@example.com",
        promoter: "Test Promoter",
        eventType: "Festival",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.email).toBe("promoter@example.com");
    });

    it("should reject booking without valid email", () => {
      const result = validateContactForm("booking", {
        promoter: "Test Promoter",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Valid email is required");
    });

    it("should sanitize booking data", () => {
      const result = validateContactForm("booking", {
        email: "test@example.com",
        promoter: "<script>alert('xss')</script>",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.promoter).toContain("&lt;script&gt;");
    });
  });

  describe("validateContactForm - contact", () => {
    it("should validate valid contact form", () => {
      const result = validateContactForm("contact", {
        email: "user@example.com",
        name: "John Doe",
        message: "This is a test message with enough characters.",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.email).toBe("user@example.com");
    });

    it("should reject contact without valid email", () => {
      const result = validateContactForm("contact", {
        name: "John Doe",
        message: "Test message",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Valid email is required");
    });

    it("should reject contact with short name", () => {
      const result = validateContactForm("contact", {
        email: "user@example.com",
        name: "A",
        message: "Test message",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Name must be at least 2 characters");
    });

    it("should reject contact with short message", () => {
      const result = validateContactForm("contact", {
        email: "user@example.com",
        name: "John Doe",
        message: "Short",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Message must be at least 10 characters");
    });
  });

  describe("validateContactForm - hub", () => {
    it("should validate valid hub form", () => {
      const result = validateContactForm("hub", {
        email: "client@example.com",
        name: "Jane Smith",
        message: "This is a detailed inquiry about booking services.",
        inquiryType: "booking",
        company: "Test Corp",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.sanitizedData?.company).toBe("Test Corp");
    });

    it("should require email, name, and message", () => {
      const result = validateContactForm("hub", {
        company: "Test Corp",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should sanitize all hub fields", () => {
      const result = validateContactForm("hub", {
        email: "test@example.com",
        name: "Test User",
        message: "Valid message here",
        phone: "<script>alert('xss')</script>",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.phone).toContain("&lt;script&gt;");
    });
  });
});
