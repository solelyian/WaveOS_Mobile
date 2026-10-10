// motion.ts — ressorts physiques exécutés dans le moteur C (wavecore.c).
// Une seule boucle RAF appelle wc_tick(dt) ; chaque Spring lit sa valeur.
import { W } from "../wasm/bridge";
import { tokens } from "../tokens.gen";

export type SpringPreset = keyof typeof tokens.spring;

export class Spring {
  id: number;
  private dead = false;
  constructor(v0: number, preset: SpringPreset) {
    const p = tokens.spring[preset];
    this.id = W().wc_spring_new(v0, p.k, p.d, p.m);
  }
  get v() { return W().wc_spring_value(this.id); }
  get vel() { return W().wc_spring_vel(this.id); }
  /** Épingle : valeur ET cible (aucun retour élastique surprise). */
  set(v: number, vel = 0) { W().wc_spring_set(this.id, v, vel); }
  to(t: number) { W().wc_spring_target(this.id, t); }
  settled() { return W().wc_spring_settled(this.id) !== 0; }
  free() {
    if (!this.dead) { W().wc_spring_free(this.id); this.dead = true; }
  }
}

export const tick = (dt: number) => W().wc_tick(dt);

/** Petite tween à temps fixe pour les fondues/opacités (pas un ressort). */
const tws: { el: number; dur: number; from: number; to: number; fn: (v: number) => void; done?: () => void }[] = [];
let clock = 0;
export function tween(durMs: number, fn: (v: number) => void, opts?: { from?: number; to?: number; done?: () => void; delayMs?: number }) {
  tws.push({ el: -(opts?.delayMs ?? 0), dur: durMs, from: opts?.from ?? 0, to: opts?.to ?? 1, fn, done: opts?.done });
}
export function tickTweens(dtMs: number) {
  clock += dtMs;
  for (let i = tws.length - 1; i >= 0; i--) {
    const t = tws[i];
    t.el += dtMs;
    if (t.el < 0) continue;
    const k = Math.min(1, t.el / t.dur);
    const e = 1 - (1 - k) * (1 - k) * (1 - k); // ease-out cubic
    t.fn(t.from + (t.to - t.from) * e);
    if (k >= 1) { tws.splice(i, 1); t.done?.(); }
  }
}
