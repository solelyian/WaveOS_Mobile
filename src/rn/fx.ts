// fx.ts — pont RN↔DOM : accès élément, boucle RAF unique, helpers verre.
// La couche animation reprend les mêmes maths que le moteur C (springs).
import * as React from "react";
import type { View } from "react-native";

export type El = HTMLElement | null;
export const domOf = (r: React.RefObject<View | null>): El =>
  (r?.current as unknown as HTMLElement | null) ?? null;

const subs = new Set<(dt: number) => void>();
let last = 0, running = false;
function tick(t: number) {
  const dt = last ? Math.min(0.032, (t - last) / 1000) : 0.016;
  last = t;
  subs.forEach((f) => f(dt));
  requestAnimationFrame(tick);
}
export function onFrame(f: (dt: number) => void) {
  subs.add(f);
  if (!running) { running = true; requestAnimationFrame(tick); }
  return () => subs.delete(f);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Spring — mêmes presets que tokens/motion (stiffness, damping, mass=1)
export class Spring {
  v: number; vel = 0; target: number;
  k: number; c: number;
  constructor(v = 0, k = 300, c = 26, target?: number) {
    this.v = v; this.k = k; this.c = c; this.target = target ?? v;
  }
  to(t: number) { this.target = t; }
  set(v: number) { this.v = v; this.target = v; this.vel = 0; }
  get settled() { return Math.abs(this.v - this.target) < 0.002 && Math.abs(this.vel) < 0.01; }
  step(dt: number) {
    if (this.settled) { this.v = this.target; this.vel = 0; return; }
    this.vel += (-this.k * (this.v - this.target) - this.c * this.vel) * dt;
    this.v += this.vel * dt;
  }
}
export const SPRINGS = {
  morph: [300, 26] as const,
  shade: [260, 30] as const,
  island: [380, 30] as const,
  snap: [500, 34] as const,
};

// Verre clair — mêmes paramètres que le blur/saturate web.
export const glassStyle = (alpha = 0.16, extra: Record<string, string> = {}) => ({
  backgroundColor: `rgba(255,255,255,${alpha})`,
  borderColor: "rgba(255,255,255,0.28)",
  borderWidth: 1,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
  ...extra,
} as const);

export function tween(ms: number, fn: (v: number) => void, done?: () => void) {
  const t0 = performance.now();
  const off = onFrame(() => {
    const v = Math.min(1, (performance.now() - t0) / ms);
    const e = 1 - Math.pow(1 - v, 3); // easeOutCubic
    fn(e);
    if (v >= 1) { off(); done?.(); }
  });
}

/** Spread sur un View → attribut data-lg (RNW mappe dataSet vers data-*).
 *  Type forçé : les defs RNW 0.21 omettent dataSet. */
export const lg: Record<string, unknown> = { dataSet: { lg: "" } };
