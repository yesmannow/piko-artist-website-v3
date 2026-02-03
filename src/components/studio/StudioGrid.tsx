import React, { ReactNode } from 'react';

type StudioGridProps = {
  children: ReactNode;
};

export const StudioGrid: React.FC<StudioGridProps> = ({ children }) => {
  return (
    <div
      className="grid grid-rows-[120px_1fr_300px] h-screen overflow-hidden bg-black text-white"
    >
      {children}
    </div>
  );
};
