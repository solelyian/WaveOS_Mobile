export const BOOT_DURATION = 8.35;
export const REDUCED_BOOT_DURATION = 1.4;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, t: number) => {
  const p = clamp((t - a) / (b - a));
  return p * p * (3 - 2 * p);
};
const easeOut = (p: number) => 1 - Math.pow(1 - clamp(p), 3);

export function bootFrameAt(time: number, reducedMotion = false) {
  const t = Math.max(0, time);
  const morph = reducedMotion ? 1 : smooth(6.15, 6.95, t);
  return {
    time: t,
    phase: reducedMotion ? "wordmark"
      : t < 3.95 ? "manufacturer" : t < 5.3 ? "cloud"
      : t < 6.15 ? "ring" : t < 7.05 ? "morph" : "wordmark",
    manufacturerOpacity: reducedMotion ? 0 : 1 - smooth(3.6, 3.95, t),
    sweep: reducedMotion ? 0 : smooth(1.6, 2.65, t),
    sweepOpacity: reducedMotion ? 0 : smooth(1.55, 1.8, t) * (1 - smooth(2.5, 2.95, t)),
    cloudOpacity: reducedMotion ? 0 : smooth(3.95, 4.16, t) * (1 - smooth(6.08, 6.72, t)),
    convergence: smooth(4.9, 5.65, t),
    morph,
    wordmarkScale: reducedMotion ? 1 : mix(4.9, 1, smooth(6.4, 6.93, t)),
    wordmarkOpacity: reducedMotion ? smooth(0, .25, t)
      : .025 * smooth(5.75, 6.05, t) + .975 * smooth(6.35, 6.95, t),
    ringGlyphOpacity: reducedMotion ? 1 : smooth(6.08, 6.6, t),
    underlineOpacity: reducedMotion ? 1 : smooth(6.85, 7.07, t),
    underlineAlpha: reducedMotion ? 1 : smooth(6.83, 6.95, t),
    exitOpacity: reducedMotion ? 1 - smooth(1.15, REDUCED_BOOT_DURATION, t)
      : 1 - smooth(7.85, BOOT_DURATION, t),
    done: t >= (reducedMotion ? REDUCED_BOOT_DURATION : BOOT_DURATION),
  };
}

type Particle = {
  angle: number; distance: number; depth: number; size: number;
  phase: number; radialOffset: number; gather: boolean; cloudVisible: boolean;
};

function particles(): Particle[] {
  let seed = 0x57564156;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: 1600 }, () => ({
    angle: random() * Math.PI * 2,
    distance: 6 + Math.pow(random(), 1.55) * 280,
    depth: random(),
    size: .28 + Math.pow(random(), 4) * 1.05,
    phase: random() * Math.PI * 2,
    radialOffset: (random() + random() + random() - 1.5) * 8,
    gather: random() < .92,
    cloudVisible: random() < .25,
  }));
}

