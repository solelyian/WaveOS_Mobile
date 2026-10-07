// bridge.ts — chargement et API typée de waveos.wasm (wavecore.c + wavegfx.cpp).
// Une seule instantiation ; toutes les fonctions natives passent par ici.

export interface WaveWasm {
  // mémoire linéaire partagée
  memory: WebAssembly.Memory;
  // wavecore — banque de ressorts
  wc_spring_new(v0: number, k: number, d: number): number;
  wc_spring_free(id: number): void;
  wc_spring_set(id: number, v: number, vel: number): void;
  wc_spring_target(id: number, t: number): void;
  wc_spring_params(id: number, k: number, d: number): void;
  wc_spring_value(id: number): number;
  wc_spring_vel(id: number): number;
  wc_spring_settled(id: number): number;
  wc_tick(dt: number): void;
  // wavecore — geste / easing
  wc_clamp(x: number, lo: number, hi: number): number;
  wc_lerp(a: number, b: number, t: number): number;
  wc_ease_out(t: number): number;
  wc_rubber(delta: number, dim: number, c: number): number;
  wc_project(x: number, v: number, decel: number): number;
  // wavecore — géométrie
  wc_superellipse_sdf(x: number, y: number, half: number, n: number): number;
  wc_superellipse_path(out: number, cap: number, half: number, n: number, samples: number): number;
  wc_scratch(): number;
  // wavecore — couleur
  wc_luminance(r: number, g: number, b: number): number;
  wc_contrast(l1: number, l2: number): number;
  wc_scrim_tint(bgLum: number): number;
  // wavegfx — wallpaper
  wg_bake_wallpaper(variant: number, w: number, h: number): number;
  wg_frame_ptr(): number;
  wg_frame_w(): number;
  wg_frame_h(): number;
  wg_luminance_region(x: number, y: number, w: number, h: number): number;
}

let wasm: WaveWasm | null = null;

export async function initWasm(): Promise<WaveWasm> {
  if (wasm) return wasm;
  const res = await fetch("/waveos.wasm");
  const bytes = await res.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  wasm = instance.exports as unknown as WaveWasm;
  return wasm;
}

export function w(): WaveWasm {
  if (!wasm) throw new Error("waveos.wasm non initialisé — appeler initWasm() d'abord");
  return wasm;
}

/** Vue Float32 du scratch natif (wc_superellipse_path y écrit ses points). */
export function scratchF32(): Float32Array {
  return new Float32Array(w().memory.buffer, w().wc_scratch(), 4096);
}
