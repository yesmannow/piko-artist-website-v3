import React from "react";

type ComponentSpec = {
  name: string;
  description: string;
  props: { name: string; type: string; description: string }[];
  states: string[];
  variants?: string[];
};

const specs: ComponentSpec[] = [
  {
    name: "Button",
    description: "Primary interactive element used across Studio.",
    props: [
      { name: "variant", type: '"primary" | "ghost"', description: "Visual style." },
      { name: "size", type: '"sm" | "md"', description: "Size variant." },
    ],
    states: ["default", "hover", "active", "disabled", "focus-visible"],
    variants: ["primary", "ghost"],
  },
  {
    name: "StudioControlBar",
    description: "Persistent control bar with transport, crossfader, and mode toggles.",
    props: [],
    states: ["default", "compact (mobile)", "expanded (desktop)"],
  },
  {
    name: "Deck",
    description: "Deck surface for playback, jog wheel, and track status.",
    props: [
      { name: "deckId", type: '"A" | "B"', description: "Deck identifier." },
      { name: "showMiniWaveform", type: "boolean", description: "Render mini waveform under deck." },
    ],
    states: ["idle", "loading", "playing", "focused (mobile)"],
  },
  {
    name: "MainWaveform",
    description: "Primary waveform renderer with scrub support.",
    props: [
      { name: "deckId", type: '"A" | "B"', description: "Deck identifier." },
      { name: "url", type: "string | undefined", description: "Track URL." },
    ],
    states: ["idle", "loading", "ready", "scrubbing"],
  },
  {
    name: "StemControls",
    description: "Mute and solo controls for stems.",
    props: [
      { name: "deckId", type: '"A" | "B"', description: "Deck identifier." },
    ],
    states: ["disabled", "ready", "muted", "solo"],
  },
  {
    name: "StemGenerator",
    description: "Triggers stem separation worker for the focused deck.",
    props: [],
    states: ["idle", "loading", "ready"],
  },
  {
    name: "LibraryDrawer",
    description: "Track browser with filters and load actions.",
    props: [
      { name: "isOpen", type: "boolean", description: "Controls visibility." },
      { name: "inline", type: "boolean", description: "Use inline layout on desktop." },
    ],
    states: ["closed", "open", "empty"],
  },
  {
    name: "StudioSettingsPanel",
    description: "Settings modal for performance and visuals.",
    props: [],
    states: ["closed", "open"],
  },
];

export default function ComponentsSpecPage() {
  return (
    <main className="ds-page">
      <h1>Piko Studio Component Spec</h1>
      {specs.map((spec) => (
        <section key={spec.name}>
          <h2>{spec.name}</h2>
          <p>{spec.description}</p>

          {spec.props.length > 0 && (
            <>
              <h3>Props</h3>
              <ul className="ds-spec-grid">
                {spec.props.map((prop) => (
                  <li key={prop.name}>
                    <code>{prop.name}</code>: <code>{prop.type}</code> - {prop.description}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>States</h3>
          <ul>
            {spec.states.map((state) => (
              <li key={state}>{state}</li>
            ))}
          </ul>

          {spec.variants && (
            <>
              <h3>Variants</h3>
              <ul>
                {spec.variants.map((variant) => (
                  <li key={variant}>{variant}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      ))}
    </main>
  );
}
