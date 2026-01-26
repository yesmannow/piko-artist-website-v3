import React from 'react';

export function PadMenu({ onDeleteCue, onSetLoop, onToggleQuantize }: { onDeleteCue: () => void; onSetLoop: () => void; onToggleQuantize: () => void; }) {
  return (
    <div className="pad-menu" role="menu" style={{ background: 'var(--panel-bg)', padding: 8, borderRadius: 8 }}>
      <button role="menuitem" onClick={onDeleteCue}>Delete Cue</button>
      <button role="menuitem" onClick={onSetLoop}>Set Loop</button>
      <button role="menuitem" onClick={onToggleQuantize}>Toggle Quantize</button>
    </div>
  );
}
