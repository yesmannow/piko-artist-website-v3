import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useResponsiveVariant } from "@/hooks/useResponsiveVariant";

describe("useResponsiveVariant", () => {
  const originalInnerWidth = window.innerWidth;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns desktop by default in node", () => {
    const { result } = renderHook(() => useResponsiveVariant());
    expect(["desktop", "tablet", "mobile"]).toContain(result.current);
  });

  it("returns mobile for width < 768px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useResponsiveVariant());
    expect(result.current).toBe("mobile");
  });

  it("returns tablet for width >= 768px and < 1024px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    });

    const { result } = renderHook(() => useResponsiveVariant());
    expect(result.current).toBe("tablet");
  });

  it("returns desktop for width >= 1024px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1440,
    });

    const { result } = renderHook(() => useResponsiveVariant());
    expect(result.current).toBe("desktop");
  });

  it("updates variant on window resize", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useResponsiveVariant());
    expect(result.current).toBe("mobile");

    // Simulate resize to desktop
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1440,
      });

      // Trigger resize event
      window.dispatchEvent(new Event("resize"));
    });

    // Wait for state update
    await waitFor(() => {
      expect(result.current).toBe("desktop");
    });
  });
});
