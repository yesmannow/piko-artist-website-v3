import React from "react";

const colorTokens = [
  { name: "--color-bg", value: "#050510" },
  { name: "--color-bg-elevated", value: "rgba(15, 15, 40, 0.9)" },
  { name: "--color-accent", value: "#4af2c5" },
  { name: "--color-stem-vocals", value: "#ff7ac4" },
  { name: "--color-stem-drums", value: "#ffd166" },
  { name: "--color-stem-bass", value: "#4dabff" },
  { name: "--color-stem-other", value: "#7cf29c" },
];

const motionTokens = [
  { name: "--motion-fast", value: "120ms" },
  { name: "--motion-med", value: "220ms" },
  { name: "--motion-slow", value: "380ms" },
  { name: "--ease-smooth", value: "cubic-bezier(0.22, 1, 0.36, 1)" },
  { name: "--ease-overshoot", value: "cubic-bezier(0.16, 1, 0.3, 1)" },
];

export default function DesignSystemPage() {
  return (
    <main className="ds-page">
      <h1>Piko Studio Design System</h1>

      <section>
        <h2>Foundations</h2>

        <h3>Colors</h3>
        <div className="ds-color-grid">
          {colorTokens.map((token) => (
            <div key={token.name} className="ds-color-swatch">
              <div className="ds-color-box" style={{ background: `var(${token.name})` }} />
              <div className="ds-color-meta">
                <code>{token.name}</code>
                <span>{token.value}</span>
              </div>
            </div>
          ))}
        </div>

        <h3>Typography</h3>
        <p>Body: system-ui, -apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif.</p>
        <p>Headers: var(--font-lexend) with uppercase and bold weight.</p>

        <h3>Spacing</h3>
        <p>Base unit: 4px. Common steps: 4, 8, 12, 16, 24, 32.</p>

        <h3>Radius and shadows</h3>
        <p>Use radius tokens for panels and buttons, and shadow-soft for elevation.</p>

        <h3>Motion tokens</h3>
        <ul className="ds-spec-grid">
          {motionTokens.map((token) => (
            <li key={token.name}>
              <code>{token.name}</code> {token.value}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Components</h2>
        <p>Buttons, toggles, sliders, panels, decks, waveforms, and stem controls.</p>
        <ul>
          <li>Buttons: .btn, .btn-primary, .btn-ghost</li>
          <li>Sliders: crossfader and transport ranges</li>
          <li>Panels: library drawer, FX panel, settings modal</li>
          <li>Decks: dual deck layout with focus mode on mobile</li>
          <li>Waveforms: main waveform plus per-stem waveforms</li>
          <li>Stem controls: generator, mute, solo, meters</li>
        </ul>
      </section>

      <section>
        <h2>Patterns</h2>
        <p>Control bar, Stem Mode panel, library, and settings patterns.</p>
        <ul>
          <li>Control bar stays fixed for fast transport access.</li>
          <li>Stem Mode opens the side panel with meters and controls.</li>
          <li>Library uses desktop drawer and mobile modal.</li>
          <li>Settings provide performance and visual controls.</li>
        </ul>
      </section>
    </main>
  );
}
