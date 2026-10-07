// wallpaper.ts — le fond d'écran « Rubans » / « Aube », calculé par wavegfx.cpp
// en WASM (capsules lumineuses, flou séparable, vignette, grain) et peint UNE
// fois sur un canvas 2×. Zéro coût par frame ensuite : le compositing reste GPU.
import { w } from "../wasm/bridge";
import { on, sys } from "../system/state";
import { motion } from "../core/motion";

const SCALE = 2; // 786×1704 pixels rendus pour 393×852 logiques

export class Wallpaper {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private variant = -1;
  private px = 0; private py = 0; // parallaxe spatiale (−0.5…0.5)

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = 393 * SCALE;
    this.canvas.height = 852 * SCALE;
    this.ctx = canvas.getContext("2d")!;
    on("wallpaper", () => this.bake());
    on("theme", () => this.bake()); // thème clair ⇒ variante Aube si non choisie
    on("brightness", (v) => {
      this.canvas.style.filter = `brightness(${0.55 + v * 0.55})`;
    });
    this.canvas.style.filter = `brightness(${0.55 + sys.brightness * 0.55})`;
  }

  /** Rebake depuis le frame buffer natif. ~50–90 ms, fait au changement seulement. */
  bake(): void {
    const wanted = sys.wallpaper;
    if (wanted === this.variant) return;
    this.variant = wanted;
    const wasm = w();
    wasm.wg_bake_wallpaper(wanted, 393 * SCALE, 852 * SCALE);
    const wpx = wasm.wg_frame_w(), hpx = wasm.wg_frame_h();
    const ptr = wasm.wg_frame_ptr();
    const src = new Uint8ClampedArray(wasm.memory.buffer, ptr, wpx * hpx * 4);
    this.ctx.putImageData(new ImageData(src.slice(), wpx, hpx), 0, 0);
  }

  /** Luminance mesurée d'une zone logique (0–1) — alimente le scrim adaptatif. */
  luminanceRegion(x: number, y: number, ww: number, h: number): number {
    return w().wg_luminance_region(x * SCALE, y * SCALE, ww * SCALE, h * SCALE);
  }

  /** Parallaxe spatiale « 3D wallpaper » : la scène glisse contre le pointeur. */
  setParallax(nx: number, ny: number): void { this.px = nx; this.py = ny; }

  /** Parallaxe légère pendant les transitions (dézoom à l'ouverture des sheets). */
  render(openAmount: number): void {
    const s = 1.04 - motion.clamp(openAmount, 0, 1) * 0.04;
    this.canvas.style.transform = `translate(${this.px * 9}px, ${this.py * 9}px) scale(${s})`;
  }
}
