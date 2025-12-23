"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HelpContextType {
  isHelpMode: boolean;
  toggleHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isHelpMode, setIsHelpMode] = useState(false);

  const toggleHelp = () => {
    setIsHelpMode((prev) => !prev);
  };

  return (
    <HelpContext.Provider value={{ isHelpMode, toggleHelp }}>
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