const FONT = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export class BootRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars = particles();
  private halo: HTMLCanvasElement;
  private width = 400;
  private height = 850;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.halo = document.createElement("canvas");
    this.halo.width = this.halo.height = 32;
    const halo = this.halo.getContext("2d")!;
    const glow = halo.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, "rgba(250,252,255,.85)");
    glow.addColorStop(.18, "rgba(215,224,235,.3)");
    glow.addColorStop(.5, "rgba(180,195,215,.05)");
    glow.addColorStop(1, "rgba(170,185,210,0)");
    halo.fillStyle = glow;
    halo.fillRect(0, 0, 32, 32);
  }

  resize(width: number, height: number, dpr = 1) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.max(1, Math.min(2, dpr));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  renderAt(time: number, reducedMotion = false) {
    const frame = bootFrameAt(time, reducedMotion);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.width / 400, this.width / 400);
    ctx.textBaseline = "middle";
    if (frame.manufacturerOpacity > 0) this.manufacturer(frame);
    if (frame.cloudOpacity > 0) this.stardust(frame);
    if (frame.wordmarkOpacity > 0) this.wordmark(frame);
    ctx.restore();
    return frame;
  }

  private manufacturer(frame: ReturnType<typeof bootFrameAt>) {
    const ctx = this.ctx;
    ctx.font = `600 36px ${FONT}`;
    const letters = [..."NYNE"];
    const widths = letters.map(letter => ctx.measureText(letter).width);
    const width = widths.reduce((a, b) => a + b, 0) + 3 * 1.7;
    let x = -width / 2;
    const sweepX = mix(-width / 2 - 24, width / 2 + 24, frame.sweep);
    const delays = [.65, .5, .8, .95];
    letters.forEach((letter, i) => {
      const appeared = smooth(delays[i], delays[i] + .7, frame.time);
      const passed = smooth(x - 28, x + widths[i], sweepX);
      const white = mix(.16, 1, passed);
      ctx.globalAlpha = appeared * white * frame.manufacturerOpacity;
      ctx.fillStyle = "#fff";
      ctx.fillText(letter, x, 0);
      x += widths[i] + 1.7;
    });
    if (frame.sweepOpacity <= 0) return;
    ctx.globalAlpha = frame.sweepOpacity * frame.manufacturerOpacity;
    this.flare(sweepX, 7, 1);
    this.flare(sweepX + 41, -7, .35);
    ctx.globalAlpha = 1;
  }

  private flare(x: number, y: number, strength: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= strength;
    const line = ctx.createLinearGradient(x - 100, 0, x + 100, 0);
    line.addColorStop(0, "rgba(65,110,240,0)");
    line.addColorStop(.4, "rgba(80,130,255,.3)");
    line.addColorStop(.5, "rgba(225,242,255,.9)");
    line.addColorStop(.6, "rgba(80,130,255,.3)");
    line.addColorStop(1, "rgba(65,110,240,0)");
    ctx.fillStyle = line;
    ctx.fillRect(x - 100, y - .4, 200, .8);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glow.addColorStop(0, "rgba(245,250,255,1)");
    glow.addColorStop(.07, "rgba(165,200,255,.95)");
    glow.addColorStop(.2, "rgba(95,140,255,.35)");
    glow.addColorStop(1, "rgba(45,80,200,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 20, y - 20, 40, 40);
    ctx.restore();
  }

  private metrics() {
    const ctx = this.ctx;
    ctx.font = `400 32px ${FONT}`;
    ctx.textBaseline = "alphabetic";
    const prefix = ctx.measureText("Wave").width;
    const o = ctx.measureText("O");
    const suffix = ctx.measureText("S").width;
    return {
      prefix, o: o.width, suffix, width: prefix + o.width + suffix,
      oHeight: o.actualBoundingBoxAscent + o.actualBoundingBoxDescent,
      baseline: (o.actualBoundingBoxAscent - o.actualBoundingBoxDescent) / 2,
      oCenter: (prefix - suffix) / 2,
    };
  }

  private stardust(frame: ReturnType<typeof bootFrameAt>) {
    const ctx = this.ctx;
    const m = this.metrics();
    const burst = easeOut((frame.time - 3.95) / 1.1);
    const drift = frame.time - 4;
    const centerX = m.oCenter * frame.morph;
    const glyphRadius = m.oHeight / 2 - 1.3;
    const radius = mix(58, glyphRadius * frame.wordmarkScale, frame.morph);
    for (const p of this.stars) {
      const gather = p.gather ? smooth(4.9 + p.depth * .25, 5.6 + p.depth * .2, frame.time) : 0;
      const angle = p.angle + drift * mix(.05, .48, gather);
      const cloudR = p.distance * mix(.15, 1, burst)
        * (1 + drift * (.08 * p.depth + .6 * Math.pow(p.depth, 8)));
      const ringR = radius + p.radialOffset * mix(1, .16, frame.morph);
      const x = mix(Math.cos(angle) * cloudR, Math.cos(angle) * ringR + centerX, gather);
      const y = mix(Math.sin(angle) * cloudR * 1.55, Math.sin(angle) * ringR, gather);
      const twinkle = .55 + .45 * Math.pow(Math.sin(p.phase + frame.time * 2.6), 2);
      const visibility = p.cloudVisible ? 1 : Math.pow(gather, 5);
      const cluster = mix(1, .75 + .25 * Math.sin(angle * 5 + drift * 1.7), gather);
      const depthLight = mix(.22 + .78 * Math.pow(p.depth, .8), 1, gather);
      const opacity = frame.cloudOpacity * twinkle * visibility * cluster * depthLight
        * (p.gather ? 1 : 1 - smooth(5.7, 6.25, frame.time));
      if (opacity < .01) continue;
      const defocused = p.depth > .9;
      const size = p.size * mix(defocused ? 5 : 1 + p.depth, 1.18, gather);
      if (p.size > .45 || defocused) {
        ctx.globalAlpha = opacity * mix(defocused ? .85 : .35, .95, gather);
        const haloSize = size * mix(defocused ? 14 : 6, 11, gather);
        ctx.drawImage(this.halo, x - haloSize / 2, y - haloSize / 2, haloSize, haloSize);
      }
      ctx.globalAlpha = opacity * mix(defocused ? .45 : 1, .65, gather);
      ctx.fillStyle = "#f6f8fb";
      ctx.beginPath();
      ctx.arc(x, y, size * (defocused ? mix(.22, 1, gather) : 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private wordmark(frame: ReturnType<typeof bootFrameAt>) {
    const ctx = this.ctx;
    const m = this.metrics();
    const center = m.oCenter * frame.morph;
    ctx.save();
    ctx.translate(center, 0);
    ctx.scale(frame.wordmarkScale, frame.wordmarkScale);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = frame.wordmarkOpacity;
    ctx.fillText("Wave", -m.o / 2 - m.prefix, m.baseline);
    ctx.fillText("S", m.o / 2, m.baseline);
    ctx.globalAlpha = frame.ringGlyphOpacity;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, m.oHeight / 2 - 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = frame.underlineAlpha;
    ctx.fillStyle = "#3b8cff";
    ctx.beginPath();
    ctx.roundRect(-m.o * .22, m.oHeight / 2 + 6, m.o * .44 * frame.underlineOpacity, 2.3, 1.15);
    ctx.fill();
    ctx.restore();
  }
}

export function mountBoot(host: HTMLElement, onComplete: () => void) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
  host.append(canvas);
  host.setAttribute("role", "button");
  host.setAttribute("aria-label", navigator.language.startsWith("fr") ? "Passer l’animation de démarrage" : "Skip startup animation");
  host.tabIndex = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer: BootRenderer | null = null;
  let fallback: HTMLElement | null = null;
  try { renderer = new BootRenderer(canvas); } catch {
    fallback = document.createElement("div");
    fallback.textContent = "WaveOS";
    Object.assign(fallback.style, { position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: `400 32px ${FONT}` });
    host.append(fallback);
  }
  let raf = 0;
  let disposed = false;
  let skipAt: number | null = null;
  const start = performance.now();
  const resize = () => renderer?.resize(host.clientWidth || 400, host.clientHeight || 850, devicePixelRatio);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const skip = (event: PointerEvent | KeyboardEvent) => {
    if (event instanceof KeyboardEvent && !["Enter", " ", "Escape"].includes(event.key)) return;
    if (event instanceof PointerEvent && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (skipAt === null) skipAt = performance.now();
  };
  host.addEventListener("pointerdown", skip);
  host.addEventListener("keydown", skip);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    host.removeEventListener("pointerdown", skip);
    host.removeEventListener("keydown", skip);
    canvas.remove();
    fallback?.remove();
  };
  const frame = (now: number) => {
    if (disposed) return;
    const t = (now - start) / 1000;
    const simple = reduced.matches || !renderer;
    const state = bootFrameAt(t, simple);
    const skipFade = skipAt === null ? 1 : 1 - smooth(0, .22, (now - skipAt) / 1000);
    renderer?.renderAt(t, simple);
    host.style.opacity = String(Math.min(state.exitOpacity, skipFade));
    if (state.done || skipFade <= 0) {
      dispose();
      onComplete();
    } else raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return dispose;
}
