import { loadWasm } from "../wasm/bridge";

const NS = "http://www.w3.org/2000/svg";
const FONT = "500 100px system-ui, -apple-system, sans-serif";
const instances = new WeakMap<HTMLElement, { key: string; version: number; filter: SVGFilterElement }>();

function installStyles() {
  if (document.getElementById("clock-material")) return;
  const style = document.createElement("style");
  style.id = "clock-material";
  style.textContent = `
    .glass-clock { position:relative; flex:none; color:rgba(255,255,255,.85); text-align:center; }
    .glass-clock > .clk-shadow, .glass-clock > .clk-g, .glass-clock > .clk-e {
      position:absolute; inset:0; display:block; pointer-events:none;
      mask-repeat:no-repeat; mask-position:center; mask-size:100% 100%;
      -webkit-mask-repeat:no-repeat; -webkit-mask-position:center; -webkit-mask-size:100% 100%;
    }
    .glass-clock > .clk-shadow { background:rgba(0,0,0,.20); transform:translateY(2px); filter:blur(2px); }
    .glass-clock > .clk-g {
      background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(11,19,21,.16) 58%,rgba(255,255,255,.025));
    }
    .glass-clock > .clk-e { background:transparent; background-size:100% 100%; background-repeat:no-repeat; }
    .glass-clock.clock-ready { color:transparent; }
    .glass-clock.clock-ready [data-clock-source] { opacity:0; }
  `;
  document.head.append(style);
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function makeFilter() {
  let root = document.querySelector<SVGSVGElement>("#clock-optics");
  if (!root) {
    root = svg("svg", { id: "clock-optics", width: "0", height: "0", "aria-hidden": "true" });
    root.style.position = "absolute";
    root.style.pointerEvents = "none";
    root.append(svg("defs", {}));
    document.body.append(root);
  }
  const filter = svg("filter", {
    id: `clock-${crypto.randomUUID()}`, filterUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  filter.append(
    svg("feGaussianBlur", { in: "SourceGraphic", stdDeviation: ".35", result: "background" }),
    svg("feImage", { x: "0", y: "0", preserveAspectRatio: "none", result: "lens" }),
    svg("feDisplacementMap", { in: "background", in2: "lens", xChannelSelector: "R", yChannelSelector: "G" }),
  );
  root.firstElementChild!.append(filter);
  return filter;
}

function png(bytes: Uint8Array | Uint8ClampedArray, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext("2d")!;
  const image = c.createImageData(w, h);
  image.data.set(bytes);
  c.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function glyph(time: string, w: number, h: number, size: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
  const c = canvas.getContext("2d")!;
  c.font = FONT;
  const reference = c.measureText("9:41"), metrics = c.measureText(time);
  const referenceHeight = reference.actualBoundingBoxAscent + reference.actualBoundingBoxDescent;
  const targetHeight = size - 16;
  const thickening = targetHeight * .023;
  const sy = targetHeight / referenceHeight;
  const referenceWidth = reference.actualBoundingBoxLeft + reference.actualBoundingBoxRight;
  const sx = (targetHeight * 1.24 - 2 * thickening) / referenceWidth;
  const textWidth = (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) * sx;
  const fit = Math.min(1, (w - 12) / (textWidth + 2 * thickening));
  c.fillStyle = "#fff";
  for (let dx = -thickening; dx <= thickening + .25; dx += .5) {
    c.setTransform(ratio * sx * fit, 0, 0, ratio * sy * fit,
      ratio * (w / 2 - (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) * sx * fit / 2 + dx * fit),
      ratio * (h / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) * sy * fit / 2));
    c.fillText(time, 0, 0);
  }
  return { canvas, image: c.getImageData(0, 0, canvas.width, canvas.height) };
}

export function glassClock(el: HTMLElement, time: string, size = parseFloat(getComputedStyle(el).fontSize)) {
  installStyles();
  el.classList.add("glass-clock");
  el.setAttribute("role", "timer");
  el.setAttribute("aria-label", time);
  el.style.width = `${size * 1.85}px`;
  el.style.maxWidth = "calc(100% - 40px)";
  el.style.height = `${size + 8}px`;
  el.style.color = el.classList.contains("clock-ready") ? "transparent" : "rgba(255,255,255,.82)";
  if (!el.isConnected || el.offsetWidth < 20) return;
  let state = instances.get(el);
  if (!state) {
    for (const name of ["clk-shadow", "clk-g", "clk-e"]) {
      const layer = document.createElement("i");
      layer.className = name;
      layer.setAttribute("aria-hidden", "true");
      el.append(layer);
    }
    state = { key: "", version: 0, filter: makeFilter() };
    instances.set(el, state);
  }
  const w = el.offsetWidth, h = el.offsetHeight;
  const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 512 / w, 640 / h);
  const key = `${time}|${size}|${w}x${h}|${ratio}`;
  if (state.key === key) return;
  state.key = key;
  const version = ++state.version;
  const current = state;
  void Promise.all([loadWasm(), document.fonts.ready]).then(([api]) => {
    if (!el.isConnected || current.version !== version) return;
    const { canvas, image } = glyph(time, w, h, size, ratio);
    const rw = canvas.width, rh = canvas.height;
    const alpha = new Uint8Array(api.memory.buffer, api.wg_glyph_mask_ptr(), rw * rh);
    for (let i = 0; i < alpha.length; i++) alpha[i] = image.data[i * 4 + 3];
    if (!api.wg_glyph_render(rw, rh, Math.max(2, Math.min(5, size * .025)) * ratio, ratio)) return;
    const displacement = png(new Uint8Array(api.memory.buffer, api.wg_out_ptr(), rw * rh * 4), rw, rh);
    const edge = png(new Uint8Array(api.memory.buffer, api.wg_glyph_edge_ptr(), rw * rh * 4), rw, rh);
    const mask = `url("${canvas.toDataURL()}")`;
    for (const layer of el.querySelectorAll<HTMLElement>(".clk-shadow, .clk-g")) {
      layer.style.maskImage = layer.style.webkitMaskImage = mask;
    }
    const filter = current.filter;
    for (const [name, value] of Object.entries({ x: "-12", y: "-12", width: `${w + 24}`, height: `${h + 24}` })) {
      filter.setAttribute(name, value);
    }
    const lens = filter.querySelector("feImage")!;
    lens.setAttribute("href", displacement);
    lens.setAttribute("width", `${w}`); lens.setAttribute("height", `${h}`);
    filter.querySelector("feDisplacementMap")!.setAttribute("scale", `${Math.max(4, Math.min(14, size * .065))}`);
    const body = el.querySelector<HTMLElement>(".clk-g")!;
    body.style.backdropFilter = (body.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter =
      `url("#${filter.id}") brightness(.96) saturate(1.06)`;
    el.querySelector<HTMLElement>(".clk-e")!.style.backgroundImage = `url("${edge}")`;
    el.classList.add("clock-ready");
    el.style.color = "transparent";
  }).catch(() => {
    if (current.version === version) {
      current.key = "";
      el.classList.remove("clock-ready");
      el.style.color = "rgba(255,255,255,.82)";
    }
  });
}

export function clearGlassClock(el: HTMLElement) {
  const state = instances.get(el);
  if (state) { state.version++; state.filter.remove(); instances.delete(el); }
  el.querySelectorAll(".clk-shadow, .clk-g, .clk-e").forEach(layer => layer.remove());
  el.classList.remove("glass-clock", "clock-ready");
}
