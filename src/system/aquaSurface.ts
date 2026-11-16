import { W } from "../wasm/bridge";

const NS = "http://www.w3.org/2000/svg";
let sequence = 0;

export interface AquaSurfaceOptions {
  /** CSS pixel corner radius; defaults to a capsule/circle. */
  radius?: number;
  /** Width of the refracting edge band, CSS pixels. */
  bezel?: number;
  /** Optical thickness; scales how far the edge pulls the backdrop inward. */
  thickness?: number;
  ior?: number;
  /** Body blur, CSS pixels. */
  blur?: number;
  saturation?: number;
  /** White volume veil, 0..1. */
  veil?: number;
  /** Luminous rim width, CSS pixels. */
  rim?: number;
  rimOpacity?: number;
  rimColor?: string;
  /** Darkening of the body towards its edge, 0..1. */
  shade?: number;
  /** Optional colour laid over the transmitted backdrop. */
  tint?: string;
}

/** Aqua Glass for product surfaces: flat clear body, refracting bezel, thin lit rim. */
export function aquaSurface(el: HTMLElement, initial: AquaSurfaceOptions = {}) {
  let options = { ...initial };
  const id = `aqua-surface-${++sequence}`;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const filter = document.createElementNS(NS, "filter");
  filter.id = id;
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("primitiveUnits", "userSpaceOnUse");
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const defs = document.createElementNS(NS, "defs");
  defs.append(filter); svg.append(defs); document.body.append(svg);
  const layer = (z: string) => {
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.style.cssText = `position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:${z}`;
    return span;
  };
  const optic = layer("-2"), tint = layer("-1"), rim = layer("0");
  optic.style.borderRadius = "0";
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.isolation = "isolate";
  el.prepend(optic, tint, rim);
  let enabled = true, last = "";

  function render() {
    const box = getComputedStyle(el);
    const w = el.offsetWidth, h = el.offsetHeight, size = Math.min(w, h);
    if (w < 2 || h < 2) return;
    const blur = options.blur ?? 2;
    const bezel = Math.min(size / 2, options.bezel ?? Math.max(6, Math.min(22, size * .17)));
    const thickness = options.thickness ?? bezel * 1.3;
    const padding = Math.ceil(blur * 3 + 2);
    const ratio = Math.min(3, 1020 / (w + padding * 2), 636 / (h + padding * 2));
    const rw = Math.round(w * ratio), rh = Math.round(h * ratio), pad = Math.ceil(padding * ratio);
    const mw = rw + pad * 2, mh = rh + pad * 2;
    const radius = Math.min(options.radius ?? size / 2, size / 2) * ratio;
    const key = JSON.stringify([w, h, box.borderTopLeftRadius, options]);
    if (key === last) return;
    const api = W();
    if (!api.wg_aqua_surface(rw, rh, radius, bezel * ratio, Math.min(120, thickness * ratio),
      options.ior ?? 1.5, (options.rim ?? 2) * ratio, pad)) return;
    const paint = (pointer: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = mw; canvas.height = mh;
      const pixels = new Uint8ClampedArray(new Uint8ClampedArray(api.memory.buffer, pointer, mw * mh * 4));
      canvas.getContext("2d")!.putImageData(new ImageData(pixels, mw, mh), 0, 0);
      return canvas.toDataURL();
    };
    const field = paint(api.wg_out_ptr()), light = paint(api.wg_aqua_relief_ptr());
    const p = pad / ratio, width = mw / ratio, height = mh / ratio, scale = 256 / ratio;
    const veil = options.veil ?? .06;
    optic.style.inset = `${-p}px`;
    filter.setAttribute("x", "0"); filter.setAttribute("y", "0");
    filter.setAttribute("width", String(width)); filter.setAttribute("height", String(height));
    filter.innerHTML =
      `<feImage href="${field}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="field"/>` +
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft"/>` +
      `<feDisplacementMap in="soft" in2="field" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="bent"/>` +
      `<feOffset in="bent" dx="${scale / 510}" dy="${scale / 510}" result="refracted"/>` +
      `<feColorMatrix in="refracted" type="saturate" values="${options.saturation ?? 1.3}" result="vivid"/>` +
      `<feComponentTransfer in="vivid" result="glass">${["R", "G", "B"].map(c =>
        `<feFunc${c} type="linear" slope="${1 - veil}" intercept="${veil}"/>`).join("")}</feComponentTransfer>` +
      // The backdrop outside the shape must leave the filter untouched.
      `<feColorMatrix in="field" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 0" result="shape"/>` +
      `<feComposite in="glass" in2="shape" operator="in" result="cut"/>` +
      `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="cut"/></feMerge>`;
    tint.style.background = options.tint ?? "";
    tint.style.boxShadow = `inset 0 0 ${bezel * .8}px rgba(6,22,64,${options.shade ?? .16})`;
    const mask = `url("${light}") ${-p}px ${-p}px / ${width}px ${height}px no-repeat`;
    rim.style.background = options.rimColor ?? "#d6f1ff";
    rim.style.mask = mask;
    rim.style.setProperty("-webkit-mask", mask);
    rim.style.opacity = String(options.rimOpacity ?? .55);
    last = key;
    setEnabled(enabled);
  }

  function setEnabled(value: boolean) {
    enabled = value;
    optic.style.backdropFilter = value ? `url("#${id}")` : "none";
    optic.style.setProperty("-webkit-backdrop-filter", optic.style.backdropFilter);
    rim.style.visibility = value ? "" : "hidden";
  }

  const observer = new ResizeObserver(render);
  observer.observe(el);
  render();
  return {
    setEnabled,
    update(next: AquaSurfaceOptions) { options = { ...options, ...next }; render(); },
    destroy() { observer.disconnect(); svg.remove(); optic.remove(); tint.remove(); rim.remove(); }
  };
}
