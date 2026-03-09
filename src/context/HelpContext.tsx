"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HelpContextType {
  isHelpMode: boolean;
  toggleHelp: () => void;
  triggerTour: () => void; // New function
  tourTrigger: number; // Increment this to signal a restart
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [tourTrigger, setTourTrigger] = useState(0);

  const toggleHelp = () => {
    setIsHelpMode((prev) => !prev);
  };

  const triggerTour = () => {
    setTourTrigger((prev) => prev + 1);
  };

  return (
    <HelpContext.Provider value={{ isHelpMode, toggleHelp, triggerTour, tourTrigger }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error("useHelp must be used within a HelpProvider");
  }
  return context;
}

