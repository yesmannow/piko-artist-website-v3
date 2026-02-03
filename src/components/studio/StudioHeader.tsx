import React, { useEffect } from 'react';

export const StudioHeader: React.FC = () => {
  useEffect(() => {
    if (globalThis.location.hostname === 'localhost') {
      const ws = new WebSocket('ws://localhost:8080');
      ws.onopen = () => console.log('WebSocket connected');
      ws.onclose = () => console.log('WebSocket disconnected');
      return () => ws.close();
    }
  }, []);

  return (
    <header className="bg-secondary p-4">
      <h1 className="text-xl font-bold">Studio Header</h1>
    </header>
  );
};
