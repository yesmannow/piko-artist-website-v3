"use client";

import { render } from "@testing-library/react";
import { SuggestedTracksModal } from "@/components/SuggestedTracksModal";

describe("SuggestedTracksModal", () => {
  it("renders without crashing", () => {
    render(
      <SuggestedTracksModal open suggestions={[]} onClose={() => {}} />,
    );
  });
});
