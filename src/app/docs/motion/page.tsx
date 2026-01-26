import React from "react";

export default function MotionPage() {
  return (
    <main className="ds-page">
      <h1>Piko Studio Motion Choreography</h1>

      <section>
        <h2>Motion tokens</h2>
        <ul>
          <li>
            <code>--motion-fast</code>: 120ms smooth for button presses and toggles.
          </li>
          <li>
            <code>--motion-med</code>: 220ms smooth for panel transitions and deck focus.
          </li>
          <li>
            <code>--motion-slow</code>: 380ms for mode changes and hero transitions.
          </li>
        </ul>
      </section>

      <section>
        <h2>Deck focus</h2>
        <p>
          When a deck enters focus mode on mobile, scale to 1.02 and elevate with shadow over
          <code> var(--motion-med)</code>. When leaving focus, return to 1.0 with the same timing.
        </p>
      </section>

      <section>
        <h2>Panels</h2>
        <p>
          Library drawer and FX panel slide in from the edge with <code>var(--motion-med)</code>
          using <code>var(--ease-smooth)</code>. Avoid bouncing or excessive overshoot.
        </p>
      </section>

      <section>
        <h2>Stem Mode</h2>
        <p>
          When Stem Mode is enabled, fade in stem controls and meters over <code>var(--motion-med)</code>.
          The toggle uses <code>var(--motion-fast)</code>.
        </p>
      </section>

      <section>
        <h2>Do and do not</h2>
        <ul>
          <li>Do: use consistent timing for similar interactions.</li>
          <li>Do: keep motion subtle and purposeful.</li>
          <li>Do not: animate every element constantly.</li>
          <li>Do not: use long, blocking animations for core actions.</li>
        </ul>
      </section>
    </main>
  );
}
