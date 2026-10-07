// spring.ts — wrapper TS d'un ressort vivant dans la banque wavecore.
// La valeur et l'intégration restent en WASM ; ici on ne fait que lier.
import { w } from "./bridge";
import { tokens } from "../tokens.gen";

export type SpringPreset = keyof typeof tokens.spring;

export class Spring {
  private id: number;

  constructor(v0: number, preset: SpringPreset = "soft") {
    const p = tokens.spring[preset];
    this.id = w().wc_spring_new(v0, p.k, p.d);
    if (this.id < 0) throw new Error("banque de ressorts pleine (512 max)");
  }

  get v(): number { return w().wc_spring_value(this.id); }
  get vel(): number { return w().wc_spring_vel(this.id); }
  get settled(): boolean { return w().wc_spring_settled(this.id) !== 0; }

  /** Fixe valeur et vélocité (pendant un geste direct). */
  set(v: number, vel = 0): void { w().wc_spring_set(this.id, v, vel); }

  /** Anime vers la cible en conservant (ou injectant) la vélocité. */
  to(target: number, vel?: number): void {
    if (vel !== undefined) w().wc_spring_set(this.id, this.v, vel);
    w().wc_spring_target(this.id, target);
  }

  setPreset(preset: SpringPreset): void {
    const p = tokens.spring[preset];
    w().wc_spring_params(this.id, p.k, p.d);
  }

  /** Accélère le ressort (mode "réduire les animations" : tendu, sans overshoot). */
  setReduced(on: boolean): void {
    if (on) w().wc_spring_params(this.id, 420, 60);
    else this.setPreset("soft");
  }

  dispose(): void { w().wc_spring_free(this.id); }
}
