"use client";

import { notFound } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import Page from "@/app/timeline/page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound");
  }),
}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: {
    getState: jest.fn(() => ({ labsEnabled: false })),
  },
}));

describe("/timeline route guard", () => {
  it("calls notFound when labs is disabled", () => {
    expect(() => Page()).toThrow("notFound");
    expect(notFound).toHaveBeenCalled();
  });
});
