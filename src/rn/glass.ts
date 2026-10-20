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
import { aquaLens } from "../system/aquaLens";
import { NATIVE } from "../platform";

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
function dispMap(w: number, h: number, r: number, amp: number, depth: number): string {
  const key = `${w}-${h}-${r.toFixed(1)}-${amp.toFixed(2)}-${depth.toFixed(2)}`;
  const hit = mapCache.get(key);
  if (hit) return hit;
  const api = W();
  api.wg_glass_disp(w, h, r, amp, depth);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cx = c.getContext("2d")!;
  cx.putImageData(
    new ImageData(new Uint8ClampedArray(api.memory.buffer, api.wg_out_ptr(), w * h * 4), w, h), 0, 0);
  const url = c.toDataURL("image/png");
  mapCache.set(key, url);
  return url;
}

/** Habillage de bord (filet spéculaire + halo + ombre + caustique) → dataURL. */
function edgeMap(w: number, h: number, r: number, depth: number): string {
  const key = `e${w}-${h}-${r.toFixed(1)}-${depth.toFixed(2)}`;
  const hit = mapCache.get(key);
  if (hit) return hit;
  const api = W();
  api.wg_glass_edge(w, h, r, depth);
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
  /** amplitude de la lentille 0..1 */
  amp?: number;
  /** largeur de la bande réfractive depuis le bord, en px */
  depth?: number;
  /** étendue du feDisplacementMap ; déplacement max = scale / 2 */
  scale?: number;
  /** flou du décor en px */
  blur?: number;
  /** saturation du fond */
  saturate?: number;
  /** intensité du liseré spéculaire 0..1 */
  spec?: number;
}

/** Applique le matériau WaveOS à `el` (son backdrop est réfracté). */
export async function liquidGlass(el: HTMLElement, o: LGOpts = {}): Promise<void> {
  await loadWasm();
  const control = !!el.closest("#cc");
  const notification = el.dataset.lgKind === "notification";
  const slider = el.dataset.lgKind === "slider";
  const r = el.getBoundingClientRect();
  const w = Math.min(512, Math.max(8, Math.round(control || notification ? el.offsetWidth : r.width)));
  const h = Math.min(640, Math.max(8, Math.round(control || notification ? el.offsetHeight : r.height)));
  const cs = getComputedStyle(el).borderTopLeftRadius;
  const rad = o.radius ?? (notification ? 34 : cs.endsWith("%")
    ? (parseFloat(cs) / 100) * Math.min(w, h)
    : (parseFloat(cs) || 20));
  const size = Math.min(w, h);
  if (control) {
    el.dataset.lgDone = "1";
    return;
  }
  if (!el.hasAttribute("data-glass-legacy")) {
    const capsule = rad >= size / 2 - .5;
    aquaLens(el, {
      radius: rad,
      zoom: 1,
      ior: capsule ? 1.32 : 1.24,
      depth: o.depth ?? (capsule ? Math.min(9, size * .14) : Math.min(10, size * .1)),
      thickness: capsule ? Math.min(5, size * .08) : Math.min(6, size * .06),
      relief: capsule ? .32 : .22,
      reflection: 0,
      rim: capsule ? .9 : .55,
      lite: NATIVE, // WebView Android : raster SVG url() trop lent/invisible
    });
    el.dataset.lgDone = "1";
    return;
  }
  const amp = o.amp ?? 1.0;
  const depth = o.depth ?? (control ? Math.min(16, Math.max(4, size * .12)) : 30);
  const scale = o.scale ?? (notification ? 16 : control ? Math.min(44, Math.max(22, size * .5)) : 100);
  const blur = o.blur ?? (notification ? 5 : control ? 1.2 : 3);
  const sat = o.saturate ?? (slider ? 0 : control ? 1.3 : 1.15);

  const map = dispMap(w, h, rad, amp, depth);
  const fid = `lg-${w}x${h}-${rad.toFixed(1)}-${amp.toFixed(2)}-${scale}-${blur}-${sat.toFixed(2)}-${depth.toFixed(2)}`;
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
      `<feColorMatrix in="refr" type="saturate" values="${sat}"/>`;
    d.appendChild(f);
    filterCache.add(fid);
  }
  const bf = `url(#${fid})`;
  el.style.backdropFilter = bf;
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = bf;
  // habillage de bord : filet spéculaire fin, halo haut, ombre bas, caustique
  if (!el.querySelector(":scope > .lg-edge")) {
    const edge = document.createElement("i");
    edge.className = "lg-edge";
    edge.style.cssText = `position:absolute;inset:0;border-radius:inherit;` +
      `pointer-events:none;background-image:url("${edgeMap(w, h, rad, depth)}");` +
      `background-size:100% 100%;z-index:0;`;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.prepend(edge);
  }
  const edge = el.querySelector<HTMLElement>(":scope > .lg-edge")!;
  edge.style.opacity = String(o.spec ?? (control ? .65 : 1));
  el.dataset.lgDone = "1";
}

/** Balaie les surfaces « verre » connues sous `root` et applique le moteur.
 *  Idempotent (marqueur dataset.lgDone). À appeler après chaque montage de
 *  panneau contenant du verre (home, sheets, apps). */
const SEL = "[data-lg]";

let observer: MutationObserver | null = null;
/** Surfaces montées tardivement (écran d'appel, sous-pages) → moteur auto. */
function watch() {
  if (observer) return;
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        const targets: HTMLElement[] = [];
        if (n.matches(SEL)) targets.push(n);
        n.querySelectorAll<HTMLElement>(SEL).forEach((e) => targets.push(e));
        for (const el of targets) {
          if (!el.dataset.lgDone && el.getBoundingClientRect().width >= 8) liquidGlass(el);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export async function liquidGlassAll(root: ParentNode = document): Promise<void> {
  await loadWasm();
  watch();
  const sel = SEL;
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
