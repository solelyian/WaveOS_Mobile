// wallpaper.ts — fond Unsplash, voile à trois états (maquette : scale/blur/brightness/saturate).
import { Spring } from "../core/motion";
import { lerp } from "../wasm/bridge";

// keyframes (scale, blurPx, brightness, saturate) aux valeurs v = 0 / 1 / 2
// maquette : home {1, 0, 1, 1} — app {1.05, 4, .6, 1} — lock|sheet {1.1, 10, .7, 1.2}
const K = [
  { s: 1.0, b: 0, l: 1.0, sat: 1.0 },
  { s: 1.05, b: 4, l: 0.6, sat: 1.0 },
  { s: 1.1, b: 10, l: 0.7, sat: 1.2 },
] as const;

export class Wallpaper {
  el = document.createElement("div");
  s = new Spring(0, "shade");
  private blur = new Spring(0, "shade");
  constructor() {
    this.el.id = "wp";
  }
  setScene(v: 0 | 1 | 2, sharp = false) {
    this.s.to(v);
    this.blur.to(sharp ? 0 : K[v].b);
  }
  render() {
    const v = this.s.v;
    const i = v <= 1 ? 0 : 1;
    const t = v <= 1 ? v : v - 1;
    const a = K[i], b = K[i + 1];
    const s = lerp(a.s, b.s, t);
    const bl = Math.max(0, this.blur.v);
    const br = lerp(a.l, b.l, t);
    const sa = lerp(a.sat, b.sat, t);
    this.el.style.transform = `scale(${s.toFixed(4)})`;
    this.el.style.filter = `blur(${bl.toFixed(1)}px) brightness(${br.toFixed(3)}) saturate(${sa.toFixed(3)})`;
  }
}
