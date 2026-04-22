// Motion tokens. Single source of truth for every animated component.
// No inline durations or spring configs anywhere else in the codebase —
// import from here. See Pindr-MicroInteractions-Plan.md §3.

export const duration = {
  instant: 80,   // button press-in, tap feedback
  fast: 140,     // fades, stamp appearance, chip state
  base: 220,     // screen transitions, modals
  slow: 320,     // match moment phases, pull-to-refresh reset
  shimmer: 1200, // skeleton shimmer cycle
} as const;

// Reanimated withSpring config shape.
export const spring = {
  // Card snap-back, button release. Brisk and decisive.
  snap: { damping: 22, stiffness: 260, mass: 0.6 },
  // Most UI arrivals — chips, tabs, panels.
  settle: { damping: 20, stiffness: 180, mass: 1 },
  // Match moment, hero transitions — slower, meant to be felt.
  soft: { damping: 18, stiffness: 110, mass: 1 },
} as const;

// Cubic-bezier control points for withTiming easings. Use only when a
// spring isn't right (e.g. shimmer sweeps, pull refresh).
export const easing = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

export type DurationToken = keyof typeof duration;
export type SpringToken = keyof typeof spring;
export type EasingToken = keyof typeof easing;
