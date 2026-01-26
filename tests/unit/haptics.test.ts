import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { haptic } from "@/utils/haptics";

describe("haptics", () => {
  const originalVibrate = navigator.vibrate;

  beforeEach(() => {
    // Mock vibrate
    (navigator as any).vibrate = vi.fn();
  });

  afterEach(() => {
    (navigator as any).vibrate = originalVibrate;
  });

  it("calls vibrate with weak pattern", () => {
    haptic("weak");
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it("calls vibrate with medium pattern", () => {
    haptic("medium");
    expect(navigator.vibrate).toHaveBeenCalledWith([20, 10, 20]);
  });

  it("calls vibrate with strong pattern", () => {
    haptic("strong");
    expect(navigator.vibrate).toHaveBeenCalledWith([30, 20, 30, 20, 30]);
  });

  it("defaults to weak if no type provided", () => {
    haptic();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it("handles missing vibrate gracefully", () => {
    delete (navigator as any).vibrate;
    expect(() => haptic("weak")).not.toThrow();
  });
});
