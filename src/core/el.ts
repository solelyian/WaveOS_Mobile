// el.ts — fabrique DOM minimale. Pas de framework : le shell EST le framework,
// les animations sont pilotées par le moteur physique, pas par une réconciliation.

type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "class") e.className = String(v);
    else if (k === "style") e.setAttribute("style", String(v));
    else if (k.startsWith("on") && typeof v === "function") {
      e.addEventListener(k.slice(2), v as EventListener);
    } else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, String(v));
  }
  for (const c of children) e.append(c);
  return e;
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: SVGElement[]
): SVGElementTagNameMap[K] {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    e.setAttribute(k, String(v));
  }
  for (const c of children) e.append(c);
  return e;
}

/** Icône SVG 24×24 stroke (style glyphe encre — paths façon Lucide). */
export function glyphIcon(paths: string[], cls = ""): SVGSVGElement {
  const s = svgEl("svg", { viewBox: "0 0 24 24", class: `glyph ${cls}`, fill: "none" });
  for (const d of paths) s.append(svgEl("path", { d }));
  return s;
}
