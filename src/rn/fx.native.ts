// fx.native.ts — pont RN natif : domOf renvoie un adaptateur qui rejoue les
// écritures `el.style.*` via setNativeProps (même code impératif que le web).
import * as React from "react";
import type { View } from "react-native";
import { StyleSheet } from "react-native";

// RN styles attendent des nombres : strings "12px"/"0.92" → number,
// "" → undefined (reset vers le style de base), le reste reste string.
const num = (v: unknown) => {
  if (typeof v !== "string") return v;
  if (v.endsWith("px")) return parseFloat(v);
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : v;
};

// transform CSS → tableau RN ([{translateX}…])
function cssTransform(v: string) {
  const out: Record<string, unknown>[] = [];
  const re = /(translateX|translateY|translate|scaleX|scaleY|scale|rotate|rotateZ)\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(v))) {
    const [, k, arg] = m;
    const parts = arg.split(",").map((s) => parseFloat(s) || 0);
    if (k === "translate") out.push({ translateX: parts[0] ?? 0 }, { translateY: parts[1] ?? 0 });
    else if (k === "rotate" || k === "rotateZ") out.push({ rotateZ: arg.trim() });
    else out.push({ [k]: parts[0] ?? 0 });
  }
  return out;
}

const STRING_PROPS = new Set(["position", "display", "overflow", "isolation"]);
const SKIP = new Set(["filter", "backdropFilter", "webkitBackdropFilter", "clipPath", "maskImage", "webkitMaskImage", "maskSize", "webkitMaskSize", "maskPosition", "webkitMaskPosition", "backgroundImage", "backgroundSize", "backgroundPosition", "boxShadow", "userSelect", "webkitUserSelect", "pointerEvents", "zIndex", "inset", "transition", "background", "backgroundColor:gradient", "visibility", "transformOrigin"]);

function conv(k: string, v: unknown) {
  if (SKIP.has(k)) return [null, null] as const;
  if (k === "transform") return ["transform", cssTransform(String(v))] as const;
  if (k === "borderTopLeftRadius" || k === "borderRadius") return ["borderRadius", num(v)] as const;
  return [k, STRING_PROPS.has(k) ? v : num(v)] as const;
}

const cache = new WeakMap<object, NativeEl>();

export class NativeEl {
  inst: { setNativeProps?: (p: object) => void; props?: { style?: unknown } } | null;
  _extra: Record<string, unknown> = {};
  _base: unknown = null;
  dataset: Record<string, string> = {};
  children: NativeEl[] = [];
  isConnected = true;
  constructor(inst: unknown) { this.inst = inst as never; }
  _apply() {
    if (!this.inst?.setNativeProps) return;
    if (this._base == null) this._base = this.inst.props?.style;
    this.inst.setNativeProps({ style: [this._base, this._extra] });
  }
  get style() {
    const self = this;
    return new Proxy({} as Record<string, unknown>, {
      set: (_t, k, v) => {
        const [key, val] = conv(String(k), v);
        if (key) { self._extra[key] = val; self._apply(); }
        return true;
      },
    });
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  }
  get offsetWidth() { return 0; } get offsetHeight() { return 0; }
  get offsetLeft() { return 0; } get offsetTop() { return 0; }
  querySelector() { return null; } querySelectorAll() { return []; }
  closest() { return null; } matches() { return false; }
  addEventListener() {} removeEventListener() {}
  append() {} prepend() {} remove() {}
  setAttribute() {} removeAttribute() {}
  classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
}

export type El = NativeEl | null;
export const domOf = (r: React.RefObject<View | null>): El => {
  const inst = r?.current;
  if (!inst) return null;
  let e = cache.get(inst as object);
  if (!e) { e = new NativeEl(inst); cache.set(inst as object, e); }
  return e;
};

const subs = new Set<(dt: number) => void>();
let last = 0, running = false;
function tick(t: number) {
  const dt = last ? Math.min(0.032, (t - last) / 1000) : 0.016;
  last = t;
  subs.forEach((f) => f(dt));
  requestAnimationFrame(tick);
}
export function onFrame(f: (dt: number) => void) {
  subs.add(f);
  if (!running) { running = true; requestAnimationFrame(tick); }
  return () => subs.delete(f);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export class Spring {
  v: number; vel = 0; target: number;
  k: number; c: number;
  constructor(v = 0, k = 300, c = 26, target?: number) {
    this.v = v; this.k = k; this.c = c; this.target = target ?? v;
  }
  to(t: number) { this.target = t; }
  set(v: number) { this.v = v; this.target = v; this.vel = 0; }
  get settled() { return Math.abs(this.v - this.target) < 0.002 && Math.abs(this.vel) < 0.01; }
  step(dt: number) {
    if (this.settled) { this.v = this.target; this.vel = 0; return; }
    this.vel += (-this.k * (this.v - this.target) - this.c * this.vel) * dt;
    this.v += this.vel * dt;
  }
}
export const SPRINGS = {
  morph: [300, 26] as const,
  shade: [260, 30] as const,
  island: [380, 30] as const,
  snap: [500, 34] as const,
};

export const glassStyle = (alpha = 0.05, extra: Record<string, string> = {}) => ({
  backgroundColor: `rgba(255,255,255,${alpha})`,
  elevation: 2,
  ...extra,
} as const);

export function tween(ms: number, fn: (v: number) => void, done?: () => void) {
  const t0 = performance.now();
  const off = onFrame(() => {
    const v = Math.min(1, (performance.now() - t0) / ms);
    const e = 1 - Math.pow(1 - v, 3);
    fn(e);
    if (v >= 1) { off(); done?.(); }
  });
}

export const lg: Record<string, unknown> = {};
export { StyleSheet };
