"use client";

import { render } from "@testing-library/react";
import { TacticalBar } from "@/components/navigation/TacticalBar";

describe("TacticalBar", () => {
  it("renders without crashing", () => {
    render(<TacticalBar />);
  });
});
