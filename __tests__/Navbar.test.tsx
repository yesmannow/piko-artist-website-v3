"use client";

import { render } from "@testing-library/react";
import { NavBar } from "@/components/layout/NavBar";

describe("NavBar", () => {
  it("renders without crashing", () => {
    render(<NavBar />);
  });
});
