// icons.ts — tuiles squircle + glyphes encre.
// La silhouette de chaque icône est calculée par le natif : wc_superellipse_path
// écrit les points du contour n=4.6 dans le scratch WASM, on les convertit en
// path SVG. Le glyph est un tracé stroke 24×24 (style encre, type Lucide).
import { w, scratchF32 } from "../wasm/bridge";
import { svgEl } from "./el";
import { tokens } from "../tokens.gen";

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

/** Tuile d'icône : squircle à dégradé + glyphe encre centré. */
export function appIcon(id: string, glyph: string[], c0: string, c1: string, size = 60, ink = "rgba(255,255,255,0.94)"): HTMLElement {
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
  // NB : pas de clip-path ici — sur un <g> transformé, Chrome évalue le clip
  // dans l'espace local et coupe le glyphe. Le glyphe (48..144) tient dans
  // la tuile (squircle 0..192) sans clipping.
  const g = svgEl("g", { transform: "translate(48 48) scale(4)" });
  const glyphG = svgEl("g", { fill: "none", stroke: ink, "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round" });
  for (const d of glyph) glyphG.append(svgEl("path", { d }));
  g.append(glyphG);
  svg.append(g);
  const wrap = document.createElement("div");
  wrap.className = "icon";
  wrap.append(svg);
  return wrap;
}

// ---- bibliothèque de glyphes 24×24 (stroke, encre) ----
export const G = {
  settings:  ["M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", "M12 2.8v3M12 18.2v3M21.2 12h-3M5.8 12h-3M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1M18.5 18.5l-2.1-2.1M7.6 7.6 5.5 5.5"],
  messages:  ["M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3H9.5L5 20.5v-3.4a3 3 0 0 1-1-2.3z"],
  photos:    ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M21 15.5l-5-5L6.5 20"],
  clock:     ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7.5V12l3.2 2"],
  weather:   ["M7 18.5a4.5 4.5 0 0 1-.9-8.9A5.5 5.5 0 0 1 16.7 8 4 4 0 0 1 18 18.5z"],
  maps:      ["M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z", "M12 13a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"],
  notes:     ["M6 3h12a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 6 3z", "M9 8h6M9 12h6M9 16h4"],
  reminders: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z", "M8.5 12.3l2.4 2.4 4.6-5"],
  store:     ["M4.5 7.5 5.8 4h12.4l1.3 3.5M4.5 7.5h15V17a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17z", "M9 11a3 3 0 0 0 6 0"],
  music:     ["M8.5 18.5a3 3 0 1 1-3-3 3 3 0 0 1 3 3z", "M21 16.5a3 3 0 1 1-3-3 3 3 0 0 1 3 3z", "M8.5 18.5V6.8L21 5v11.5"],
  calc:      ["M6 3.5h12A2.5 2.5 0 0 1 20.5 6v12a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5z", "M8.5 8h7", "M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 16h.01M12 16h.01M15.5 16h.01"],
  camera:    ["M4 8.5h2.8l1.4-2.3h7.6l1.4 2.3H20a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z", "M12 16.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z"],
  mail:      ["M4 5.5h16A1.5 1.5 0 0 1 21.5 7v10a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5z", "M3 7.5l9 6.5 9-6.5"],
  files:     ["M4 6a2 2 0 0 1 2-2h3.5L11.8 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"],
  health:    ["M12 20s-7.2-4.7-9.2-9.2C1.4 7.7 3.2 4 6.8 4c2.1 0 3.6 1.1 5.2 2.8C13.6 5.1 15.1 4 17.2 4c3.6 0 5.4 3.7 4 6.8C19.2 15.3 12 20 12 20z"],
  phone:     ["M5.5 3.5h2.6l1.4 4-1.9 1.4a13.5 13.5 0 0 0 6.5 6.5l1.4-1.9 4 1.4v2.6a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3.5 5.6a2 2 0 0 1 2-2.1z"],
  compass:   ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z"],
  wallet:    ["M4 7h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7z", "M2.5 10h19M6 15h4"],
  stocks:    ["M4 4.5V19a1 1 0 0 0 1 1h14.5", "M5 15l5-5 3.5 3.5L20 7", "M16.5 7H20v3.5"],
  // système / centre de contrôle
  wifi:      ["M4.5 10.5a11 11 0 0 1 15 0M7.5 14a6.5 6.5 0 0 1 9 0M10.4 17.4a2.4 2.4 0 0 1 3.2 0", "M12 20.2h.01"],
  bluetooth: ["M6.5 7l11 10-5.5 4V3l5.5 4-11 10"],
  airplane:  ["M10.5 13.5 3 11l1.5-2 6 .5L15 4.5A2.1 2.1 0 0 1 18.5 7L14 13.5l.5 6-2 1.5-2-7.5z"],
  moon:      ["M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"],
  flashlight:["M9 3h6l-.5 6.5a4 4 0 0 1-5 0z", "M12 9.5V21", "M9.5 13.5h5"],
  rotation:  ["M4 10a8 8 0 0 1 14.9-3", "M19 4v4h-4", "M20 14a8 8 0 0 1-14.9 3", "M5 20v-4h4"],
  sun:       ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2.5V5M12 19v2.5M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1M21.5 12H19M5 12H2.5"],
  volume:    ["M4 9.5v5h3.5L12 19V5L7.5 9.5z", "M15.5 9a4.3 4.3 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"],
  play:      ["M7 4.5l13 7.5-13 7.5z"],
  pause:     ["M7 4.5v15M17 4.5v15"],
  next:      ["M5.5 4.5l10 7.5-10 7.5z", "M18.5 4.5v15"],
  prev:      ["M18.5 4.5l-10 7.5 10 7.5z", "M5.5 4.5v15"],
  chevronR:  ["M9 5l7 7-7 7"],
  chevronL:  ["M15 5l-7 7 7 7"],
  x:         ["M5.5 5.5l13 13M18.5 5.5l-13 13"],
  plus:      ["M12 5v14M5 12h14"],
  minus:     ["M5 12h14"],
  search:    ["M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z", "M15.5 15.5 21 21"],
  bell:      ["M18 9.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15.5 18 9.5z", "M10 20a2.2 2.2 0 0 0 4 0"],
  lockOri:   ["M7 11V8a5 5 0 0 1 10 0v3", "M5.5 11h13v9h-13z"],
  timer:     ["M12 8.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M12 12.5V16l2.5 1.5", "M9.5 2.5h5"],
  battery:   ["M3 8.5h15a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 18 15.5H3A1.5 1.5 0 0 1 1.5 14v-4A1.5 1.5 0 0 1 3 8.5z", "M22 10.5v3", "M4 10.5v3h7v-3z"],
  cellular:  ["M4 18.5v-3M8.5 18.5v-6M13 18.5v-9M17.5 18.5v-12M21 18.5h.01"],
  earpiece:  ["M6 4.5a7.5 7.5 0 0 1 12 0", "M8.5 8a4 4 0 0 1 7 0", "M5 12.5c0 4 3.5 7 7 7s7-3 7-7"],
} as const;

export type GlyphName = keyof typeof G;

export function glyph(name: GlyphName, cls = ""): SVGSVGElement {
  const s = svgEl("svg", { viewBox: "0 0 24 24", class: `glyph ${cls}`, fill: "none" });
  for (const d of G[name]) s.append(svgEl("path", { d }));
  return s;
}
