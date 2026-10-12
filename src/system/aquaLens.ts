import { W } from "../wasm/bridge";

const NS = "http://www.w3.org/2000/svg";
let sequence = 0;

export interface AquaLensOptions {
  zoom?: number;
  ior?: number;
  depth?: number;
  thickness?: number;
}

function image(w: number, h: number, pointer: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.putImageData(new ImageData(
    new Uint8ClampedArray(W().memory.buffer, pointer, w * h * 4), w, h), 0, 0);
  return canvas.toDataURL();
}

export function aquaLens(el: HTMLElement, options: AquaLensOptions = {}) {
  const id = `aqua-volume-${++sequence}`;
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
  const relief = document.createElement("span");
  relief.setAttribute("aria-hidden", "true");
  relief.style.cssText = "position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-size:100% 100%";
  const optic = document.createElement("span");
  optic.setAttribute("aria-hidden", "true");
  optic.style.cssText = "position:absolute;pointer-events:none;z-index:-1";
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.prepend(optic, relief);
  let enabled = true, last = "";

  function render() {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w < 2 || h < 2) return;
    const padding = Math.ceil(Math.min(w, h) * .9);
    const ratio = Math.min(3, 1022 / (w + padding * 2), 638 / (h + padding * 2));
    const rw = Math.round(w * ratio), rh = Math.round(h * ratio), pad = Math.ceil(padding * ratio);
    const mw = rw + pad * 2, mh = rh + pad * 2;
    const key = `${w}-${h}-${rw}-${rh}-${pad}`;
    if (key === last) return;
    const api = W();
    if (!api.wg_aqua_lens(rw, rh, Math.min(rw, rh) / 2,
      (options.depth ?? h * .36) * ratio,
      (options.thickness ?? h * .16) * ratio,
      options.ior ?? 1.46, options.zoom ?? 1.18, pad)) return;
    const transmission = image(mw, mh, api.wg_out_ptr());
    const reflection = image(mw, mh, api.wg_aqua_reflection_ptr());
    const edge = image(mw, mh, api.wg_aqua_relief_ptr());
    const p = pad / ratio;
    const width = mw / ratio, height = mh / ratio;
    const transmitScale = 128 / ratio, reflectScale = 256 / ratio;
    const shift = (scale: number) => -scale / 510;
    const channel = (name: string, scale: number, row: string) =>
      `<feDisplacementMap in="SourceGraphic" in2="transmissionMap" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>` +
      `<feOffset dx="${shift(scale)}" dy="${shift(scale)}"/>` +
      `<feColorMatrix type="matrix" values="${row} 0 0 0 1 0" result="${name}"/>`;
    const radius = getComputedStyle(el).borderTopLeftRadius;
    optic.style.inset = `${-p}px`;
    optic.style.clipPath = `inset(${p}px round ${radius})`;
    filter.setAttribute("x", "0"); filter.setAttribute("y", "0");
    filter.setAttribute("width", String(width)); filter.setAttribute("height", String(height));
    filter.innerHTML =
      `<feImage href="${transmission}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="transmissionMap"/>` +
      `<feImage href="${reflection}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="reflectionMap"/>` +
      channel("red", transmitScale * .94, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0") +
      channel("green", transmitScale, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0") +
      channel("blue", transmitScale * 1.07, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0") +
      `<feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="redGreen"/>` +
      `<feComposite in="redGreen" in2="blue" operator="arithmetic" k2="1" k3="1" result="transmission"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="reflectionMap" scale="${reflectScale}" xChannelSelector="R" yChannelSelector="G" result="mirror"/>` +
      `<feOffset in="mirror" dx="${shift(reflectScale)}" dy="${shift(reflectScale)}" result="reflection"/>` +
      `<feColorMatrix in="transmissionMap" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0" result="fresnel"/>` +
      `<feComposite in="reflection" in2="fresnel" operator="in" result="reflected"/>` +
      `<feComposite in="transmission" in2="fresnel" operator="out" result="transmitted"/>` +
      `<feComposite in="transmitted" in2="reflected" operator="arithmetic" k2="1" k3="1"/>`;
    relief.style.backgroundImage = `url("${edge}")`;
    relief.style.backgroundSize = `${width}px ${height}px`;
    relief.style.backgroundPosition = `${-p}px ${-p}px`;
    last = key;
    setEnabled(enabled);
  }

  function setEnabled(value: boolean) {
    enabled = value;
    optic.style.backdropFilter = value ? `url("#${id}")` : "none";
    optic.style.setProperty("-webkit-backdrop-filter", optic.style.backdropFilter);
  }

  const observer = new ResizeObserver(render);
  observer.observe(el);
  render();
  return {
    setEnabled,
    destroy() {
      observer.disconnect();
      svg.remove(); relief.remove(); optic.remove();
    }
  };
}
