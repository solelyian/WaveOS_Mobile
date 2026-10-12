// bridge.ts — charge waveos.wasm et expose son API typée.
export interface WasmApi {
  memory: WebAssembly.Memory;
  wc_spring_new(v0: number, k: number, d: number, m: number): number;
  wc_spring_free(id: number): void;
  wc_spring_set(id: number, v: number, vel: number): void;
  wc_spring_target(id: number, t: number): void;
  wc_spring_params(id: number, k: number, d: number, m: number): void;
  wc_spring_value(id: number): number;
  wc_spring_vel(id: number): number;
  wc_spring_settled(id: number): number;
  wc_tick(dt: number): void;
  wc_clamp(x: number, lo: number, hi: number): number;
  wc_lerp(a: number, b: number, t: number): number;
  wc_ease_out(t: number): number;
  wc_rubber(delta: number, dim: number, c: number): number;
  wc_project(x: number, v: number, decel: number): number;
  wc_scrim_tint(bgLum: number): number;
  wg_map_ptr(): number;
  wg_map_size(w: number, h: number): void;
  wg_map_render(): void;
  wg_bg_ptr(): number;
  wg_out_ptr(): number;
  wg_glass_set_bg(w: number, h: number): void;
  wg_glass_blur(radius: number): void;
  wg_glass_render(ox: number, oy: number, w: number, h: number, r: number,
                 tr: number, tg: number, tb: number, al: number): void;
  wg_glass_size(w: number, h: number): void;
  wg_glass_disp(w: number, h: number, r: number, amp: number, depth?: number): void;
  wg_glass_edge(w: number, h: number, r: number, depth?: number): void;
  wg_aqua_disp(w: number, h: number, r: number, depth: number, zoom: number): number;
  wg_aqua_edge(w: number, h: number, r: number, depth: number): number;
  wg_aqua_lens(w: number, h: number, r: number, depth: number, thickness: number,
               ior: number, zoom: number, padding: number): number;
  wg_aqua_reflection_ptr(): number;
  wg_aqua_relief_ptr(): number;
  wg_glyph_mask_ptr(): number;
  wg_glyph_edge_ptr(): number;
  wg_glyph_render(w: number, h: number, depth: number, pixelRatio: number): number;
  wg_aqua_glyph_render(w: number, h: number, depth: number, pixelRatio: number): number;
}

let wasm: WasmApi | null = null;

export async function loadWasm(): Promise<WasmApi> {
  if (wasm) return wasm;
  const res = await fetch("/waveos.wasm");
  const { instance } = await WebAssembly.instantiateStreaming(res, {});
  const ex = instance.exports as unknown as WasmApi & { memory: WebAssembly.Memory };
  wasm = ex;
  return ex;
}

export const W = () => {
  if (!wasm) throw new Error("wasm not loaded");
  return wasm;
};

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
