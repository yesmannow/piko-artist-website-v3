'use client';

/**
 * ExportView - Syndicate Vault Export Center
 *
 * Handles recording exports and metadata embedding.
 */

const VAULT_MONO_FONT = 'var(--vault-font-mono)';
const VAULT_TEXT_FAINT = 'rgba(226,232,240,0.35)';

export function ExportView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 bg-[#0a0a0c]" style={{ color: VAULT_TEXT_FAINT }}>
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span style={{ fontFamily: VAULT_MONO_FONT, fontSize: '11px', letterSpacing: '0.15em' }}>
        EXPORT MODULE — READY // STANDBY
      </span>
    </div>
  );
}
