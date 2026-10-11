// glass.ts — plaques de verre liquide : le raster C++ (wavegfx) calcule les
// effets optiques de bord (liseré fresnel, reflet spéculaire, ombre de masse)
// sur un <canvas> ; l'intérieur reste transparent et c'est le backdrop-filter
// natif de l'élément qui fournit le vrai fond réfracté (identique au sheet).
// Usage : const g = await glass(el, { radius: 34 });
//   g.canvas reçoit l'image ; g.refresh() la refait (panneau déplacé).
import { W } from "../wasm/bridge";

const GLASS_W = 400, GLASS_H = 850; // espace wallpaper (taille phone)

export interface GlassOpts {
  radius: number;
  tint?: [number, number, number]; // réservé (liseré)
  alpha?: number;                  // réservé
  backdropFilter?: string;         // réservé
}

export interface GlassSurface {
  canvas: HTMLCanvasElement;
  refresh: () => Promise<void>;
}

/** Rend le panneau `el` en vrai verre liquide au-dessus du backdrop. */
export async function glass(el: HTMLElement, o: GlassOpts): Promise<GlassSurface> {
  const canvas = document.createElement("canvas");
  canvas.className = "glx";
  const ctx = canvas.getContext("2d")!;

  const refresh = async () => {
    const r = el.getBoundingClientRect();
    const phone = document.getElementById("phone")!.getBoundingClientRect();
    // coordonnées du panneau dans l'espace wallpaper 400×850
    const kx = GLASS_W / phone.width, ky = GLASS_H / phone.height;
    const ox = (r.left - phone.left) * kx, oy = (r.top - phone.top) * ky;
    const w = Math.min(512, Math.max(8, Math.round(r.width * kx)));
    const h = Math.min(640, Math.max(8, Math.round(r.height * ky)));
    canvas.width = w; canvas.height = h;
    const api = W();
    api.wg_glass_render(ox, oy, w, h, o.radius, 255, 255, 255, 0);
    ctx.putImageData(new ImageData(new Uint8ClampedArray(api.memory.buffer, api.wg_out_ptr(), w * h * 4), w, h), 0, 0);
  };
  await refresh();
  return { canvas, refresh };
}
