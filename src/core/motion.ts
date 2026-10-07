// motion.ts — boucle unique : un rAF, un wc_tick(dt), puis chaque abonné lit
// ses ressorts et écrit des transforms. Jamais de layout pendant une animation :
// uniquement transform / opacity / clip-path.
import { w } from "../wasm/bridge";
import { tokens } from "../tokens.gen";

export type Updater = (dt: number) => void;

const updaters = new Set<Updater>();
let last = 0;
let running = false;
let reduced = false;

function frame(now: number): void {
  const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 0.05);
  last = now;
  w().wc_tick(reduced ? dt * 1.6 : dt); // reduced-motion : ressorts plus rapides
  for (const u of updaters) u(dt);
  requestAnimationFrame(frame);
}

export const motion = {
  /** Enregistre un lecteur de frame (retourne la fonction de désabonnement). */
  every(u: Updater): () => void {
    updaters.add(u);
    if (!running) { running = true; requestAnimationFrame(frame); }
    return () => updaters.delete(u);
  },

  /** prefers-reduced-motion + réglage système (Réglages → Accessibilité). */
  setReduced(on: boolean): void { reduced = on; },
  get reduced(): boolean { return reduced; },

  // ---- helpers geste (délègués au natif) ----
  clamp: (x: number, lo: number, hi: number) => w().wc_clamp(x, lo, hi),
  lerp: (a: number, b: number, t: number) => w().wc_lerp(a, b, t),
  easeOut: (t: number) => w().wc_ease_out(t),
  rubber: (d: number, dim: number) => w().wc_rubber(d, dim, tokens.duration.rubber),
  project: (x: number, v: number) => w().wc_project(x, v, 2200),
};
