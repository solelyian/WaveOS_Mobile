// glass.ts — plaques de verre liquide rendues par le raster C++ (wavegfx).
// Le TS capture le wallpaper sous le panneau → le WASM réfracte/givre/fresnel
// → un <canvas> alimente le fond du panneau. Usage :
//   const g = await glass(el, { radius: 34, tint: [255,255,255], alpha: .10 });
//   g.canvas reçoit l'image ; g.refresh() la refait (panneau déplacé).
import { W } from "../wasm/bridge";

const GLASS_W = 400, GLASS_H = 850; // résolution du fond (taille phone)

let bgReady: Promise<HTMLImageElement> | null = null;

function wallpaper(): Promise<HTMLImageElement> {
  if (bgReady) return bgReady;
  bgReady = new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = (document.getElementById("wp")?.style.backgroundImage || "url(/img/wallpaper.jpg)")
      .replace(/^url\((['"]?)(.*)\1\)$/, "$2");
  });
  return bgReady;
}

/** Dessine le wallpaper dans le buffer g_bg du WASM (espace 400×850). */
function paintBg(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = GLASS_W; c.height = GLASS_H;
  const x = c.getContext("2d")!;
  const ir = img.width / img.height, pr = GLASS_W / GLASS_H;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > pr) { sw = sh * pr; sx = (img.width - sw) / 2; } else { sh = sw / pr; sy = (img.height - sh) / 2; }
  x.drawImage(img, sx, sy, sw, sh, 0, 0, GLASS_W, GLASS_H);
  const px = x.getImageData(0, 0, GLASS_W, GLASS_H).data;
  const api = W();
  new Uint8Array(api.memory.buffer, api.wg_bg_ptr(), px.length).set(px);
  api.wg_glass_set_bg(GLASS_W, GLASS_H);
}

export interface GlassOpts {
  radius: number;
  tint: [number, number, number];
  alpha: number;          // opacité du corps vitré
}

export interface GlassSurface {
  canvas: HTMLCanvasElement;
  refresh: () => Promise<void>;
}

/** Rend le panneau `el` en vrai verre liquide au-dessus du wallpaper. */
export async function glass(el: HTMLElement, o: GlassOpts): Promise<GlassSurface> {
  const img = await wallpaper();
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
    paintBg(img);
    const api = W();
    api.wg_glass_render(ox, oy, w, h, o.radius, o.tint[0], o.tint[1], o.tint[2], o.alpha);
    ctx.putImageData(new ImageData(new Uint8ClampedArray(api.memory.buffer, api.wg_out_ptr(), w * h * 4), w, h), 0, 0);
  };
  await refresh();
  return { canvas, refresh };
}
