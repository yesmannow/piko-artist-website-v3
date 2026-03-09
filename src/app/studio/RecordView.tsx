'use client';

/**
 * RecordView - Syndicate Vault Recording Deck
 *
 * Handles session capture with neon-red active indicators.
 */

const VAULT_MONO_FONT = 'var(--vault-font-mono)';
const VAULT_TEXT_FAINT = 'rgba(226,232,240,0.35)';

export function RecordView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 bg-[#0a0a0c]" style={{ color: VAULT_TEXT_FAINT }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '2px solid var(--vault-action-red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 16px rgba(244,63,94,0.3)',
      }}>
        <div
          className="animate-pulse"
          style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--vault-action-red)' }}
        />
      </div>
      <span style={{ fontFamily: VAULT_MONO_FONT, fontSize: '11px', letterSpacing: '0.15em' }}>
        RECORD MODULE — ACTIVE // STANDBY
      </span>
    </div>
  );
}
