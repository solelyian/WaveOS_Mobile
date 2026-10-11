// glass.ts — moteur Liquid Glass : vraie réfraction du fond.
//
// Référence Apple (iOS 26) : le verre n'est pas un simple flou — le contenu
// se courbe près des bords (lentille), un liseré spéculaire épouse le
// contour éclairé depuis le haut-gauche, et le corps reste quasi incolore.
//
// Pipeline par élément (backdrop réel, aucun snapshot) :
//   1. le raster C++ (wg_glass_disp) produit la carte de déplacement —
//      normales sortantes du SDF arrondi × profil de lentille — et la
//      silhouette alpha (height-field pour l'éclairage) ;
//   2. un <filter> SVG par forme (w×h×rayon) est injecté dans les <defs> :
//      feGaussianBlur → feDisplacementMap (lentille de bord) → feColorMatrix
//      (saturation) → feSpecularLighting sur la silhouette (liseré qui
//      suit le contour, lumière haut-gauche) ;
//   3. backdrop-filter: url(#lg-*) applique le tout sur le vrai fond.
//
// Usage : await liquidGlass(el, { scale: 16 })  — el reçoit le filtre ;
// liquidGlassAll(root) balaie les surfaces glass connues.
import { W, loadWasm } from "../wasm/bridge";

const SVGNS = "http://www.w3.org/2000/svg";
let defs: SVGDefsElement | null = null;
const mapCache = new Map<string, string>();      // "w-h-r-a" -> dataURL
const filterCache = new Set<string>();           // ids injectés

function ensureDefs(): SVGDefsElement {
  if (defs && defs.isConnected) return defs;
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.setAttribute("aria-hidden", "true");
  defs = document.createElementNS(SVGNS, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

/** Carte de déplacement RGBA rendue par le moteur C++ → dataURL PNG. */
function dispMap(w: number, h: number, r: number, amp: number): string {
  const key = `${w}-${h}-${r.toFixed(1)}-${amp.toFixed(2)}`;
  const hit = mapCache.get(key);
  if (hit) return hit;
  const api = W();
  api.wg_glass_disp(w, h, r, amp);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cx = c.getContext("2d")!;
  cx.putImageData(
    new ImageData(new Uint8ClampedArray(api.memory.buffer, api.wg_out_ptr(), w * h * 4), w, h), 0, 0);
  const url = c.toDataURL("image/png");
  mapCache.set(key, url);
  return url;
}

export interface LGOpts {
  /** rayon des coins en px (défaut : border-radius calculé de l'élément) */
  radius?: number;
  /** amplitude de la lentille 0..1 (défaut .8) */
  amp?: number;
  /** déplacement max en px = scale du feDisplacementMap (défaut 18) */
  scale?: number;
  /** flou du givre en px (défaut 6) */
  blur?: number;
  /** saturation du fond (défaut 1.5) */
  saturate?: number;
  /** intensité du liseré spéculaire 0..1 (défaut .85) */
  spec?: number;
}

/** Applique le vrai liquid glass à `el` (son backdrop est réfracté). */
export async function liquidGlass(el: HTMLElement, o: LGOpts = {}): Promise<void> {
  await loadWasm();
  const r = el.getBoundingClientRect();
  const w = Math.min(512, Math.max(8, Math.round(r.width)));
  const h = Math.min(640, Math.max(8, Math.round(r.height)));
  const rad = o.radius ?? (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 20);
  const amp = o.amp ?? 0.8;
  const scale = o.scale ?? 18;
  const blur = o.blur ?? 6;
  const sat = o.saturate ?? 1.5;
  const spec = o.spec ?? 0.85;

  const map = dispMap(w, h, rad, amp);
  const fid = `lg-${w}x${h}-${rad.toFixed(1)}-${amp.toFixed(2)}-${scale}-${blur}-${sat.toFixed(2)}-${spec.toFixed(2)}`;
  if (!filterCache.has(fid)) {
    const d = ensureDefs();
    const f = document.createElementNS(SVGNS, "filter");
    f.setAttribute("id", fid);
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("x", "0"); f.setAttribute("y", "0");
    f.setAttribute("width", String(w)); f.setAttribute("height", String(h));
    f.setAttribute("color-interpolation-filters", "sRGB");
    f.innerHTML =
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="b"/>` +
      `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>` +
      `<feDisplacementMap in="b" in2="m" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="refr"/>` +
      `<feColorMatrix in="refr" type="saturate" values="${sat}" result="sat"/>` +
      `<feGaussianBlur in="m" stdDeviation="2.6" result="mb"/>` +
      `<feSpecularLighting in="mb" surfaceScale="2.6" specularConstant="${spec.toFixed(2)}" ` +
        `specularExponent="16" lighting-color="#ffffff" result="spec">` +
        `<feDistantLight azimuth="235" elevation="46"/>` +
      `</feSpecularLighting>` +
      `<feComposite in="spec" in2="m" operator="in" result="specIn"/>` +
      `<feComposite in="sat" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.9" k4="0"/>`;
    d.appendChild(f);
    filterCache.add(fid);
  }
  const bf = `url(#${fid})`;
  el.style.backdropFilter = bf;
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = bf;
  el.dataset.lgDone = "1";
}

/** Balaie les surfaces « verre » connues sous `root` et applique le moteur.
 *  Idempotent (marqueur dataset.lgDone). À appeler après chaque montage de
 *  panneau contenant du verre (home, sheets, apps). */
export async function liquidGlassAll(root: ParentNode = document): Promise<void> {
  await loadWasm(); // le moteur peut encore charger — W() jette sinon
  const sel = "[data-lg]";
  const els = root.querySelectorAll<HTMLElement>(sel);
  const jobs: Promise<void>[] = [];
  els.forEach((el) => {
    if (el.dataset.lgDone) return;
    if (!el.isConnected || el.getBoundingClientRect().width < 8) return;
    jobs.push(liquidGlass(el));
  });
  await Promise.all(jobs);
}

/* ---- API de compat (ancienne signature `glass()` utilisée par cc.ts) ---- */
export interface GlassOpts {
  radius: number;
  tint?: [number, number, number];
  alpha?: number;
  backdropFilter?: string;
}
export interface GlassSurface {
  canvas: HTMLCanvasElement;
  refresh: () => Promise<void>;
}

/** Ancien point d'entrée : applique maintenant le moteur à réfraction et
 *  renvoie un canvas « rim » vide (l'éclairage est dans le filtre). */
export async function glass(el: HTMLElement, o: GlassOpts): Promise<GlassSurface> {
  await liquidGlass(el, { radius: o.radius, scale: 16, blur: 5 });
  const canvas = document.createElement("canvas");
  canvas.className = "glx";
  canvas.style.display = "none";
  return { canvas, refresh: () => liquidGlass(el, { radius: o.radius, scale: 16, blur: 5 }) };
}
