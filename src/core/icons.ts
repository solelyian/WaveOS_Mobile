// icons.ts — tuiles squircle + glyphes Lucide.
// La silhouette de chaque icône est calculée par le natif : wc_superellipse_path
// écrit les points du contour n=4.6 dans le scratch WASM, on les convertit en
// path SVG. Les glyphes viennent de Lucide (ISC) — géométrie professionnelle,
// jamais de paths maison.
import { w, scratchF32 } from "../wasm/bridge";
import { svgEl } from "./el";
import { tokens } from "../tokens.gen";
import { lucide } from "./lucide";

let squircleD: string | null = null;

/** Path SVG de la tuile squircle n=4.6, calculé par wavecore (192 unités). */
export function squirclePath(): string {
  if (squircleD) return squircleD;
  const wasm = w();
  const n = wasm.wc_superellipse_path(wasm.wc_scratch(), 4096, 96, tokens.radius.squircleN, 96);
  const pts = scratchF32();
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(`${i ? "L" : "M"}${(pts[i * 2] + 96).toFixed(2)} ${(pts[i * 2 + 1] + 96).toFixed(2)}`);
  }
  squircleD = parts.join(" ") + " Z";
  return squircleD;
}

// ---- correspondance glyphe → nom Lucide ----
const LU = {
  settings: "settings", messages: "message-square", photos: "image", clock: "clock",
  weather: "cloud-sun", maps: "map-pin", notes: "notebook-text", reminders: "check-circle",
  store: "shopping-bag", music: "music", calc: "calculator", camera: "camera",
  mail: "mail", files: "folder", health: "heart-pulse", phone: "phone",
  compass: "compass", wallet: "wallet", stocks: "chart-line",
  wifi: "wifi", bluetooth: "bluetooth", airplane: "plane", moon: "moon",
  flashlight: "flashlight", rotation: "rotate-cw", sun: "sun", volume: "volume-2",
  play: "play", pause: "pause", next: "skip-forward", prev: "skip-back",
  chevronR: "chevron-right", chevronL: "chevron-left", x: "x", plus: "plus",
  minus: "minus", search: "search", bell: "bell", lockOri: "lock", timer: "timer",
  battery: "battery-full", cellular: "signal-high", earpiece: "speaker",
} as const;

export type GlyphName = keyof typeof LU;

/** Glyphe Lucide autonome (stroke currentColor, viewBox 24). */
export function glyph(name: GlyphName, cls = ""): SVGElement {
  return lucide(LU[name], cls);
}

/** Tuile d'icône : squircle à dégradé + glyphe Lucide centré. */
export function appIcon(id: string, glyphName: GlyphName, c0: string, c1: string, size = 60, ink = "rgba(255,255,255,0.94)"): HTMLElement {
  const gid = `g-${id}`;
  const svg = svgEl("svg", { viewBox: "0 0 192 192", class: "icon-tile", width: size, height: size, "aria-hidden": "true" });
  const defs = svgEl("defs");
  const lg = svgEl("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0.7", y2: "1" });
  lg.append(svgEl("stop", { offset: "0", "stop-color": c0 }), svgEl("stop", { offset: "1", "stop-color": c1 }));
  defs.append(lg);
  const clip = svgEl("clipPath", { id: `c-${id}` });
  clip.append(svgEl("path", { d: squirclePath() }));
  defs.append(clip);
  svg.append(defs);
  svg.append(svgEl("path", { d: squirclePath(), fill: `url(#${gid})` }));
  // spéculaire haut + rim bas — finition verre
  svg.append(svgEl("ellipse", { cx: 96, cy: 34, rx: 78, ry: 42, fill: "rgba(255,255,255,0.20)", "clip-path": `url(#c-${id})` }));
  // NB : pas de clip-path sur le <g> — sur un groupe transformé, Chrome
  // évalue le clip dans l'espace local et coupe le glyphe.
  const g = svgEl("g", { transform: "translate(52 52) scale(3.67)", style: `color:${ink}` });
  const inner = lucide(LU[glyphName]) as unknown as SVGSVGElement;
  inner.setAttribute("width", "24");
  inner.setAttribute("height", "24");
  g.append(inner);
  svg.append(g);
  const wrap = document.createElement("div");
  wrap.className = "icon";
  wrap.append(svg);
  return wrap;
}

// Alias de compatibilité : G[names] donnait des paths, il donne le nom Lucide.
export const G = LU;
