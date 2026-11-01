// index.js — entrée React Native réelle : WaveOS natif, pas de WebView.
import { AppRegistry, Dimensions } from "react-native";

// Shim DOM minimal AVANT tout import métier : les fichiers partagés contiennent
// encore quelques accès document/window (protégés ou no-op ici).
const el = () => ({
  style: {}, dataset: {}, children: [], textContent: "",
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  append() {}, prepend() {}, remove() {}, setAttribute() {}, removeAttribute() {},
  addEventListener() {}, removeEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }),
  querySelector: () => null, querySelectorAll: () => [], closest: () => null, matches: () => false,
  offsetWidth: 0, offsetHeight: 0, offsetLeft: 0, offsetTop: 0, isConnected: true,
  getContext: () => null, toDataURL: () => "",
});
global.document = global.document ?? {
  createElement: el, createElementNS: el, getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [],
  body: { append() {}, prepend() {}, style: {}, dataset: {} },
  head: { append() {}, prepend() {} },
  documentElement: { style: { setProperty() {} }, dataset: {} },
  activeElement: null,
  visibilityState: "visible",
  addEventListener() {}, removeEventListener() {},
};
const { width, height } = Dimensions.get("window");
global.window = global.window ?? global;
global.innerWidth = width;
global.innerHeight = height;
global.requestAnimationFrame = global.requestAnimationFrame ?? ((f) => setTimeout(() => f(Date.now()), 16));
global.performance = global.performance ?? { now: () => Date.now() };
global.location = global.location ?? { search: "?native" };
global.getComputedStyle = global.getComputedStyle ?? (() => ({ getPropertyValue: () => "", borderTopLeftRadius: "0px", width: "0", height: "0", boxSizing: "border-box", position: "static" }));
global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} };
global.MutationObserver = global.MutationObserver ?? class { observe() {} disconnect() {} };
global.ImageData = global.ImageData ?? class { constructor(px, w, h) { this.data = px; this.width = w; this.height = h; } };
global.addEventListener = global.addEventListener ?? (() => {});
global.removeEventListener = global.removeEventListener ?? (() => {});
global.navigator = global.navigator ?? { product: "ReactNative", language: "en", userAgent: "WaveOS" };
global.devicePixelRatio = global.devicePixelRatio ?? 3;
const mem = new Map();
global.localStorage = global.localStorage ?? {
  getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
  setItem: (k, v) => mem.set(String(k), String(v)),
  removeItem: (k) => mem.delete(String(k)),
  clear: () => mem.clear(),
};
global.sessionStorage = global.sessionStorage ?? global.localStorage;

// DOM globals manquants sous Hermes — stubs neutres pour instanceof / appels résiduels.
class FakeEvent { constructor(type, init) { this.type = type; Object.assign(this, init); }
  preventDefault() {} stopPropagation() {} }
global.Event = global.Event ?? FakeEvent;
for (const k of ["CustomEvent", "PointerEvent", "MouseEvent", "TouchEvent", "KeyboardEvent",
  "WheelEvent", "InputEvent", "FocusEvent", "AnimationEvent", "TransitionEvent"]) {
  global[k] = global[k] ?? FakeEvent;
}
for (const k of ["Node", "Element", "HTMLElement", "SVGElement", "HTMLInputElement",
  "HTMLCanvasElement", "Comment", "Text", "DocumentFragment"]) {
  global[k] = global[k] ?? class {};
}
global.matchMedia = global.matchMedia ?? ((q) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
}));
global.crypto = global.crypto ?? {
  getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; },
  randomUUID: () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16), v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }),
};
global.document.fonts = global.document.fonts ?? { ready: Promise.resolve(), add() {}, delete() {}, check: () => true };
global.document.cookie = "";
global.document.title = "WaveOS";
global.Image = global.Image ?? class { set src(v) { this._src = v; this.onload?.(); } get src() { return this._src; } };
global.screen = global.screen ?? { width, height, availWidth: width, availHeight: height, orientation: { type: "portrait-primary", angle: 0 } };
global.history = global.history ?? { pushState() {}, replaceState() {}, back() {}, forward() {}, go() {}, state: null, length: 1 };
global.structuredClone = global.structuredClone ?? ((v) => JSON.parse(JSON.stringify(v)));
global.requestIdleCallback = global.requestIdleCallback ?? ((f) => setTimeout(() => f({ didTimeout: false, timeRemaining: () => 50 }), 1));
global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} };
global.alert = global.alert ?? (() => {});
global.confirm = global.confirm ?? (() => false);
global.prompt = global.prompt ?? (() => null);

try {
  global.ErrorUtils?.setGlobalHandler?.((e) => { console.error("WaveOS JS error:", e); });
} catch (e) { /* noop */ }

const App = require("../src/rn/App.native").default;
AppRegistry.registerComponent("WaveOS", () => App);
