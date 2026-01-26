"use client";

import React from "react";
import { useResponsiveVariant } from "@/hooks/useResponsiveVariant";
import type { DeckProps } from "@/components/deck/types";
import { DeckDesktop } from "@/components/deck/DeckDesktop";
import { DeckTablet } from "@/components/deck/DeckTablet";
import { DeckMobile } from "@/components/deck/DeckMobile";

export function DeckWrapper(props: Omit<DeckProps, "variant">) {
  const variant = useResponsiveVariant();
  const deckProps = { ...props, variant };

  if (variant === "mobile") return <DeckMobile {...deckProps} />;
  if (variant === "tablet") return <DeckTablet {...deckProps} />;
  return <DeckDesktop {...deckProps} />;
}
