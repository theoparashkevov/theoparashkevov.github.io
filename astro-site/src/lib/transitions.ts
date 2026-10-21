import type { TransitionAnimationPair, TransitionDirectionalAnimations } from 'astro';

/*
 * View-transition animations for `transition:animate`. The keyframes they
 * reference (vt-rise-*, vt-sink-*) live in src/styles/animations.css.
 */

export const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

export interface RiseOptions {
  duration?: number | string;
}

function pair(out: string, enter: string, duration: number | string): TransitionAnimationPair {
  return {
    old: { name: out, duration, easing: EASE_OUT_EXPO, fillMode: 'both' },
    new: { name: enter, duration, easing: EASE_OUT_EXPO, fillMode: 'both' },
  };
}

/**
 * Fade plus a small vertical shift. Forward navigation lifts the old page up
 * and brings the new one up from below; back navigation reverses the motion.
 */
export function rise({ duration = 420 }: RiseOptions = {}): TransitionDirectionalAnimations {
  return {
    forwards: pair('vt-rise-out', 'vt-rise-in', duration),
    backwards: pair('vt-sink-out', 'vt-sink-in', duration),
  };
}

/** Shared-element kinds produced by transitionName() in src/lib/posts.ts. */
export const MORPH_KINDS = ['title', 'hero', 'meta', 'card'] as const;
export type MorphKind = (typeof MORPH_KINDS)[number];

/** Maps a view-transition-name such as `post-hero-foo` to its view-transition-class (`post-hero`). */
export function morphClass(name: string): `post-${MorphKind}` | undefined {
  for (const kind of MORPH_KINDS) {
    if (name.startsWith(`post-${kind}-`)) return `post-${kind}`;
  }
  return undefined;
}
